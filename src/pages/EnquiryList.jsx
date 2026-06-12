import { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { Plus, Eye, Edit, Trash2, MessageCircle, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FollowUpModal from '../components/FollowUpModal';
import AdmissionModal from '../components/AdmissionModal';
import EnquiryDetailsModal from '../components/EnquiryDetailsModal';
import EditEnquiryModal from '../components/EditEnquiryModal';
import { useAuth } from '../context/AuthContext';
import './EnquiryList.css';
import { API_URL } from '../config';

const COURSE_OPTIONS = [
  'All Courses',
  'MS-CIT',
  'Tally Prime',
  'Advanced Excel',
  'Python',
  'Java',
  'MySQL',
  'Data Analysis',
  'Graphic Designing',
  'DTP',
  'English Speaking'
];

const EnquiryList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [selectedAdmissionEnquiry, setSelectedAdmissionEnquiry] = useState(null);
  const [selectedViewEnquiry, setSelectedViewEnquiry] = useState(null);
  const [selectedEditEnquiry, setSelectedEditEnquiry] = useState(null);

  // Filters state
  const [searchName, setSearchName] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchCourse, setSearchCourse] = useState('All Courses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEnquiries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/enquiries`);
      if (response.ok) {
        const jsonData = await response.json();
        const mappedData = jsonData.map(enq => ({
          dbId: enq.id, // keep original ID for deletion
          id: `ENQ${String(enq.id).padStart(3, '0')}`,
          name: enq.studentName,
          course: enq.courseInterested,
          phone: enq.mobileNumber,
          dateObj: new Date(enq.createdAt), // keep Date object for range filtering
          date: new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: enq.status || 'New', // Use actual status from DB
          rawData: enq
        }));
        setData(mappedData);
      } else {
        console.error('Failed to fetch enquiries');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(enq => {
      const matchName = enq.name.toLowerCase().includes(searchName.toLowerCase());
      const matchMobile = enq.phone.includes(searchMobile);
      const matchCourse = searchCourse === 'All Courses' || enq.course === searchCourse;
      
      let matchDate = true;
      if (startDate || endDate) {
        const enqTime = enq.dateObj.getTime();
        if (startDate && endDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          matchDate = enqTime >= start && enqTime <= end;
        } else if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          matchDate = enqTime >= start;
        } else if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          matchDate = enqTime <= end;
        }
      }

      return matchName && matchMobile && matchCourse && matchDate;
    });
  }, [data, searchName, searchMobile, searchCourse, startDate, endDate]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchMobile, searchCourse, startDate, endDate]);

  // Pagination Data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleDelete = async (dbId) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const response = await fetch(`${API_URL}/api/enquiries/${dbId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setData(prev => prev.filter(enq => enq.dbId !== dbId));
        } else {
          alert('Failed to delete enquiry');
        }
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert('Server error while deleting');
      }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Mobile', accessor: 'phone' },
    { header: 'Course', accessor: 'course' },
    { header: 'Enquiry Date', accessor: 'date' },
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
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn" onClick={() => setSelectedViewEnquiry(row)} title="View Details">
            <Eye size={18} />
          </button>
          {user?.role === 'Admin' && (
            <button className="action-btn" onClick={() => setSelectedAdmissionEnquiry(row)} title="Convert to Admission" style={{ color: 'var(--secondary)' }}>
              <Award size={18} />
            </button>
          )}
          <button className="action-btn" onClick={() => setSelectedEditEnquiry(row)} title="Edit Enquiry">
            <Edit size={18} />
          </button>
          <button className="action-btn" onClick={() => setSelectedEnquiry(row)} title="Add Follow-up">
            <MessageCircle size={18} />
          </button>
          {user?.role === 'Admin' && (
            <button className="action-btn delete" onClick={() => handleDelete(row.dbId)} title="Delete Enquiry">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="enquiry-list">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-subtitle">Manage all student enquiries here.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/new-enquiry')}
        >
          New Enquiry
        </Button>
      </div>

      <Card>
        {/* Filters Section */}
        <div className="filters-container">
          <Input 
            id="searchName"
            placeholder="Search by student name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <Input 
            id="searchMobile"
            placeholder="Search by mobile number..."
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
          />
          <Select 
            id="searchCourse"
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
            options={COURSE_OPTIONS}
          />
          <Input 
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
          />
          <Input 
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
          />
        </div>

        {/* Table Section */}
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading enquiries...</div>
        ) : (
          <>
            <Table columns={columns} data={paginatedData} />
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="pagination-buttons">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      
      {selectedEnquiry && (
        <FollowUpModal 
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onSave={() => {
            setSelectedEnquiry(null);
            fetchEnquiries();
          }}
        />
      )}

      {selectedAdmissionEnquiry && (
        <AdmissionModal 
          enquiry={selectedAdmissionEnquiry}
          onClose={() => setSelectedAdmissionEnquiry(null)}
          onSave={() => {
            setSelectedAdmissionEnquiry(null);
            fetchEnquiries();
          }}
        />
      )}

      {selectedViewEnquiry && (
        <EnquiryDetailsModal 
          enquiryRow={selectedViewEnquiry}
          onClose={() => setSelectedViewEnquiry(null)}
        />
      )}

      {selectedEditEnquiry && (
        <EditEnquiryModal 
          enquiryRow={selectedEditEnquiry}
          onClose={() => setSelectedEditEnquiry(null)}
          onSave={() => {
            setSelectedEditEnquiry(null);
            fetchEnquiries();
          }}
        />
      )}
    </div>
  );
};

export default EnquiryList;
