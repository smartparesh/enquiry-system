import { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import './Settings.css';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Counsellor' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON (e.g. 502 Bad Gateway from localtunnel or 429 Rate Limit plain text)
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        setFormData({ name: '', email: '', password: '', role: 'Counsellor' });
        setShowAddForm(false);
        fetchUsers(); // Refresh list
      } else {
        setError(data?.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Network error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Network error');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: 'role',
      render: (row) => (
        <span className={`role-badge ${row.role.toLowerCase()}`}>
          {row.role === 'Admin' ? <Shield size={14} /> : <User size={14} />}
          {row.role}
        </span>
      )
    },
    { header: 'Created', accessor: 'createdAt' }
  ];

  if (currentUser?.role === 'Admin') {
    columns.push({
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        if (row.email === currentUser.email) return null;
        return (
          <button 
            className="action-btn delete" 
            onClick={() => handleDeleteUser(row.dbId)}
            title="Delete User"
          >
            <Trash2 size={16} />
          </button>
        );
      }
    });
  }

  const tableData = users.map(u => ({
    id: `USR${String(u.id).padStart(3, '0')}`,
    dbId: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: new Date(u.createdAt).toLocaleDateString()
  }));

  return (
    <div className="settings-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system access and roles.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<UserPlus size={16} />} 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="add-user-card">
          <h2 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Create New Account</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleCreateUser} className="add-user-form">
            <div className="form-grid">
              <Input 
                id="name"
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input 
                id="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input 
                id="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <Select 
                id="role"
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                options={['Counsellor', 'Admin']}
              />
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary">Create Account</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading users...</div>
        ) : (
          <Table columns={columns} data={tableData} />
        )}
      </Card>
    </div>
  );
};

export default Settings;
