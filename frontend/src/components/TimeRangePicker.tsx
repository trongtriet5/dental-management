import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  label?: string;
  required?: boolean;
  appointmentDate?: string;
  businessHoursOnly?: boolean;
  className?: string;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  label = "Khoảng thời gian",
  required = false,
  appointmentDate,
  businessHoursOnly = true,
  className = ""
}) => {

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    let startHour = 8;
    let endHour = 20;
    
    // Adjust business hours based on day of week
    if (appointmentDate) {
      const date = new Date(appointmentDate);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0) { // Sunday
        endHour = 12;
      }
    }
    
    for (let hour = startHour; hour <= endHour; hour++) {
      // Add hourly slots
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour,
        minute: 0
      });
      
      // Add 30-minute slots for better granularity
      if (hour < endHour) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          hour: hour,
          minute: 30
        });
      }
    }
    
    return slots;
  };

  // Filter end time options based on start time
  const getEndTimeOptions = () => {
    if (!startTime) return generateTimeSlots();
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    
    return generateTimeSlots().filter(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMinute;
      return slotMinutes > startMinutes;
    });
  };

  // Check if current time selection is valid
  const isTimeSelectionValid = () => {
    if (!startTime || !endTime) return true;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return endMinutes > startMinutes;
  };

  const timeSlots = generateTimeSlots();

  const getBusinessHoursInfo = () => {
    if (!appointmentDate) return "Chọn ngày để xem giờ làm việc";
    
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      return "Chủ nhật: 8:00 - 12:00";
    } else { // Monday to Saturday
      return "Thứ 2-7: 8:00 - 20:00";
    }
  };

  return (
    <div className={className}>
      <Form.Label className="fw-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      
      <Row className="g-2">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small text-muted">Giờ bắt đầu</Form.Label>
            <Form.Select
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="enhanced-form"
            >
              <option value="">Chọn giờ bắt đầu</option>
              {timeSlots.map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small text-muted">Giờ kết thúc</Form.Label>
            <Form.Select
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={`enhanced-form ${!isTimeSelectionValid() ? 'is-invalid' : ''}`}
            >
              <option value="">Chọn giờ kết thúc</option>
              {getEndTimeOptions().map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time}
                </option>
              ))}
            </Form.Select>
            {!isTimeSelectionValid() && (
              <div className="invalid-feedback">
                Giờ kết thúc phải sau giờ bắt đầu
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>
      
      {appointmentDate && businessHoursOnly && (
        <Form.Text className="text-muted mt-2 d-block">
          <i className="bi bi-info-circle me-1"></i>
          {getBusinessHoursInfo()}
        </Form.Text>
      )}
      
      {startTime && endTime && (
        <div className="mt-2">
          <small className={isTimeSelectionValid() ? "text-success" : "text-danger"}>
            <i className={`bi ${isTimeSelectionValid() ? 'bi-clock' : 'bi-exclamation-triangle'} me-1`}></i>
            Khoảng thời gian: {startTime} - {endTime}
            {(() => {
              const [startHour, startMinute] = startTime.split(':').map(Number);
              const [endHour, endMinute] = endTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMinute;
              const endMinutes = endHour * 60 + endMinute;
              const duration = endMinutes - startMinutes;
              return duration > 0 ? ` (${duration} phút)` : ' - Thời gian không hợp lệ';
            })()}
          </small>
        </div>
      )}
    </div>
  );
};

export default TimeRangePicker;
