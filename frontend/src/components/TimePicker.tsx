import React, { useState, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
  isMobile?: boolean;
  appointmentDate?: string;
  businessHoursOnly?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label = "Giờ hẹn",
  required = false,
  fullWidth = true,
  isMobile: propIsMobile,
  appointmentDate,
  businessHoursOnly = false,
}) => {
  const [hour, setHour] = useState<string>('');
  const [minute, setMinute] = useState<string>('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Business hours logic
  const isBusinessHour = (hour24: number) => {
    if (!appointmentDate || !businessHoursOnly) return true;
    
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      return hour24 >= 8 && hour24 < 12; // 8:00 to 12:00
    } else { // Monday to Saturday
      return hour24 >= 8 && hour24 < 20; // 8:00 to 20:00
    }
  };

  // Generate hour options (1-12) with business hours filtering
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hour12 = i + 1;
    const hour24AM = hour12 === 12 ? 0 : hour12;
    const hour24PM = hour12 === 12 ? 12 : hour12 + 12;
    
    // Check if this hour is valid for AM or PM
    const validAM = isBusinessHour(hour24AM);
    const validPM = isBusinessHour(hour24PM);
    
    return { 
      value: hour12.toString(), 
      label: hour12.toString(),
      validAM,
      validPM
    };
  }).filter(option => option.validAM || option.validPM);

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' },
  ];

  // Convert 24-hour format to 12-hour format
  const parseTime = (time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    if (!time24 || !time24.includes(':')) {
      return { hour: '', minute: '', period: 'AM' };
    }
    
    const [h, m] = time24.split(':');
    const hour24 = parseInt(h, 10);
    const minute24 = parseInt(m, 10);
    
    // Validate input values
    if (isNaN(hour24) || isNaN(minute24) || hour24 < 0 || hour24 > 23 || minute24 < 0 || minute24 > 59) {
      return { hour: '', minute: '', period: 'AM' };
    }
    
    let hour12 = hour24;
    let period: 'AM' | 'PM' = 'AM';
    
    if (hour24 === 0) {
      hour12 = 12;
      period = 'AM';
    } else if (hour24 < 12) {
      hour12 = hour24;
      period = 'AM';
    } else if (hour24 === 12) {
      hour12 = 12;
      period = 'PM';
    } else {
      hour12 = hour24 - 12;
      period = 'PM';
    }
    
    return {
      hour: hour12.toString(),
      minute: minute24.toString().padStart(2, '0'),
      period
    };
  };

  // Convert 12-hour format to 24-hour format
  const formatTime24 = (hour12: string, minute12: string, period: 'AM' | 'PM'): string => {
    if (!hour12 || !minute12 || !period) return '';
    
    const hour = parseInt(hour12, 10);
    const minute = parseInt(minute12, 10);
    
    // Validate values
    if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return '';
    }
    
    let hour24 = hour;
    
    if (period === 'AM') {
      if (hour === 12) hour24 = 0;
    } else { // PM
      if (hour !== 12) hour24 = hour + 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Initialize state from value prop
  useEffect(() => {
    const parsed = parseTime(value);
    if (parsed.hour !== hour || parsed.minute !== minute || parsed.period !== period) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [value]);

  // Check if current period is valid for selected hour
  const isValidPeriod = (hour12: string, period: 'AM' | 'PM') => {
    if (!appointmentDate || !businessHoursOnly || !hour12) return true;
    
    const hour = parseInt(hour12, 10);
    let hour24 = hour;
    
    if (period === 'AM') {
      if (hour === 12) hour24 = 0;
    } else { // PM
      if (hour !== 12) hour24 = hour + 12;
    }
    
    return isBusinessHour(hour24);
  };

  // Update parent when internal state changes
  useEffect(() => {
    if (hour && minute && period) {
      // Check if current selection is valid
      if (isValidPeriod(hour, period)) {
        const time24 = formatTime24(hour, minute, period);
        if (time24 && time24 !== value) {
          onChange(time24);
        }
      } else {
        // If current period is invalid, try to find a valid one
        const validPeriod = isValidPeriod(hour, 'AM') ? 'AM' : 'PM';
        if (validPeriod !== period) {
          setPeriod(validPeriod);
        }
      }
    }
  }, [hour, minute, period]);

  return (
    <div className="time-picker-container">
      <label className="form-label fw-semibold text-primary mb-2">{label}</label>
      <div className="d-flex gap-2 align-items-center">
        <div className="flex-fill">
          <select
            className="form-select border-primary"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            style={{
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              transition: 'all 0.3s ease',
              height: '48px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Giờ</option>
            {hourOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <span className="fs-4 fw-bold text-muted">:</span>
        
        <div className="flex-fill">
          <select
            className="form-select border-primary"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            style={{
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              transition: 'all 0.3s ease',
              height: '48px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Phút</option>
            {minuteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-fill">
          <select
            className="form-select border-primary"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
            style={{
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              transition: 'all 0.3s ease',
              height: '48px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option 
              value="AM" 
              disabled={!!hour && !isValidPeriod(hour, 'AM')}
            >
              AM
            </option>
            <option 
              value="PM" 
              disabled={!!hour && !isValidPeriod(hour, 'PM')}
            >
              PM
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;