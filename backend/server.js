require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Initialize SQLite Database
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    db.serialize(() => {
      // Create enquiries table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentName TEXT NOT NULL,
        mobileNumber TEXT NOT NULL,
        whatsappNumber TEXT,
        email TEXT,
        age TEXT,
        qualification TEXT,
        occupation TEXT,
        courseInterested TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating enquiries table:', err.message);
      });

      // Try adding status column if it's an older db
      db.run(`ALTER TABLE enquiries ADD COLUMN status TEXT DEFAULT 'New'`, (err) => {
        // Ignore error if column already exists
        if (!err) console.log('Added status column to enquiries.');
      });

      // Create follow_ups table
      db.run(`CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enquiryId INTEGER NOT NULL,
        note TEXT NOT NULL,
        nextFollowUpDate TEXT,
        status TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiryId) REFERENCES enquiries(id)
      )`, (err) => {
        if (err) console.error('Error creating follow_ups table:', err.message);
      });

      // Create admissions table
      db.run(`CREATE TABLE IF NOT EXISTS admissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enquiryId INTEGER NOT NULL,
        studentName TEXT NOT NULL,
        mobileNumber TEXT NOT NULL,
        courseInterested TEXT NOT NULL,
        admissionDate TEXT NOT NULL,
        fees TEXT NOT NULL,
        batchTiming TEXT NOT NULL,
        mode TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enquiryId) REFERENCES enquiries(id)
      )`, (err) => {
        if (err) console.error('Error creating admissions table:', err.message);
      });
      // Create users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (!err && row.count === 0) {
              const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
              stmt.run('Admin', 'admin@sec.edu', 'admin123', 'Admin');
              stmt.run('Counsellor', 'counsellor@sec.edu', 'counsellor123', 'Counsellor');
              stmt.finalize();
              console.log('Seeded initial admin and counsellor users.');
            }
          });
        }
      });
    });
  }
});

// POST /api/enquiries - Create a new enquiry
app.post('/api/enquiries', (req, res) => {
  const {
    studentName, mobileNumber, whatsappNumber, email, 
    age, qualification, occupation, courseInterested, source
  } = req.body;

  if (!studentName || !mobileNumber || !courseInterested || !source) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `INSERT INTO enquiries (
    studentName, mobileNumber, whatsappNumber, email, 
    age, qualification, occupation, courseInterested, source, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`;

  const params = [
    studentName, mobileNumber, whatsappNumber, email,
    age, qualification, occupation, courseInterested, source
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting data:', err.message);
      return res.status(500).json({ message: 'Failed to save to database' });
    }
    res.status(201).json({ message: 'Enquiry saved successfully', id: this.lastID });
  });
});

// GET /api/enquiries - Fetch all enquiries
app.get('/api/enquiries', (req, res) => {
  const sql = `SELECT * FROM enquiries ORDER BY createdAt DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve enquiries' });
    res.json(rows);
  });
});

// DELETE /api/enquiries/:id - Delete an enquiry
app.delete('/api/enquiries/:id', (req, res) => {
  const id = req.params.id;
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(`DELETE FROM follow_ups WHERE enquiryId = ?`, id);
    db.run(`DELETE FROM enquiries WHERE id = ?`, id, function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Failed to delete enquiry' });
      }
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ message: 'Enquiry not found' });
      }
      db.run('COMMIT');
      res.json({ message: 'Enquiry deleted successfully' });
    });
  });
});

// PUT /api/enquiries/:id - Update an enquiry
app.put('/api/enquiries/:id', (req, res) => {
  const id = req.params.id;
  const {
    studentName, mobileNumber, whatsappNumber, email, 
    age, qualification, occupation, courseInterested, source
  } = req.body;

  if (!studentName || !mobileNumber || !courseInterested || !source) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `UPDATE enquiries SET
    studentName = ?, mobileNumber = ?, whatsappNumber = ?, email = ?, 
    age = ?, qualification = ?, occupation = ?, courseInterested = ?, source = ?
    WHERE id = ?`;

  const params = [
    studentName, mobileNumber, whatsappNumber, email,
    age, qualification, occupation, courseInterested, source,
    id
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating data:', err.message);
      return res.status(500).json({ message: 'Failed to update enquiry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    res.json({ message: 'Enquiry updated successfully' });
  });
});

// GET /api/follow-ups - Fetch all follow-ups with enquiry details
app.get('/api/follow-ups', (req, res) => {
  const sql = `
    SELECT f.*, e.studentName, e.mobileNumber, e.courseInterested 
    FROM follow_ups f
    JOIN enquiries e ON f.enquiryId = e.id
    ORDER BY f.createdAt DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve follow-ups' });
    res.json(rows);
  });
});

// GET /api/enquiries/:id/follow-ups - Fetch follow-ups for specific enquiry
app.get('/api/enquiries/:id/follow-ups', (req, res) => {
  const sql = `SELECT * FROM follow_ups WHERE enquiryId = ? ORDER BY createdAt DESC`;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve follow-ups' });
    res.json(rows);
  });
});

// POST /api/follow-ups - Create a follow-up and update enquiry status
app.post('/api/follow-ups', (req, res) => {
  const { enquiryId, note, nextFollowUpDate, status } = req.body;
  if (!enquiryId || !note || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const sqlInsert = `INSERT INTO follow_ups (enquiryId, note, nextFollowUpDate, status) VALUES (?, ?, ?, ?)`;
    db.run(sqlInsert, [enquiryId, note, nextFollowUpDate, status], function(err) {
      if (err) {
        db.run('ROLLBACK');
        console.error(err);
        return res.status(500).json({ message: 'Failed to save follow-up' });
      }

      const sqlUpdate = `UPDATE enquiries SET status = ? WHERE id = ?`;
      db.run(sqlUpdate, [status, enquiryId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error(err);
          return res.status(500).json({ message: 'Failed to update enquiry status' });
        }

        db.run('COMMIT');
        res.status(201).json({ message: 'Follow-up added successfully' });
      });
    });
  });
});

// POST /api/admissions - Create an admission
app.post('/api/admissions', (req, res) => {
  const { enquiryId, studentName, mobileNumber, courseInterested, admissionDate, fees, batchTiming, mode } = req.body;
  
  if (!enquiryId || !studentName || !mobileNumber || !courseInterested || !admissionDate || !fees || !batchTiming || !mode) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const sqlInsert = `INSERT INTO admissions (enquiryId, studentName, mobileNumber, courseInterested, admissionDate, fees, batchTiming, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sqlInsert, [enquiryId, studentName, mobileNumber, courseInterested, admissionDate, fees, batchTiming, mode], function(err) {
      if (err) {
        db.run('ROLLBACK');
        console.error(err);
        return res.status(500).json({ message: 'Failed to save admission' });
      }

      const admissionId = this.lastID;

      const sqlUpdate = `UPDATE enquiries SET status = 'Admission Confirmed' WHERE id = ?`;
      db.run(sqlUpdate, [enquiryId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error(err);
          return res.status(500).json({ message: 'Failed to update enquiry status' });
        }

        db.run('COMMIT');
        res.status(201).json({ message: 'Admission created successfully', id: admissionId });
      });
    });
  });
});

// GET /api/admissions - Fetch all admissions
app.get('/api/admissions', (req, res) => {
  const sql = `SELECT * FROM admissions ORDER BY createdAt DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve admissions' });
    res.json(rows);
  });
});

// GET /api/admissions/:id - Fetch single admission by ID
app.get('/api/admissions/:id', (req, res) => {
  const sql = `SELECT * FROM admissions WHERE id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve admission' });
    if (!row) return res.status(404).json({ message: 'Admission not found' });
    res.json(row);
  });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error during login' });
    if (!row) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ message: 'Login successful', user: row });
  });
});

// GET /api/users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve users' });
    res.json(rows);
  });
});

// POST /api/users
app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: 'Failed to create user' });
    }
    res.status(201).json({ message: 'User created successfully', id: this.lastID });
  });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', id, function(err) {
    if (err) {
      console.error('Error deleting user:', err.message);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
