import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Admissions = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admissions`);
      if (response.ok) {
        const jsonData = await response.json();
        const mappedData = jsonData.map(adm => ({
          dbId: adm.id,
          id: `ADM${String(adm.id).padStart(3, '0')}`,
          name: adm.studentName,
          phone: adm.mobileNumber,
          course: adm.courseInterested,
          date: new Date(adm.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fees: `₹${adm.fees}`,
          timing: adm.batchTiming,
          mode: adm.mode
        }));
        setData(mappedData);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Admission ID', accessor: 'id' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Mobile', accessor: 'phone' },
    { header: 'Course', accessor: 'course' },
    { header: 'Admission Date', accessor: 'date' },
    { header: 'Fees Paid', accessor: 'fees' },
    { header: 'Batch Timing', accessor: 'timing' },
    { 
      header: 'Mode', 
      accessor: 'mode',
      render: (row) => (
        <span style={{ 
          padding: '4px 8px', 
          backgroundColor: 'var(--background)', 
          borderRadius: '4px',
          fontSize: '0.85rem'
        }}>
          {row.mode}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="actions-cell">
          <button 
            className="action-btn" 
            onClick={() => navigate(`/receipt/${row.dbId}`)} 
            title="View Receipt"
            style={{ color: 'var(--primary)' }}
          >
            <FileText size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Admissions</h1>
        <p className="page-subtitle">View and manage converted students and their details.</p>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading admissions...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No admissions found yet. Convert an enquiry to see it here.
          </div>
        ) : (
          <Table columns={columns} data={data} />
        )}
      </Card>
    </div>
  );
};

export default Admissions;
