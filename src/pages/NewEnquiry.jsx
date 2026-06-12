import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import './NewEnquiry.css';
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
  'Walk-In',
  'Facebook',
  'Instagram',
  'Website',
  'Reference',
  'JustDial',
  'Google'
];

const initialFormState = {
  studentName: '',
  mobileNumber: '',
  whatsappNumber: '',
  email: '',
  age: '',
  qualification: '',
  occupation: '',
  courseInterested: '',
  source: ''
};

const NewEnquiry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear error for the field being edited
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }
    
    if (!formData.courseInterested) newErrors.courseInterested = 'Please select a course';
    if (!formData.source) newErrors.source = 'Please select a source';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Enquiry saved successfully!');
        navigate('/enquiries');
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving enquiry:', error);
      alert('Failed to connect to the server. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-enquiry">
      <div className="page-header">
        <h1 className="page-title">New Enquiry</h1>
        <p className="page-subtitle">Capture details for a new student enquiry.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="enquiry-form">
          <div className="form-section">
            <h3 className="section-title">Personal Details</h3>
            <div className="form-grid">
              <Input 
                label="Student Name *" 
                id="studentName" 
                value={formData.studentName}
                onChange={handleChange}
                error={errors.studentName}
                placeholder="Full Name" 
              />
              <Input 
                label="Age" 
                id="age" 
                type="number"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 20" 
              />
              <Input 
                label="Qualification" 
                id="qualification" 
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g., B.Sc" 
              />
              <Input 
                label="Occupation" 
                id="occupation" 
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g., Student" 
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="form-grid">
              <Input 
                label="Mobile Number *" 
                id="mobileNumber" 
                type="tel" 
                value={formData.mobileNumber}
                onChange={handleChange}
                error={errors.mobileNumber}
                placeholder="10 digit number" 
              />
              <Input 
                label="WhatsApp Number" 
                id="whatsappNumber" 
                type="tel" 
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="10 digit number" 
              />
              <div className="full-width">
                <Input 
                  label="Email Address" 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com" 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Course & Source</h3>
            <div className="form-grid">
              <Select 
                label="Course Interested *" 
                id="courseInterested" 
                value={formData.courseInterested}
                onChange={handleChange}
                error={errors.courseInterested}
                options={COURSE_OPTIONS}
              />
              <Select 
                label="Source *" 
                id="source" 
                value={formData.source}
                onChange={handleChange}
                error={errors.source}
                options={SOURCE_OPTIONS}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset} 
              icon={<RefreshCw size={16} />}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={<Save size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Enquiry'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewEnquiry;
