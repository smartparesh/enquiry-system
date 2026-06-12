import { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import FollowUpModal from '../components/FollowUpModal';
import { MessageCircle } from 'lucide-react';
import '../pages/EnquiryList.css'; // Reuse badge styles
import { API_URL } from '../config';

const FollowUps = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`${API_URL}/api/follow-ups`);
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Error fetching follow ups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const categorizedData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Group by enquiryId to only show the LATEST follow-up for each enquiry
    const latestFollowUpsMap = new Map();
    data.forEach(item => {
      // Assuming data is sorted by createdAt DESC (which our API does)
      if (!latestFollowUpsMap.has(item.enquiryId)) {
        latestFollowUpsMap.set(item.enquiryId, item);
      }
    });
    
    const latestFollowUps = Array.from(latestFollowUpsMap.values());
    
    const missed = [];
    const today = [];
    const upcoming = [];

    latestFollowUps.forEach(item => {
      if (!item.nextFollowUpDate) return;
      
      const mappedRow = {
        dbId: item.enquiryId,
        id: `ENQ${String(item.enquiryId).padStart(3, '0')}`,
        name: item.studentName,
        phone: item.mobileNumber,
        course: item.courseInterested,
        status: item.status,
        note: item.note,
        nextDate: item.nextFollowUpDate
      };

      if (item.nextFollowUpDate < todayStr) {
        missed.push(mappedRow);
      } else if (item.nextFollowUpDate === todayStr) {
        today.push(mappedRow);
      } else {
        upcoming.push(mappedRow);
      }
    });

    return { missed, today, upcoming };
  }, [data]);

  const columns = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Mobile', accessor: 'phone' },
    { header: 'Course', accessor: 'course' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        let statusClass = 'status-new';
        if (row.status === 'Interested') statusClass = 'status-interested';
        if (row.status === 'Not Interested') statusClass = 'status-not-interested';
        if (row.status === 'Call Back') statusClass = 'status-call-back';
        if (row.status === 'Admission Confirmed') statusClass = 'status-confirmed';
        return <span className={`status-badge ${statusClass}`}>{row.status}</span>;
      }
    },
    { header: 'Last Note', accessor: 'note' },
    { header: 'Scheduled Date', accessor: 'nextDate', render: (row) => new Date(row.nextDate).toLocaleDateString() },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <div className="actions-cell">
          <button className="action-btn" onClick={() => setSelectedEnquiry(row)} title="Add Follow-up">
            <MessageCircle size={18} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading follow-ups...</div>;
  }

  return (
    <div className="follow-ups-page">
      <div className="page-header">
        <h1 className="page-title">Follow-ups Management</h1>
        <p className="page-subtitle">Track and manage your scheduled calls and meetings.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Card title={`Today's Follow-ups (${categorizedData.today.length})`}>
          <Table columns={columns} data={categorizedData.today} />
        </Card>

        <Card title={`Missed Follow-ups (${categorizedData.missed.length})`}>
          <div style={{ color: 'var(--error-color)', marginBottom: '12px', fontSize: '0.875rem' }}>
            These enquiries missed their scheduled follow-up date!
          </div>
          <Table columns={columns} data={categorizedData.missed} />
        </Card>

        <Card title={`Upcoming Follow-ups (${categorizedData.upcoming.length})`}>
          <Table columns={columns} data={categorizedData.upcoming} />
        </Card>
      </div>

      {selectedEnquiry && (
        <FollowUpModal 
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onSave={() => {
            setSelectedEnquiry(null);
            fetchFollowUps(); // Refresh lists
          }}
        />
      )}
    </div>
  );
};

export default FollowUps;
