-- Institute Enquiry Management System Database Schema
-- Designed for PostgreSQL / MySQL compatibility

-- 1. Users Table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Counsellor', -- e.g., Admin, Counsellor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Enquiries Table
CREATE TABLE enquiries (
    enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_name VARCHAR(150) NOT NULL,
    mobile_no VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    qualification VARCHAR(150),
    current_status VARCHAR(50) DEFAULT 'New', -- e.g., New, Follow Up, Converted, Closed
    course_interested VARCHAR(150),
    source VARCHAR(100), -- e.g., Website, Walk-in, Referral
    remarks TEXT,
    assigned_to INT, -- Links to the user/counsellor handling this enquiry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 3. Followups Table
CREATE TABLE followups (
    followup_id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL,
    followup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_followup_date TIMESTAMP,
    discussion_notes TEXT,
    status VARCHAR(50) DEFAULT 'Completed', -- e.g., Completed, Pending, No Response
    created_by INT, -- User who conducted the follow-up
    
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. Admissions Table
CREATE TABLE admissions (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL UNIQUE, -- 1:1 relationship with enquiry once converted
    admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    course_enrolled VARCHAR(150) NOT NULL,
    total_fees DECIMAL(10, 2) NOT NULL,
    fees_paid DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active', -- e.g., Active, Dropped, Completed
    processed_by INT,
    
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_enquiry_status ON enquiries(current_status);
CREATE INDEX idx_enquiry_mobile ON enquiries(mobile_no);
CREATE INDEX idx_followup_next_date ON followups(next_followup_date);
