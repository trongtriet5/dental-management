import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Table, Alert, Spinner, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import api from '../services/api';
import { Appointment, Customer, Service, Branch, User, AppointmentFormData } from '../types';
import TimePicker from '../components/TimePicker';
import DatePicker from '../components/DatePicker';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/date';
import { formatTime, formatDate } from '../utils/time';
import { formatCurrency } from '../utils/currency';

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

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogError, setDialogError] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer: 0,
    doctor: 0,
    branch: 0,
    services: [],
    services_with_quantity: [],
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 60,
    appointment_type: 'consultation',
    notes: '',
  });
  
  // State cho thông tin khách hàng mới
  const [newCustomerData, setNewCustomerData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female' | 'other',
    date_of_birth: '',
    province_code: '',
    ward_code: '',
    street: '',
    medical_history: '',
    allergies: '',
    notes: '',
  });
  
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, customersData, servicesData, branchesData, doctorsData, provincesData] = await Promise.all([
        api.getAppointments({ page_size: 1000 }),
        api.getCustomers({ page_size: 1000 }),
        api.getServices(),
        api.getBranches(),
        api.getDoctors(),
        api.getProvinces(),
      ]);
      setAppointments(appointmentsData.results);
      setCustomers(customersData.results);
      setServices(servicesData.results);
      setBranches(branchesData.results);
      setDoctors(doctorsData.results);
      setProvinces(provincesData);
    } catch (err: any) {
      setError('Không thể tải dữ liệu lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWards = async (provinceCode: string) => {
    try {
      const wardsData = await api.getWards(provinceCode);
      setWards(wardsData);
    } catch (err) {
      console.error('Error fetching wards:', err);
    }
  };

  const handleOpenDialog = async (appointment?: Appointment) => {
    await fetchData();
    setDialogError('');
    if (appointment) {
      const validServiceIds = new Set(services.map(s => s.id));
      const filteredServices = (appointment.services || []).filter(id => validServiceIds.has(id));

      setEditingAppointment(appointment);
      setFormData({
        customer: appointment.customer,
        doctor: appointment.doctor,
        branch: appointment.branch,
        services: filteredServices,
        services_with_quantity: appointment.services_with_quantity || [],
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        duration_minutes: appointment.duration_minutes,
        appointment_type: appointment.appointment_type || 'consultation',
        notes: appointment.notes || '',
      });
    } else {
      setEditingAppointment(null);
      setIsNewCustomer(false);
      setNewCustomerData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        gender: 'male',
        date_of_birth: '',
        province_code: '',
        ward_code: '',
        street: '',
        medical_history: '',
        allergies: '',
        notes: '',
      });
      setFormData({
        customer: 0,
        doctor: 0,
        branch: 0,
        services: [],
        services_with_quantity: [],
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        duration_minutes: 60,
        appointment_type: 'consultation',
        notes: ''
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAppointment(null);
    setIsNewCustomer(false);
    setNewCustomerData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      gender: 'male',
      date_of_birth: '',
      province_code: '',
      ward_code: '',
      street: '',
      medical_history: '',
      allergies: '',
      notes: '',
    });
    setWards([]);
  };

  const handleSubmit = async () => {
    setDialogError('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.doctor || !formData.branch) {
        setDialogError('Vui lòng điền đầy đủ các trường bắt buộc: Bác sĩ và Chi nhánh.');
        return;
      }

      if (formData.services_with_quantity.length === 0) {
        setDialogError('Vui lòng chọn ít nhất một dịch vụ.');
        return;
      }

      // Check business hours
      if (!isValidAppointmentTime(formData.appointment_date, formData.appointment_time)) {
        const businessHoursInfo = getBusinessHoursInfo(formData.appointment_date);
        setDialogError(`Thời gian đặt lịch không hợp lệ. Giờ làm việc: ${businessHoursInfo}`);
        return;
      }

      let customerId = formData.customer;

      // Nếu là khách hàng mới, tạo khách hàng trước
      if (isNewCustomer) {
        // Validation cho thông tin khách hàng mới
        if (!newCustomerData.first_name.trim() || !newCustomerData.last_name.trim() || !newCustomerData.phone.trim()) {
          setDialogError('Vui lòng điền đầy đủ thông tin khách hàng: Họ, Tên và Số điện thoại.');
          return;
        }

        if (!newCustomerData.date_of_birth) {
          setDialogError('Vui lòng chọn ngày sinh.');
          return;
        }

        // Tạo khách hàng mới
        const customerData = {
          first_name: newCustomerData.first_name.trim(),
          last_name: newCustomerData.last_name.trim(),
          phone: newCustomerData.phone.trim(),
          email: newCustomerData.email?.trim() || '',
          gender: newCustomerData.gender,
          date_of_birth: newCustomerData.date_of_birth,
          province: newCustomerData.province_code || null,
          ward: newCustomerData.ward_code || null,
          street: newCustomerData.street?.trim() || '',
          medical_history: newCustomerData.medical_history?.trim() || '',
          allergies: newCustomerData.allergies?.trim() || '',
          notes: newCustomerData.notes?.trim() || '',
          branch: formData.branch,
          services_used: formData.services_with_quantity.map(s => s.service_id)
        };

        const newCustomer = await api.createCustomer(customerData);
        customerId = newCustomer.id;

        // Tạo thanh toán tự động
        const totalAmount = formData.services_with_quantity.reduce((total, serviceWithQty) => {
          const service = services.find(s => s.id === serviceWithQty.service_id);
          return total + (service ? service.price * serviceWithQty.quantity : 0);
        }, 0);

        if (totalAmount > 0) {
          const paymentData = {
            customer: customerId,
            services: formData.services_with_quantity.map(s => s.service_id),
            branch: formData.branch,
            amount: totalAmount,
            payment_method: 'cash' as const,
            notes: 'Thanh toán tự động khi đặt lịch hẹn'
          };

          await api.createPayment(paymentData);
        }
      }

      // Tạo lịch hẹn
      const appointmentData = {
        customer: customerId,
        doctor: formData.doctor,
        branch: formData.branch,
        services: formData.services_with_quantity.map(s => s.service_id),
        services_with_quantity: formData.services_with_quantity,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        duration_minutes: formData.duration_minutes,
        appointment_type: formData.appointment_type,
        notes: formData.notes,
      };

      if (editingAppointment) {
        await api.updateAppointment(editingAppointment.id, appointmentData);
      } else {
        await api.createAppointment(appointmentData);
      }
      
      // Refresh data and close dialog
      await fetchData();
      handleCloseDialog();
      
    } catch (err: any) {
      // Parse error message for better display
      let errorMessage = 'Không thể lưu lịch hẹn';
      
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors.join(', ');
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.join(', ');
        } else {
          // Try to extract meaningful error messages from field errors
          const fieldErrors = Object.values(err.response.data).flat();
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ');
          }
        }
      }
      
      setDialogError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
      try {
        await api.deleteAppointment(id);
        await fetchData();
      } catch (err: any) {
        setError('Không thể xóa lịch hẹn');
      }
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
      await fetchData();
    } catch (err: any) {
      setError('Không thể cập nhật trạng thái');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = (appointment.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (appointment.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || appointment.status === selectedStatus;
    const matchesDoctor = !selectedDoctor || appointment.doctor === parseInt(selectedDoctor);
    const matchesBranch = !selectedBranch || appointment.branch === parseInt(selectedBranch);
    
    let matchesDate = true;
    const appointmentDate = parseAppointmentDate(appointment.appointment_date);
    
    if (!appointmentDate) {
      return false; // Skip invalid dates
    }
    
    // Use date range filters for both table and calendar view
    if (startDate) {
      const start = parseAppointmentDate(startDate);
      if (start) {
        matchesDate = matchesDate && appointmentDate >= start;
      }
    }
    if (endDate) {
      const end = parseAppointmentDate(endDate);
      if (end) {
        matchesDate = matchesDate && appointmentDate <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesBranch && matchesDate;
  });

  const handleServiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, option => parseInt(option.value));
    setFormData({
      ...formData,
      services: selectedValues
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'arrived': return 'Khách đã đến';
      case 'in_progress': return 'Đang điều trị';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'no_show': return 'Không đến';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'confirmed': return 'info';
      case 'arrived': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no_show': return 'danger';
      default: return 'secondary';
    }
  };

  const getDoctorColor = (doctorId: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[doctorId % colors.length];
  };

  const generateTimeSlots = () => {
    const slots = [];
    
    // Default business hours (can be adjusted based on date range if needed)
    let startHour = 8;
    let endHour = 20;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour,
        isBusinessHour: true
      });
      
      // Add 30-minute slots for better granularity
      if (hour < endHour) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          hour: hour,
          minute: 30,
          isBusinessHour: true
        });
      }
    }
    return slots;
  };

  const getAppointmentsForTimeSlot = (timeSlot: { time: string; hour: number; minute?: number }) => {
    return filteredAppointments.filter(appointment => {
      const [appointmentHour, appointmentMinute] = appointment.appointment_time.split(':').map(Number);
      
      if (timeSlot.minute !== undefined) {
        // Check for exact 30-minute slot match
        return appointmentHour === timeSlot.hour && appointmentMinute === timeSlot.minute;
      } else {
        // Check for hour slot (00 minutes)
        return appointmentHour === timeSlot.hour && appointmentMinute === 0;
      }
    });
  };

  const getAppointmentsInTimeRange = (startHour: number, endHour: number) => {
    return filteredAppointments.filter(appointment => {
      const appointmentHour = parseInt(appointment.appointment_time.split(':')[0]);
      return appointmentHour >= startHour && appointmentHour < endHour;
    });
  };


  const getAppointmentsForDate = (date: string) => {
    return filteredAppointments.filter(appointment => {
      const appointmentDate = parseAppointmentDate(appointment.appointment_date);
      if (!appointmentDate) return false;
      
      const targetDate = new Date(date);
      const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      
      return appointmentDateOnly.getTime() === targetDateOnly.getTime();
    });
  };

  const detectConflicts = (appointments: Appointment[]) => {
    const conflicts: Array<{
      appointment1: Appointment;
      appointment2: Appointment;
      conflictType: 'time' | 'doctor' | 'both';
    }> = [];

    for (let i = 0; i < appointments.length; i++) {
      for (let j = i + 1; j < appointments.length; j++) {
        const apt1 = appointments[i];
        const apt2 = appointments[j];
        
        // Check if same doctor
        const sameDoctor = apt1.doctor === apt2.doctor;
        
        // Check if same date
        const apt1Date = parseAppointmentDate(apt1.appointment_date);
        const apt2Date = parseAppointmentDate(apt2.appointment_date);
        
        if (!apt1Date || !apt2Date) continue;
        
        const sameDate = apt1Date.getTime() === apt2Date.getTime();
        
        if (sameDate && sameDoctor) {
          // Check time overlap
          const apt1Start = new Date(`2000-01-01 ${apt1.appointment_time}`);
          const apt1End = new Date(apt1Start.getTime() + apt1.duration_minutes * 60000);
          const apt2Start = new Date(`2000-01-01 ${apt2.appointment_time}`);
          const apt2End = new Date(apt2Start.getTime() + apt2.duration_minutes * 60000);
          
          const timeOverlap = apt1Start < apt2End && apt2Start < apt1End;
          
          if (timeOverlap) {
            conflicts.push({
              appointment1: apt1,
              appointment2: apt2,
              conflictType: 'both'
            });
          }
        }
      }
    }
    
    return conflicts;
  };

  const getConflictWarning = () => {
    const conflicts = detectConflicts(filteredAppointments);
    if (conflicts.length === 0) return null;
    
    return (
      <Alert variant="warning" className="alert-enhanced mb-3">
        <div className="d-flex align-items-start">
          <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
          <div>
            <strong>Cảnh báo xung đột lịch hẹn:</strong>
            <div className="mt-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="mb-1">
                  <small>
                    <strong>{conflict.appointment1.customer_name}</strong> ({conflict.appointment1.appointment_time}) 
                    xung đột với <strong>{conflict.appointment2.customer_name}</strong> ({conflict.appointment2.appointment_time})
                    - Bác sĩ: {conflict.appointment1.doctor_name}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Alert>
    );
  };

  const hasConflict = (appointment: Appointment) => {
    const conflicts = detectConflicts(filteredAppointments);
    return conflicts.some(conflict => 
      conflict.appointment1.id === appointment.id || 
      conflict.appointment2.id === appointment.id
    );
  };

  const isBusinessDay = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
  };

  const isBusinessHour = (date: Date, time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      return hour >= 8 && hour < 12; // 8:00 to 12:00
    } else { // Monday to Saturday
      return hour >= 8 && hour < 20; // 8:00 to 20:00
    }
  };

  const isValidAppointmentTime = (date: string, time: string) => {
    const appointmentDate = new Date(date);
    return isBusinessDay(appointmentDate) && isBusinessHour(appointmentDate, time);
  };

  const getBusinessHoursInfo = (date: string) => {
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    
    if (dayOfWeek === 0) { // Sunday
      return "Chủ nhật: 8:00 - 12:00";
    } else { // Monday to Saturday
      return "Thứ 2-7: 8:00 - 20:00";
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <style>
        {`
          .appointment-card {
            transition: all 0.2s ease-in-out;
          }
          
          .appointment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
          }
          
          .calendar-container {
            scrollbar-width: thin;
            scrollbar-color: #dee2e6 #f8f9fa;
          }
          
          .calendar-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .calendar-container::-webkit-scrollbar-track {
            background: #f8f9fa;
          }
          
          .calendar-container::-webkit-scrollbar-thumb {
            background: #dee2e6;
            border-radius: 3px;
          }
          
          .calendar-container::-webkit-scrollbar-thumb:hover {
            background: #adb5bd;
          }
          
          .appointments-list {
            scrollbar-width: thin;
            scrollbar-color: #dee2e6 #f8f9fa;
          }
          
          .appointments-list::-webkit-scrollbar {
            width: 4px;
          }
          
          .appointments-list::-webkit-scrollbar-track {
            background: #f8f9fa;
          }
          
          .appointments-list::-webkit-scrollbar-thumb {
            background: #dee2e6;
            border-radius: 2px;
          }
        `}
      </style>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold mb-0">Quản lý lịch hẹn</h2>
        <div className="d-flex gap-2">
          <ToggleButtonGroup
            type="radio"
            name="viewMode"
            value={viewMode}
            onChange={(val) => setViewMode(val)}
          >
            <ToggleButton id="table-view" value="table" variant="outline-primary">
              <i className="bi bi-list-ul me-2"></i>
              Bảng
            </ToggleButton>
            <ToggleButton id="calendar-view" value="calendar" variant="outline-primary">
              <i className="bi bi-calendar3 me-2"></i>
              Lịch trình
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="primary"
            className="btn-primary-enhanced"
            onClick={() => handleOpenDialog()}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Đặt lịch hẹn
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      {/* Conflict Warning */}
      {viewMode === 'calendar' && getConflictWarning()}

      {/* Search and Filter Section */}
      <Card className="card-enhanced mb-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Tìm kiếm lịch hẹn</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên khách hàng hoặc bác sĩ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="enhanced-form"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Trạng thái</Form.Label>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].map(status => (
                    <option key={status} value={status}>{getStatusText(status)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Bác sĩ</Form.Label>
                <Form.Select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.last_name} {doctor.first_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Chi nhánh</Form.Label>
                <Form.Select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="enhanced-form"
                >
                  <option value="">Tất cả</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-primary">Khoảng thời gian</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    placeholder="Từ ngày"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-fill"
                  />
                  <Form.Control
                    type="date"
                    placeholder="Đến ngày"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-fill"
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Appointments List */}
      <Card className="card-enhanced">
        <Card.Body className="p-0">
          {viewMode === 'table' ? (
            <div className="table-responsive">
              <Table className="table-enhanced mb-0">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Bác sĩ</th>
                    <th>Dịch vụ</th>
                    <th>Ngày giờ</th>
                    <th>Chi nhánh</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="fw-semibold">{appointment.customer_name}</td>
                      <td>{appointment.doctor_name}</td>
                      <td style={{ maxWidth: '200px' }}>
                        <div className="text-truncate" title={appointment.service_names}>
                      {appointment.service_names}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{appointment.appointment_date}</span>
                          <small className="text-muted">{formatTime(appointment.appointment_time)}</small>
                        </div>
                      </td>
                      <td>{appointment.branch_name}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Form.Select
                            size="sm"
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                            className="me-2"
                            style={{ width: 'auto', minWidth: '120px' }}
                          >
                            {['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].map(status => (
                              <option key={status} value={status}>{getStatusText(status)}</option>
                            ))}
                          </Form.Select>
                          <Button
                            variant="outline-primary"
                            size="sm"
                          onClick={() => handleOpenDialog(appointment)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                          onClick={() => handleDelete(appointment.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </Table>
            </div>
          ) : (
            <div className="p-4">
              {/* Calendar Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="text-primary fw-bold mb-0">
                  <i className="bi bi-calendar3 me-2"></i>
                  Lịch trình theo thời gian
                </h4>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setStartDate(today);
                      setEndDate(today);
                    }}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekStart = new Date(today);
                      weekStart.setDate(today.getDate() - today.getDay());
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      
                      setStartDate(weekStart.toISOString().split('T')[0]);
                      setEndDate(weekEnd.toISOString().split('T')[0]);
                    }}
                  >
                    Tuần này
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                      
                      setStartDate(monthStart.toISOString().split('T')[0]);
                      setEndDate(monthEnd.toISOString().split('T')[0]);
                    }}
                  >
                    Tháng này
                  </Button>
                </div>
              </div>

              {/* Doctor Legend */}
              <div className="mb-4">
                <h6 className="fw-semibold text-primary mb-2">Chú thích bác sĩ:</h6>
                <div className="d-flex flex-wrap gap-3">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="d-flex align-items-center">
                      <div
                        className="rounded me-2"
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: getDoctorColor(doctor.id)
                        }}
                      ></div>
                      <small className="text-muted">
                        {doctor.last_name} {doctor.first_name}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Grid */}
                <div className="border rounded shadow-sm">
                  <div className="row g-0">
                    {/* Time Column Header */}
                    <div className="col-2 border-end bg-light">
                      <div className="p-3 fw-semibold text-center text-primary">
                        <i className="bi bi-clock me-1"></i>
                        Giờ
                      </div>
                    </div>
                    
                    {/* Appointments Column */}
                    <div className="col-10">
                      <div className="p-3 fw-semibold text-center text-primary border-bottom">
                        <i className="bi bi-calendar-event me-1"></i>
                        Lịch hẹn
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="calendar-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {generateTimeSlots().map((timeSlot, index) => {
                      const appointmentsInSlot = getAppointmentsForTimeSlot(timeSlot);
                      const isCurrentHour = new Date().getHours() === timeSlot.hour && 
                                          new Date().getMinutes() >= (timeSlot.minute || 0) &&
                                          new Date().getMinutes() < (timeSlot.minute || 0) + 30;
                      
                      return (
                        <div 
                          key={timeSlot.time} 
                          className={`row g-0 border-bottom ${isCurrentHour ? 'bg-warning bg-opacity-10' : ''}`}
                          style={{ minHeight: '80px' }}
                        >
                          {/* Time Slot */}
                          <div className="col-2 border-end bg-light d-flex align-items-center justify-content-center">
                            <div className="p-2 text-center">
                              <div className="fw-semibold text-primary" style={{ fontSize: '0.9rem' }}>
                                {timeSlot.time}
                              </div>
                              {isCurrentHour && (
                                <div className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.6rem' }}>
                                  Hiện tại
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Appointments */}
                          <div className="col-10 p-2">
                            {appointmentsInSlot.length > 0 ? (
                              <div className="row g-2">
                                {appointmentsInSlot.map((appointment) => (
                                  <div key={appointment.id} className="col-md-6 col-lg-4">
                                    <div
                                      className={`card border-0 h-100 appointment-card ${hasConflict(appointment) ? 'border-danger' : ''}`}
                                      style={{
                                        borderLeft: `4px solid ${hasConflict(appointment) ? '#dc3545' : getDoctorColor(appointment.doctor)} !important`,
                                        boxShadow: hasConflict(appointment) ? '0 2px 4px rgba(220, 53, 69, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.2s ease-in-out',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                      }}
                                      onClick={() => handleOpenDialog(appointment)}
                                    >
                                      <div className="card-body p-2">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          <h6 className="card-title mb-0 fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                            {appointment.customer_name}
                                          </h6>
                                          <span className={`badge bg-${getStatusVariant(appointment.status)}`} style={{ fontSize: '0.65rem' }}>
                                            {getStatusText(appointment.status)}
                                          </span>
                                        </div>
                                        
                                        <div className="mb-1">
                                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                            <i className="bi bi-person me-1"></i>
                                            {appointment.doctor_name}
                                          </small>
                                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                            <i className="bi bi-geo-alt me-1"></i>
                                            {appointment.branch_name}
                                          </small>
                                        </div>
                                        
                                        <div className="mb-2">
                                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>Dịch vụ:</small>
                                          <div className="text-truncate" title={appointment.service_names} style={{ fontSize: '0.7rem' }}>
                                            {appointment.service_names}
                                          </div>
                                        </div>
                                        
                                        <div className="d-flex gap-1">
                                          <Form.Select
                                            size="sm"
                                            value={appointment.status}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleStatusChange(appointment.id, e.target.value);
                                            }}
                                            className="flex-grow-1"
                                            style={{ fontSize: '0.7rem' }}
                                          >
                                            {['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].map(status => (
                                              <option key={status} value={status}>{getStatusText(status)}</option>
                                            ))}
                                          </Form.Select>
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenDialog(appointment);
                                            }}
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                          >
                                            <i className="bi bi-pencil"></i>
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(appointment.id);
                                            }}
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                          >
                                            <i className="bi bi-trash"></i>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted py-2" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-calendar-x me-1"></i>
                                Trống
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {filteredAppointments.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">Không có lịch hẹn nào trong ngày này</p>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Appointment Dialog */}
      <Modal show={showDialog} onHide={handleCloseDialog} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>
          {editingAppointment ? 'Chỉnh sửa lịch hẹn' : 'Đặt lịch hẹn mới'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="enhanced-form">
          {dialogError && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div>
                  <strong>Lỗi xác thực:</strong>
                  <div className="mt-1">{dialogError}</div>
                  <small className="text-muted mt-2 d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    Vui lòng kiểm tra và chỉnh sửa thông tin bên dưới, sau đó thử lại.
                  </small>
                </div>
              </div>
            </Alert>
          )}
          
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Loại khách hàng *</Form.Label>
                  <div className="d-flex gap-3 mb-3">
                    <Form.Check
                      type="radio"
                      id="existing-customer"
                      name="customerType"
                      label="Khách hàng có sẵn"
                      checked={!isNewCustomer}
                      onChange={() => setIsNewCustomer(false)}
                    />
                    <Form.Check
                      type="radio"
                      id="new-customer"
                      name="customerType"
                      label="Khách hàng mới"
                      checked={isNewCustomer}
                      onChange={() => setIsNewCustomer(true)}
                    />
                  </div>
                  
                  {!isNewCustomer ? (
                    <Form.Select
                      value={formData.customer}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        customer: parseInt(e.target.value),
                        services: []
                      })}
                      className="enhanced-form"
                    >
                      <option value={0}>Chọn khách hàng</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.full_name} - {customer.phone}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="border rounded p-3 bg-light">
                      <h6 className="text-primary mb-3">Thông tin khách hàng mới</h6>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Họ *</Form.Label>
                            <Form.Control
                              type="text"
                              value={newCustomerData.last_name}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, last_name: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Tên *</Form.Label>
                            <Form.Control
                              type="text"
                              value={newCustomerData.first_name}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, first_name: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Số điện thoại *</Form.Label>
                            <Form.Control
                              type="tel"
                              value={newCustomerData.phone}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={newCustomerData.email}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Giới tính *</Form.Label>
                            <Form.Select
                              value={newCustomerData.gender}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, gender: e.target.value as any })}
                              className="enhanced-form"
                            >
                              <option value="male">Nam</option>
                              <option value="female">Nữ</option>
                              <option value="other">Khác</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Ngày sinh *</Form.Label>
                            <DatePicker
                              value={newCustomerData.date_of_birth}
                              onChange={(value) => setNewCustomerData({ ...newCustomerData, date_of_birth: value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Tỉnh/Thành phố</Form.Label>
                            <Form.Select
                              value={newCustomerData.province_code}
                              onChange={(e) => {
                                const provinceCode = e.target.value;
                                setNewCustomerData({ ...newCustomerData, province_code: provinceCode, ward_code: '' });
                                if (provinceCode) {
                                  fetchWards(provinceCode);
                                } else {
                                  setWards([]);
                                }
                              }}
                              className="enhanced-form"
                            >
                              <option value="">Chọn Tỉnh/Thành phố</option>
                              {provinces
                                .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                                .map((province) => (
                                  <option key={province.code} value={province.code}>
                                    {province.name}
                                  </option>
                                ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Phường/Xã</Form.Label>
                            <Form.Select
                              value={newCustomerData.ward_code}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, ward_code: e.target.value })}
                              disabled={!newCustomerData.province_code}
                              className="enhanced-form"
                            >
                              <option value="">Chọn Phường/Xã</option>
                              {wards.map((ward) => (
                                <option key={ward.code} value={ward.code}>
                                  {ward.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Số nhà, tên đường</Form.Label>
                            <Form.Control
                              type="text"
                              value={newCustomerData.street}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, street: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Tiền sử bệnh</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={newCustomerData.medical_history}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, medical_history: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Dị ứng</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={newCustomerData.allergies}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, allergies: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Ghi chú</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={newCustomerData.notes}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
                              className="enhanced-form"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Bác sĩ *</Form.Label>
                  <Form.Select
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: parseInt(e.target.value) })}
                    className="enhanced-form"
                  >
                    <option value={0}>Chọn bác sĩ</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.last_name} {doctor.first_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Chi nhánh *</Form.Label>
                  <Form.Select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: parseInt(e.target.value) })}
                    className="enhanced-form"
                  >
                    <option value={0}>Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Loại lịch hẹn *</Form.Label>
                  <Form.Select
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as any })}
                    className="enhanced-form"
                  >
                    <option value="consultation">Tham khảo dịch vụ</option>
                    <option value="treatment">Điều trị</option>
                    <option value="follow_up">Tái khám</option>
                    <option value="emergency">Cấp cứu</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Chọn loại lịch hẹn phù hợp với mục đích khách hàng đến
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Dịch vụ với số lượng *</Form.Label>
                  {editingAppointment ? (
                    <div>
                      <Form.Control
                        type="text"
                        value={editingAppointment.service_names || ''}
                        disabled
                        className="enhanced-form"
                        style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                      />
                      <Form.Text className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Để chỉnh sửa dịch vụ, vui lòng vào phần "Chỉnh sửa khách hàng" và cập nhật lại ở đây
                      </Form.Text>
                    </div>
                  ) : (
                    <div>
                      {/* Hiển thị các dịch vụ đã chọn với số lượng */}
                      {formData.services_with_quantity.map((item, index) => {
                        const service = services.find(s => s.id === item.service_id);
                        return service ? (
                          <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                            <div className="flex-grow-1">
                              <strong>{service.name}</strong>
                              <small className="text-muted d-block">Giá: {formatCurrency(service.price)}</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <Form.Control
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 1;
                                  const updatedServices = [...formData.services_with_quantity];
                                  updatedServices[index].quantity = newQuantity;
                                  setFormData({...formData, services_with_quantity: updatedServices});
                                }}
                                style={{ width: '80px' }}
                                className="me-2"
                              />
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  const updatedServices = formData.services_with_quantity.filter((_, i) => i !== index);
                                  const updatedServiceIds = updatedServices.map(s => s.service_id);
                                  setFormData({
                                    ...formData, 
                                    services_with_quantity: updatedServices,
                                    services: updatedServiceIds
                                  });
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })}
                      
                      {/* Dropdown để thêm dịch vụ mới */}
                      <Form.Select
                        value=""
                        onChange={(e) => {
                          const serviceId = parseInt(e.target.value);
                          if (serviceId && !formData.services_with_quantity.some(s => s.service_id === serviceId)) {
                            const newService = { service_id: serviceId, quantity: 1 };
                            const updatedServices = [...formData.services_with_quantity, newService];
                            const updatedServiceIds = updatedServices.map(s => s.service_id);
                            setFormData({
                              ...formData,
                              services_with_quantity: updatedServices,
                              services: updatedServiceIds
                            });
                          }
                        }}
                        className="enhanced-form"
                      >
                        <option value="">Chọn dịch vụ để thêm</option>
                        {services.filter(service => !formData.services_with_quantity.some(s => s.service_id === service.id)).map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {formatCurrency(service.price)}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Ngày hẹn *</Form.Label>
                  <DatePicker
                    value={formData.appointment_date}
                    onChange={(value) => setFormData({ ...formData, appointment_date: value })}
                    required 
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <TimePicker
                  value={formData.appointment_time}
                  onChange={(time) => setFormData({ ...formData, appointment_time: time })}
                  label="Giờ hẹn"
                  required
                  appointmentDate={formData.appointment_date}
                  businessHoursOnly={true}
                />
                {formData.appointment_date && (
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {getBusinessHoursInfo(formData.appointment_date)}
                  </Form.Text>
                )}
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Thời gian (phút) *</Form.Label>
                  <Form.Control
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              {dialogError && (
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={() => setDialogError('')}
                  className="me-2"
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Xóa lỗi
                </Button>
              )}
            </div>
            <div>
              <Button variant="outline-secondary" onClick={handleCloseDialog} className="btn-outline-enhanced me-2">
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                className="btn-primary-enhanced"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {editingAppointment ? 'Đang cập nhật...' : 'Đang đặt lịch...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingAppointment ? 'Cập nhật' : 'Đặt lịch'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Appointments;
