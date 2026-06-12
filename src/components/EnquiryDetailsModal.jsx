import { X, Phone, MessageCircle } from 'lucide-react';
import Button from './Button';
import AIAssistant from './AIAssistant';
import './AdmissionModal.css'; // We can reuse the same modal styling
import './EnquiryDetailsModal.css';

const EnquiryDetailsModal = ({ enquiryRow, onClose }) => {
  if (!enquiryRow) return null;

  const data = enquiryRow.rawData;

  const handleWhatsApp = () => {
    // Ensure number is formatted for WhatsApp (remove spaces, add country code if missing)
    let phone = data.whatsappNumber || data.mobileNumber;
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone; // Default to India country code if exactly 10 digits
    }

    const message = `Hello ${data.studentName},

Thank you for contacting Smart Education Centre.

Course: ${data.courseInterested}

Please let us know if you need any assistance.

Regards,
Smart Education Centre`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${data.mobileNumber}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enquiry Details</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <AIAssistant enquiry={data} />
          
          <div className="details-grid">
            <div className="detail-group">
              <label>Student Name</label>
              <p>{data.studentName}</p>
            </div>
            <div className="detail-group">
              <label>Mobile Number</label>
              <p>{data.mobileNumber}</p>
            </div>
            <div className="detail-group">
              <label>WhatsApp Number</label>
              <p>{data.whatsappNumber || '-'}</p>
            </div>
            <div className="detail-group">
              <label>Email</label>
              <p>{data.email || '-'}</p>
            </div>
            <div className="detail-group">
              <label>Age</label>
              <p>{data.age || '-'}</p>
            </div>
            <div className="detail-group">
              <label>Qualification</label>
              <p>{data.qualification || '-'}</p>
            </div>
            <div className="detail-group">
              <label>Occupation</label>
              <p>{data.occupation || '-'}</p>
            </div>
            <div className="detail-group">
              <label>Course Interested</label>
              <p>{data.courseInterested}</p>
            </div>
            <div className="detail-group">
              <label>Source</label>
              <p>{data.source}</p>
            </div>
            <div className="detail-group">
              <label>Status</label>
              <p><span className={`status-badge status-${data.status.toLowerCase().replace(' ', '-')}`}>{data.status}</span></p>
            </div>
            <div className="detail-group">
              <label>Enquiry Date</label>
              <p>{new Date(data.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="contact-actions">
            <Button variant="secondary" icon={<Phone size={18} />} onClick={handleCall}>
              Call Student
            </Button>
            <Button variant="primary" icon={<MessageCircle size={18} />} onClick={handleWhatsApp} style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}>
              Send WhatsApp Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailsModal;
