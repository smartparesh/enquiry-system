import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import './AdmissionReceipt.css';
import { API_URL } from '../config';

const AdmissionReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmission();
  }, [id]);

  const fetchAdmission = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admissions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAdmission(data);
      } else {
        alert('Admission not found');
        navigate('/admissions');
      }
    } catch (error) {
      console.error('Error fetching admission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading receipt...</div>;
  if (!admission) return null;

  const receiptNo = `REC-${String(admission.id).padStart(4, '0')}`;
  const formattedDate = new Date(admission.admissionDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="receipt-page">
      <div className="receipt-container">
        {/* Actions Bar (Hidden on Print) */}
        <div className="receipt-actions">
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="primary" icon={<Printer size={16} />} onClick={handlePrint}>
            Print Receipt
          </Button>
        </div>

        {/* Printable Content */}
        <div className="receipt-content">
          <div className="receipt-header">
            <div className="receipt-institute">
              <h1>SMART EDUCATION CENTRE</h1>
              <p>123 Learning Avenue, Tech District</p>
              <p>Phone: +91 9876543210 | Email: contact@smarteducation.com</p>
            </div>
            <div className="receipt-meta">
              <h2 className="receipt-title">Admission Receipt</h2>
              <p>Receipt No: <span>{receiptNo}</span></p>
              <p>Date: <span>{formattedDate}</span></p>
            </div>
          </div>

          <div className="receipt-body">
            <div className="details-box">
              <h3>Student Details</h3>
              <div className="detail-row">
                <span className="detail-label">Student Name:</span>
                <span className="detail-value">{admission.studentName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mobile Number:</span>
                <span className="detail-value">{admission.mobileNumber}</span>
              </div>
            </div>

            <div className="details-box">
              <h3>Course Details</h3>
              <div className="detail-row">
                <span className="detail-label">Course Enrolled:</span>
                <span className="detail-value">{admission.courseInterested}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch Timing:</span>
                <span className="detail-value">{admission.batchTiming}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mode of Learning:</span>
                <span className="detail-value">{admission.mode}</span>
              </div>
            </div>

            <div className="amount-box">
              <span className="amount-label">Fees Paid:</span>
              <span className="amount-value">₹{admission.fees}/-</span>
            </div>
          </div>

          <div className="receipt-footer">
            <div className="signature-box">
              <div className="signature-line">Student Signature</div>
            </div>
            <div className="signature-box">
              <div className="signature-line">Authorized Signatory</div>
            </div>
          </div>

          <div className="footer-note">
            This is a computer-generated receipt and does not require a physical signature. Fees once paid are not refundable.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionReceipt;
