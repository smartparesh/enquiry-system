import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import './FollowUpModal.css';
import { API_URL } from '../config';

const STATUS_OPTIONS = [
  'New',
  'Interested',
  'Not Interested',
  'Call Back',
  'Admission Confirmed'
];

const FollowUpModal = ({ enquiry, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [status, setStatus] = useState(enquiry?.status || 'New');
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (enquiry) {
      setStatus(enquiry.status || 'New');
      fetchHistory();
    }
  }, [enquiry]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enquiries/${enquiry.dbId}/follow-ups`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      alert('Please enter a note.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId: enquiry.dbId,
          note,
          nextFollowUpDate: nextDate || null,
          status
        })
      });

      if (response.ok) {
        onSave(); // Trigger parent refresh
      } else {
        const err = await response.json();
        alert(`Failed to save: ${err.message}`);
      }
    } catch (error) {
      console.error('Error saving follow-up:', error);
      alert('Server error while saving follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enquiry) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Follow-up: {enquiry.name}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <form className="follow-up-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select 
                label="Status" 
                id="status" 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
              <Input 
                label="Next Follow-up Date" 
                id="nextDate" 
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="note" style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Note *
              </label>
              <textarea 
                id="note" 
                placeholder="Enter details of the conversation..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" variant="primary" icon={<Save size={16} />} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>

          <div className="history-section">
            <h3>Follow-up History</h3>
            {loadingHistory ? (
              <p>Loading history...</p>
            ) : history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No previous follow-ups found.</p>
            ) : (
              <div className="history-list">
                {history.map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <span className="history-item-date">{new Date(item.createdAt).toLocaleString()}</span>
                      <span className="history-item-status">{item.status}</span>
                    </div>
                    <p className="history-item-note">{item.note}</p>
                    {item.nextFollowUpDate && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Next Follow-up: {new Date(item.nextFollowUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;
