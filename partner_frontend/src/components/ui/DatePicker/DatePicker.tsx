import React from 'react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Note: This is a foundational mock for Phase 1. 
// Will be replaced with a robust calendar library (e.g., react-datepicker or react-day-picker) in later phases.
export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  placeholder = 'Select date', 
  value, 
  onChange 
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input 
          type="text" 
          className={styles.input} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly // Mock behavior
        />
      </div>
    </div>
  );
};
