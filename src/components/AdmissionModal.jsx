import { useState, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import './AdmissionModal.css';
import { API_URL } from '../config';

const MODE_OPTIONS = [
  'Offline',
  'Online',
  'Recording'
];

const AdmissionModal = ({ enquiry, onClose, onSave }) => {
  const navigate = useNavigate();
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [fees, setFees] = useState('');
  const [batchTiming, setBatchTiming] = useState('');
  const [mode, setMode] = useState('Offline');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fees || !batchTiming) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: enquiry.dbId,
          studentName: enquiry.name,
          mobileNumber: enquiry.phone,
          courseInterested: enquiry.course,
          admissionDate,
          fees,
          batchTiming,
          mode
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSave(); // Refresh parent lists
        // Navigate to receipt page
        navigate(`/receipt/${data.id}`);
      } else {
        const err = await response.json();
        alert(`Failed to save: ${err.message}`);
      }
    } catch (error) {
      console.error('Error saving admission:', error);
      alert('Server error while saving admission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enquiry) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admission-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottomColor: 'var(--secondary)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
            <Award size={24} />
            Convert to Admission
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="student-summary">
            <div className="summary-item">
              <span className="summary-label">Student Name</span>
              <span className="summary-value">{enquiry.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Course</span>
              <span className="summary-value">{enquiry.course}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Mobile</span>
              <span className="summary-value">{enquiry.phone}</span>
            </div>
          </div>

          <form className="admission-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input 
                label="Admission Date *" 
                id="admissionDate" 
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                required
              />
              <Input 
                label="Fees Amount (₹) *" 
                id="fees" 
                type="number"
                placeholder="e.g. 5000"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <Input 
                label="Batch Timing *" 
                id="batchTiming" 
                placeholder="e.g. 10 AM to 11 AM"
                value={batchTiming}
                onChange={(e) => setBatchTiming(e.target.value)}
                required
              />
              <Select 
                label="Mode *" 
                id="mode" 
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                options={MODE_OPTIONS}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--secondary)' }} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Admission & Generate Receipt'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;
