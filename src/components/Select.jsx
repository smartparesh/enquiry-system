import './Input.css';

const Select = ({ label, id, error, options, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <select 
        id={id} 
        className={`input-field ${error ? 'input-error' : ''}`} 
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt, index) => (
          <option key={index} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Select;
