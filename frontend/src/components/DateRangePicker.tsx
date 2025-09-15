import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Chọn khoảng thời gian",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update temp values when props change
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const handleApply = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate('');
    setTempEndDate('');
    onStartDateChange('');
    onEndDateChange('');
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Từ ${startDate}`;
    } else if (endDate) {
      return `Đến ${endDate}`;
    }
    return placeholder;
  };

  const handleStartDateChange = (value: string) => {
    if (value) {
      // Convert dd/mm/yyyy to DD/MM/YYYY format
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = value.match(dateRegex);
      if (match) {
        const [, day, month, year] = match;
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        const formattedDate = `${dayNum.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${yearNum}`;
        setTempStartDate(formattedDate);
      } else {
        setTempStartDate(value);
      }
    } else {
      setTempStartDate('');
    }
  };

  const handleEndDateChange = (value: string) => {
    if (value) {
      // Convert dd/mm/yyyy to DD/MM/YYYY format
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = value.match(dateRegex);
      if (match) {
        const [, day, month, year] = match;
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        const formattedDate = `${dayNum.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${yearNum}`;
        setTempEndDate(formattedDate);
      } else {
        setTempEndDate(value);
      }
    } else {
      setTempEndDate('');
    }
  };

  return (
    <div className={`position-relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={startDate || endDate ? 'text-dark' : 'text-muted'}>
          {formatDisplayValue()}
        </span>
        <i className={`bi bi-calendar3 ms-2 ${isOpen ? 'text-primary' : 'text-muted'}`}></i>
      </button>

      {isOpen && (
        <div className="dropdown-menu show w-100 p-3" style={{ minWidth: '350px' }}>
          <div className="row">
            <div className="col-6">
              <label className="form-label fw-bold text-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Từ ngày
              </label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="dd/mm/yyyy"
                  value={tempStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApply();
                    }
                  }}
                  style={{ paddingRight: '40px' }}
                />
                <div 
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ pointerEvents: 'none' }}
                >
                  <i className="bi bi-calendar3 text-muted"></i>
                </div>
              </div>
            </div>
            <div className="col-6">
              <label className="form-label fw-bold text-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Đến ngày
              </label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="dd/mm/yyyy"
                  value={tempEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApply();
                    }
                  }}
                  style={{ paddingRight: '40px' }}
                />
                <div 
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ pointerEvents: 'none' }}
                >
                  <i className="bi bi-calendar3 text-muted"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between mt-3">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleClear}
            >
              <i className="bi bi-x-lg me-1"></i>
              Xóa
            </button>
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm me-2"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApply}
              >
                <i className="bi bi-check-lg me-1"></i>
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
