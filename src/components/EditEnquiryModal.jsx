import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import './AdmissionModal.css';
import { API_URL } from '../config';

const COURSE_OPTIONS = [
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

const SOURCE_OPTIONS = [
  'Website',
  'Social Media',
  'Friend Referral',
  'Walk-in',
  'Advertisement',
  'Other'
];

const EditEnquiryModal = ({ enquiryRow, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    age: '',
    qualification: '',
    occupation: '',
    courseInterested: '',
    source: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (enquiryRow && enquiryRow.rawData) {
      setFormData({
        studentName: enquiryRow.rawData.studentName || '',
        mobileNumber: enquiryRow.rawData.mobileNumber || '',
        whatsappNumber: enquiryRow.rawData.whatsappNumber || '',
        email: enquiryRow.rawData.email || '',
        age: enquiryRow.rawData.age || '',
        qualification: enquiryRow.rawData.qualification || '',
        occupation: enquiryRow.rawData.occupation || '',
        courseInterested: enquiryRow.rawData.courseInterested || '',
        source: enquiryRow.rawData.source || ''
      });
    }
  }, [enquiryRow]);

  if (!enquiryRow) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/enquiries/${enquiryRow.dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update enquiry');
      }
    } catch (err) {
      setError('Network error. Failed to update enquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Enquiry</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        {error && <div style={{ padding: '12px', color: '#b91c1c', backgroundColor: '#fef2f2', margin: '16px', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <Input 
              id="studentName"
              label="Student Name"
              value={formData.studentName}
              onChange={(e) => setFormData({...formData, studentName: e.target.value})}
              required
            />
            <Input 
              id="mobileNumber"
              label="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
              required
            />
            <Input 
              id="whatsappNumber"
              label="WhatsApp Number"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
            />
            <Input 
              id="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input 
              id="age"
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
            <Input 
              id="qualification"
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({...formData, qualification: e.target.value})}
            />
            <Input 
              id="occupation"
              label="Occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
            />
            <Select 
              id="courseInterested"
              label="Course Interested"
              options={['', ...COURSE_OPTIONS]}
              value={formData.courseInterested}
              onChange={(e) => setFormData({...formData, courseInterested: e.target.value})}
              required
            />
            <Select 
              id="source"
              label="Source"
              options={['', ...SOURCE_OPTIONS]}
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              required
            />
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" icon={<Save size={18} />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEnquiryModal;
