import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Dropdown } from 'react-bootstrap';
import { Appointment, User } from '../types';
import { formatTime } from '../utils/time';

interface CalendarProps {
  appointments: Appointment[];
  doctors: User[];
  onAppointmentClick: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  viewMode?: 'month' | 'week' | 'day';
  onViewModeChange?: (mode: 'month' | 'week' | 'day') => void;
  // Props for date range filtering
  startDate?: string;
  endDate?: string;
  showAllInRange?: boolean; // If true, show all appointments in the date range
}

const Calendar: React.FC<CalendarProps> = ({
  appointments,
  doctors,
  onAppointmentClick,
  onDateClick,
  currentDate = new Date(),
  onDateChange,
  viewMode = 'month',
  onViewModeChange,
  startDate,
  endDate,
  showAllInRange = false
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentViewDate, setCurrentViewDate] = useState(currentDate);
  // Removed duplicate modal state - using parent component's modal instead

  // Debug logging
  useEffect(() => {
    console.log('Calendar props:', {
      appointmentsCount: appointments.length,
      doctorsCount: doctors.length,
      viewMode,
      startDate,
      endDate,
      showAllInRange,
      currentDate: currentDate.toISOString()
    });
    
    if (appointments.length > 0) {
      console.log('Sample appointment:', appointments[0]);
      console.log('All appointments:', appointments);
    } else {
      console.log('No appointments received by Calendar component');
    }
  }, [appointments, doctors, viewMode, startDate, endDate, showAllInRange, currentDate]);

  // Get doctor color
  const getDoctorColor = (doctorId: number): string => {
    const colors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
      '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
    ];
    return colors[doctorId % colors.length];
  };

  // Get status variant
  const getStatusVariant = (status: string): string => {
    const variants: { [key: string]: string } = {
      'scheduled': 'secondary',
      'confirmed': 'primary',
      'arrived': 'info',
      'in_progress': 'warning',
      'completed': 'success',
      'cancelled': 'danger',
      'no_show': 'dark'
    };
    return variants[status] || 'secondary';
  };

  // Get status text
  const getStatusText = (status: string): string => {
    const texts: { [key: string]: string } = {
      'scheduled': 'Đã đặt',
      'confirmed': 'Đã xác nhận',
      'arrived': 'Đã đến',
      'in_progress': 'Đang khám',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'no_show': 'Không đến'
    };
    return texts[status] || status;
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Helper function to parse date from DD/MM/YYYY format
  const parseAppointmentDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Kiểm tra format DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Fallback cho format khác
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date:', error, 'Input:', dateString);
      return null;
    }
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = parseAppointmentDate(appointment.appointment_date);
      
      if (!appointmentDate) {
        console.warn('Invalid appointment date:', appointment.appointment_date);
        return false;
      }
      
      // Always show appointments for the specific date clicked
      // Don't use date range filtering when clicking on calendar dates
      return appointmentDate.toDateString() === date.toDateString();
    });
    
    // Debug logging for specific date
    if (filteredAppointments.length > 0) {
      console.log(`Found ${filteredAppointments.length} appointments for ${date.toDateString()}:`, filteredAppointments);
    }
    
    return filteredAppointments;
  };

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentViewDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentViewDate(newDate);
    onDateChange?.(newDate);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentViewDate(today);
    setSelectedDate(today);
    onDateChange?.(today);
  };

  // Format date for display
  const formatDateDisplay = () => {
    if (viewMode === 'month') {
      return currentViewDate.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long' 
      });
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentViewDate);
      weekStart.setDate(currentViewDate.getDate() - currentViewDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentViewDate.toLocaleDateString('vi-VN', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Handle appointment click - delegate to parent component
  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment);
    console.log('Calling onAppointmentClick with:', appointment);
    onAppointmentClick(appointment);
  };

  // Render month view
  const renderMonthView = () => {
    const days = generateMonthDays();
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    return (
      <div className="calendar-month">
        {/* Week day headers */}
        <div className="row g-0 border-bottom">
          {weekDays.map(day => (
            <div key={day} className="col calendar-day-header">
              <div className="p-2 text-center fw-semibold text-primary">
                {day}
              </div>
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="calendar-days">
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <div key={weekIndex} className="row g-0 border-bottom">
              {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                const isCurrentMonth = date.getMonth() === currentViewDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const dayAppointments = getAppointmentsForDate(date);
                
                // Debug logging for specific dates
                if (dayAppointments.length > 0) {
                  console.log(`Date ${date.toDateString()} has ${dayAppointments.length} appointments:`, dayAppointments);
                }
                
                return (
                  <div 
                    key={dayIndex}
                    className={`col calendar-day ${!isCurrentMonth ? 'text-muted' : ''} ${isToday ? 'bg-primary bg-opacity-10' : ''} ${isSelected ? 'bg-primary bg-opacity-20' : ''}`}
                    style={{ minHeight: '120px', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedDate(date);
                      onDateClick?.(date);
                    }}
                  >
                    <div className="p-2 h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className={`fw-semibold ${isToday ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </span>
                        {dayAppointments.length > 0 && (
                          <Badge bg="primary" className="rounded-pill" style={{ fontSize: '0.6rem' }}>
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        {dayAppointments.slice(0, 3).map(appointment => (
                          <div
                            key={appointment.id}
                            className="appointment-mini mb-1 p-1 rounded"
                            style={{
                              backgroundColor: getDoctorColor(appointment.doctor),
                              color: 'white',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Appointment mini clicked:', appointment);
                              handleAppointmentClick(appointment);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                          >
                            <div className="text-truncate fw-semibold">
                              {appointment.customer_name}
                            </div>
                            <div className="text-truncate" style={{ opacity: 0.9 }}>
                              {formatTime(appointment.appointment_time)}
                            </div>
                          </div>
                        ))}
                        
                        {dayAppointments.length > 3 && (
                          <div className="text-center text-muted" style={{ fontSize: '0.7rem' }}>
                            +{dayAppointments.length - 3} khác
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push({ hour, time: `${hour.toString().padStart(2, '0')}:00` });
      if (hour < 20) {
        timeSlots.push({ hour: hour + 0.5, time: `${hour.toString().padStart(2, '0')}:30` });
      }
    }
    
    // Get appointments for the current view date
    // Only use date range filtering if explicitly set by user via date picker
    let dayAppointments: Appointment[] = [];
    
    if (showAllInRange && startDate && endDate && startDate !== endDate) {
      // Only show all appointments in range if it's a multi-day range (not single day)
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      dayAppointments = appointments.filter(appointment => {
        const appointmentDate = parseAppointmentDate(appointment.appointment_date);
        
        if (!appointmentDate) {
          console.warn('Invalid appointment date:', appointment.appointment_date);
          return false;
        }
        
        const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        return appointmentDateOnly >= startDateOnly && appointmentDateOnly <= endDateOnly;
      });
    } else {
      // Show appointments for the current view date only
      dayAppointments = getAppointmentsForDate(currentViewDate);
    }
    
    return (
      <div className="calendar-day">
        <div className="row g-0">
          {/* Time column */}
          <div className="col-2 border-end bg-light">
            <div className="p-3 fw-semibold text-center text-primary border-bottom">
              <i className="bi bi-clock me-1"></i>
              Giờ
            </div>
            {timeSlots.map(slot => (
              <div key={slot.time} className="p-2 text-center border-bottom" style={{ minHeight: '60px' }}>
                <small className="fw-semibold text-primary">
                  {slot.time}
                </small>
              </div>
            ))}
          </div>
          
          {/* Appointments column */}
          <div className="col-10">
            <div className="p-3 fw-semibold text-center text-primary border-bottom">
              <i className="bi bi-calendar-event me-1"></i>
              {showAllInRange && startDate && endDate && startDate !== endDate ? (
                <>Lịch hẹn từ {new Date(startDate).toLocaleDateString('vi-VN')} đến {new Date(endDate).toLocaleDateString('vi-VN')}</>
              ) : (
                <>Lịch hẹn - {currentViewDate.toLocaleDateString('vi-VN')}</>
              )}
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {dayAppointments.length > 0 ? (
                timeSlots.map(slot => {
                  const slotAppointments = dayAppointments.filter(apt => {
                    const aptHour = new Date(`2000-01-01T${apt.appointment_time}`).getHours();
                    return aptHour === slot.hour;
                  });
                  
                  // Only show time slots that have appointments
                  if (slotAppointments.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div key={slot.time} className="border-bottom p-2" style={{ minHeight: '60px' }}>
                      {slotAppointments.map(appointment => (
                        <div
                          key={appointment.id}
                          className="appointment-card mb-2 p-2 rounded shadow-sm"
                          style={{
                            backgroundColor: 'white',
                            borderLeft: `4px solid ${getDoctorColor(appointment.doctor)}`,
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Day view appointment clicked:', appointment);
                            handleAppointmentClick(appointment);
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 fw-semibold">{appointment.customer_name}</h6>
                              <small className="text-muted d-block">
                                <i className="bi bi-person me-1"></i>
                                {appointment.doctor_name}
                              </small>
                              <small className="text-muted d-block">
                                <i className="bi bi-geo-alt me-1"></i>
                                {appointment.branch_name}
                              </small>
                              <small className="text-muted d-block">
                                <i className="bi bi-calendar3 me-1"></i>
                                {parseAppointmentDate(appointment.appointment_date)?.toLocaleDateString('vi-VN') || 'Ngày không hợp lệ'}
                              </small>
                            </div>
                            <Badge bg={getStatusVariant(appointment.status)}>
                              {getStatusText(appointment.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }).filter(Boolean) // Remove null entries
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
                  <div className="mt-3">
                    <h5>Không có lịch hẹn</h5>
                    <p>Ngày này không có lịch hẹn nào được đặt</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    // Calculate the start of the week (Sunday)
    const weekStart = new Date(currentViewDate);
    weekStart.setDate(currentViewDate.getDate() - currentViewDate.getDay());
    
    // Generate 7 days for the week
    const weekDays_data: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays_data.push(day);
    }
    
    return (
      <div className="calendar-week">
        {/* Week day headers */}
        <div className="row g-0 border-bottom">
          {weekDays.map((day, index) => {
            const dayDate = weekDays_data[index];
            const isToday = dayDate.toDateString() === new Date().toDateString();
            
            return (
              <div key={day} className="col calendar-day-header">
                <div className="p-2 text-center fw-semibold text-primary border-end">
                  <div>{day}</div>
                  <div className={`${isToday ? 'text-primary fw-bold' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                    {dayDate.getDate()}/{dayDate.getMonth() + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Week appointments */}
        <div className="row g-0 calendar-week-content" style={{ minHeight: '400px' }}>
          {weekDays_data.map((date, dayIndex) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={dayIndex}
                className={`col calendar-week-day border-end ${isToday ? 'bg-primary bg-opacity-10' : ''}`}
                style={{ minHeight: '400px', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDate(date);
                  onDateClick?.(date);
                }}
              >
                <div className="p-2 h-100">
                  <div className="mb-2">
                    <Badge bg="primary" className="rounded-pill">
                      {dayAppointments.length} lịch hẹn
                    </Badge>
                  </div>
                  
                  <div className="appointments-list">
                    {dayAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className="appointment-mini mb-2 p-2 rounded"
                        style={{
                          backgroundColor: getDoctorColor(appointment.doctor),
                          color: 'white',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Week view appointment clicked:', appointment);
                          handleAppointmentClick(appointment);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <div className="fw-semibold text-truncate">
                          {appointment.customer_name}
                        </div>
                        <div className="text-truncate" style={{ opacity: 0.9 }}>
                          {formatTime(appointment.appointment_time)}
                        </div>
                        <div className="text-truncate" style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                          {appointment.doctor_name}
                        </div>
                      </div>
                    ))}
                    
                    {dayAppointments.length === 0 && (
                      <div className="text-center text-muted mt-4">
                        <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                        <div className="mt-2">Không có lịch hẹn</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0 text-primary">
                <i className="bi bi-calendar3 me-2"></i>
                {formatDateDisplay()}
              </h5>
              
              {/* View mode selector */}
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <i className="bi bi-calendar3 me-1"></i>
                  {viewMode === 'month' ? 'Tháng' : viewMode === 'week' ? 'Tuần' : 'Ngày'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item 
                    active={viewMode === 'month'}
                    onClick={() => onViewModeChange?.('month')}
                  >
                    <i className="bi bi-calendar3 me-2"></i>
                    Xem theo tháng
                  </Dropdown.Item>
                  <Dropdown.Item 
                    active={viewMode === 'week'}
                    onClick={() => onViewModeChange?.('week')}
                  >
                    <i className="bi bi-calendar-week me-2"></i>
                    Xem theo tuần
                  </Dropdown.Item>
                  <Dropdown.Item 
                    active={viewMode === 'day'}
                    onClick={() => onViewModeChange?.('day')}
                  >
                    <i className="bi bi-calendar-day me-2"></i>
                    Xem theo ngày
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigateCalendar('prev')}
              >
                <i className="bi bi-chevron-left"></i>
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={goToToday}
              >
                Hôm nay
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigateCalendar('next')}
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="p-0">
          {viewMode === 'month' ? renderMonthView() : 
           viewMode === 'week' ? renderWeekView() : 
           renderDayView()}
        </Card.Body>
        
        {/* Doctor legend */}
        <Card.Footer className="bg-light">
          <div className="d-flex flex-wrap gap-3">
            <span className="fw-semibold text-primary">Chú thích:</span>
            {doctors.map(doctor => (
              <div key={doctor.id} className="d-flex align-items-center">
                <div
                  className="rounded me-2"
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: getDoctorColor(doctor.id)
                  }}
                ></div>
                <small className="text-muted">
                  {doctor.last_name} {doctor.first_name}
                </small>
              </div>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {/* Modal removed - using parent component's editable modal instead */}
    </>
  );
};

export default Calendar;