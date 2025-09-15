import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { formatDateForInput, formatDateForDisplay } from '../utils/date';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  isInvalid?: boolean;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  min,
  max,
  placeholder = 'dd/mm/yyyy',
  isInvalid = false,
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Convert value to display format (dd/mm/yyyy)
  useEffect(() => {
    if (value) {
      // Handle different input formats
      let displayDate = '';
      
      if (value.includes('/')) {
        // Already in DD/MM/YYYY format
        displayDate = value;
      } else if (value.includes('-')) {
        // Handle YYYY-MM-DD format
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          displayDate = `${day}/${month}/${year}`;
        }
      }
      
      setDisplayValue(displayDate);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Validate date format
  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true;
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Check if date is valid
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return (
      date.getDate() === dayNum &&
      date.getMonth() === monthNum - 1 &&
      date.getFullYear() === yearNum &&
      dayNum >= 1 && dayNum <= 31 &&
      monthNum >= 1 && monthNum <= 12 &&
      yearNum >= 1900 && yearNum <= 2100
    );
  };

  // Auto-format input as user types
  const formatInput = (input: string): string => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  // Convert dd/mm/yyyy to DD/MM/YYYY for API (backend expects this format)
  const convertToAPIDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) return '';
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Format as DD/MM/YYYY for backend
    return `${dayNum.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${yearNum}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatInput(inputValue);
    setDisplayValue(formattedValue);
    
    // Validate the input
    const valid = validateDate(formattedValue);
    setIsValid(valid);
    
    if (valid && formattedValue) {
      const apiDate = convertToAPIDate(formattedValue);
      onChange(apiDate);
    } else if (!formattedValue) {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayValue && isValid) {
      // Ensure proper formatting (add leading zeros if needed)
      const parts = displayValue.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const formattedValue = `${day}/${month}/${year}`;
        setDisplayValue(formattedValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers, backspace, delete, arrow keys, tab
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'];
    const isNumber = e.key >= '0' && e.key <= '9';
    
    if (!isNumber && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <Form.Group>
      {label && (
        <Form.Label className="fw-semibold text-primary">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      <Form.Control
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`enhanced-form ${className} ${!isValid ? 'is-invalid' : ''}`}
        isInvalid={isInvalid || !isValid}
        disabled={disabled}
        maxLength={10}
      />
      {!isValid && displayValue && (
        <Form.Control.Feedback type="invalid">
          Vui lòng nhập đúng định dạng dd/mm/yyyy
        </Form.Control.Feedback>
      )}
      {isInvalid && (
        <Form.Control.Feedback type="invalid">
          {required ? 'Trường này là bắt buộc' : 'Giá trị không hợp lệ'}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default DatePicker;
