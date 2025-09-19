import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Table, Alert, Spinner, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Appointment, Customer, Service, Branch, User, AppointmentFormData } from '../types';
import TimePicker from '../components/TimePicker';
import TimeRangePicker from '../components/TimeRangePicker';
import DatePicker from '../components/DatePicker';
import Calendar from '../components/Calendar';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/date';
import { formatTime, formatDate } from '../utils/time';
import { formatCurrency } from '../utils/currency';
import { validatePhoneNumber, getPhoneNumberError } from '../utils/validation';
import '../styles/calendar.css';

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

// Validate date range
const validateDateRange = (start: string, end: string): string => {
  if (!start || !end) return '';
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (endDate < startDate) {
    return 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
  }
  
  return '';
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
  const [dateRangeError, setDateRangeError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  
  // Form data for creating/editing appointments
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer_name: '',
    customer_phone: '',
    doctor: 0,
    branch: 0,
    services: [],
    services_with_quantity: [],
    appointment_date: '',
    appointment_time: '',
    end_time: '',
    duration_minutes: 60,
    appointment_type: 'consultation',
    notes: ''
  });
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle start date change
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    const error = validateDateRange(value, endDate);
    setDateRangeError(error);
  };

  // Handle end date change
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    const error = validateDateRange(startDate, value);
    setDateRangeError(error);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsData, customersData, servicesData, branchesData, doctorsData] = await Promise.all([
        api.getAppointments(),
        api.getCustomers(),
        api.getServices(),
        api.getBranches(),
        api.getDoctors()
      ]);
      
      console.log('Fetched appointments data:', appointmentsData);
      
      setAppointments(appointmentsData.results || appointmentsData);
      setCustomers(customersData.results || customersData);
      setServices(servicesData.results || servicesData);
      setBranches(branchesData.results || branchesData);
      setDoctors(doctorsData.results || doctorsData);
      
      console.log('Set appointments:', appointmentsData.results || appointmentsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = async (appointment?: Appointment) => {
    setDialogError('');
    if (appointment) {
      setEditingAppointment(appointment);
      // Populate form with existing appointment data
      setFormData({
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        doctor: appointment.doctor,
        branch: appointment.branch,
        services: appointment.services || [],
        services_with_quantity: appointment.services_with_quantity || [],
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        end_time: appointment.end_time || '',
        duration_minutes: appointment.duration_minutes || 60,
        appointment_type: appointment.appointment_type || 'consultation',
        notes: appointment.notes || ''
      });
      setSelectedServices(appointment.services || []);
    } else {
      setEditingAppointment(null);
      // Reset form for new appointment
      setFormData({
        customer_name: '',
        customer_phone: '',
        doctor: 0,
        branch: 0,
        services: [],
        services_with_quantity: [],
        appointment_date: '',
        appointment_time: '',
        end_time: '',
        duration_minutes: 60,
        appointment_type: 'consultation',
        notes: ''
      });
      setSelectedServices([]);
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAppointment(null);
    setDialogError('');
    setFormData({
      customer_name: '',
      customer_phone: '',
      doctor: 0,
      branch: 0,
      services: [],
      services_with_quantity: [],
      appointment_date: '',
      appointment_time: '',
      end_time: '',
      duration_minutes: 60,
      appointment_type: 'consultation',
      notes: ''
    });
    setSelectedServices([]);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setDialogError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.customer_name.trim()) {
        setDialogError('Tên khách hàng là bắt buộc');
        return;
      }
      // Validate phone number
      const phoneError = getPhoneNumberError(formData.customer_phone);
      if (phoneError) {
        setDialogError(phoneError);
        return;
      }
      if (!formData.doctor) {
        setDialogError('Vui lòng chọn bác sĩ');
        return;
      }
      if (!formData.branch) {
        setDialogError('Vui lòng chọn chi nhánh');
        return;
      }
      if (!formData.appointment_date) {
        setDialogError('Vui lòng chọn ngày hẹn');
        return;
      }
      if (!formData.appointment_time) {
        setDialogError('Vui lòng chọn giờ hẹn');
        return;
      }
      if (selectedServices.length === 0) {
        setDialogError('Vui lòng chọn ít nhất một dịch vụ');
        return;
      }

      const appointmentData = {
        ...formData,
        services: selectedServices,
        services_with_quantity: selectedServices.map(serviceId => ({ service_id: serviceId, quantity: 1 })),
        status: editingAppointment ? editingAppointment.status : 'scheduled' as const
      };

      if (editingAppointment) {
        // Update existing appointment
        await api.updateAppointment(editingAppointment.id, appointmentData);
        await Swal.fire({
          title: 'Thành công!',
          text: 'Lịch hẹn đã được cập nhật',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        // Create new appointment
        await api.createAppointment(appointmentData);
        await Swal.fire({
          title: 'Thành công!',
          text: 'Lịch hẹn đã được tạo',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }

      // Refresh data
      await fetchData();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      
      // Handle different types of errors with SweetAlert
      let errorMessage = 'Có lỗi xảy ra khi lưu lịch hẹn';
      let errorTitle = 'Lỗi';
      let errorType: 'error' | 'warning' = 'error';
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else {
          // Handle field-specific errors
          const fieldErrors = Object.values(err.response.data).flat();
          if (fieldErrors.length > 0) {
            errorMessage = String(fieldErrors[0]);
          }
        }
        
        // Check for specific error types
        if (errorMessage.includes('trùng lịch hẹn') || errorMessage.includes('duplicate') || errorMessage.includes('conflict')) {
          errorTitle = 'Lịch hẹn trùng lặp';
          errorType = 'warning';
        } else if (errorMessage.includes('giờ làm việc') || errorMessage.includes('business hours') || errorMessage.includes('không hợp lệ')) {
          errorTitle = 'Giờ hẹn không hợp lệ';
          errorType = 'warning';
        } else if (errorMessage.includes('quá khứ') || errorMessage.includes('past')) {
          errorTitle = 'Thời gian không hợp lệ';
          errorType = 'warning';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show SweetAlert for specific errors, otherwise show in dialog
      if (errorType === 'warning') {
        await Swal.fire({
          title: errorTitle,
          text: errorMessage,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      } else {
        setDialogError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      
      // Update local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus as Appointment['status'] }
            : appointment
        )
      );
      
      // Show success message
      await Swal.fire({
        title: 'Thành công!',
        text: 'Trạng thái lịch hẹn đã được cập nhật',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (err: any) {
      console.error('Error updating appointment status:', err);
      
      // Show error message
      await Swal.fire({
        title: 'Lỗi!',
        text: 'Không thể cập nhật trạng thái lịch hẹn',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      
      // Refresh data to get correct status
      await fetchData();
    }
  };

  // Filter appointments for table view
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = (appointment.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (appointment.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || appointment.status === selectedStatus;
    
    let matchesDate = true;
    const appointmentDate = parseAppointmentDate(appointment.appointment_date);
    
    if (!appointmentDate) {
      return false;
    }
    
    // Use date range filters
    if ((startDate || endDate) && !dateRangeError) {
      const start = startDate ? parseAppointmentDate(startDate) : null;
      const end = endDate ? parseAppointmentDate(endDate) : null;
      
      const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      
      if (start && end) {
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        if (startDateOnly.getTime() === endDateOnly.getTime()) {
          matchesDate = appointmentDateOnly.getTime() === startDateOnly.getTime();
        } else {
          matchesDate = appointmentDateOnly >= startDateOnly && appointmentDateOnly <= endDateOnly;
        }
      } else if (start) {
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        matchesDate = appointmentDateOnly >= startDateOnly;
      } else if (end) {
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        matchesDate = appointmentDateOnly <= endDateOnly;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  return (
    <div className="container-fluid p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-0">
            Quản lý lịch hẹn
          </h2>
          <p className="text-muted mb-0">Quản lý và theo dõi lịch hẹn khách hàng</p>
        </div>
        <div className="d-flex gap-2">
          <ToggleButtonGroup 
            type="radio" 
            name="viewMode" 
            value={viewMode} 
            onChange={setViewMode}
            className="shadow-sm"
          >
            <ToggleButton 
              id="table-view" 
              value="table" 
              variant="outline-primary"
              className="btn-outline-enhanced"
            >
              <i className="bi bi-table me-1"></i>
              Bảng
            </ToggleButton>
            <ToggleButton 
              id="calendar-view" 
              value="calendar" 
              variant="outline-primary"
              className="btn-outline-enhanced"
            >
              <i className="bi bi-calendar3 me-1"></i>
              Lịch
            </ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="primary" 
            onClick={() => handleOpenDialog()}
            className="btn-primary-enhanced"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Đặt lịch mới
          </Button>
        </div>
      </div>

      <Card className="card-enhanced">
        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              {error}
            </Alert>
          )}

          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" variant="primary" />
              <span className="ms-2">Đang tải dữ liệu...</span>
            </div>
          ) : viewMode === 'table' ? (
            <div className="p-4">
              {/* Filters */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold text-primary">Tìm kiếm</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Tên khách hàng hoặc bác sĩ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="enhanced-form"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-3">
                  <Form.Group>
                    <Form.Label className="fw-semibold text-primary">Trạng thái</Form.Label>
                    <Form.Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="enhanced-form"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="scheduled">Đã đặt</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="arrived">Đã đến</option>
                      <option value="in_progress">Đang khám</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                      <option value="no_show">Không đến</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-semibold text-primary">Khoảng thời gian</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="date"
                        placeholder="Từ ngày"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className={`flex-fill ${dateRangeError ? 'is-invalid' : ''}`}
                      />
                      <Form.Control
                        type="date"
                        placeholder="Đến ngày"
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className={`flex-fill ${dateRangeError ? 'is-invalid' : ''}`}
                      />
                    </div>
                    {dateRangeError && (
                      <div className="invalid-feedback d-block">
                        {dateRangeError}
                      </div>
                    )}
                    {(startDate || endDate) && !dateRangeError && (
                      <Form.Text className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        {startDate && endDate && startDate === endDate ? (
                          <>Hiển thị lịch hẹn ngày {startDate}</>
                        ) : (
                          <>Hiển thị lịch hẹn từ {startDate || 'bất kỳ'} đến {endDate || 'bất kỳ'}</>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 ms-2"
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setDateRangeError('');
                          }}
                        >
                          <i className="bi bi-x-circle"></i> Xóa
                        </Button>
                      </Form.Text>
                    )}
                  </Form.Group>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <Table className="table-enhanced mb-0">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Bác sĩ</th>
                      <th>Ngày & Giờ</th>
                      <th>Dịch vụ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map(appointment => (
                        <tr key={appointment.id}>
                          <td>
                            <div>
                              <div className="fw-semibold">{appointment.customer_name}</div>
                              <small className="text-muted">{appointment.customer_phone}</small>
                            </div>
                          </td>
                          <td>{appointment.doctor_name}</td>
                          <td>
                            <div>
                              <div>{appointment.appointment_date}</div>
                              <small className="text-muted">
                                {formatTime(appointment.appointment_time)}
                                {appointment.end_time && ` - ${formatTime(appointment.end_time)}`}
                              </small>
                            </div>
                          </td>
                          <td>{appointment.service_names}</td>
                          <td>
                            <Form.Select
                              value={appointment.status}
                              onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                              size="sm"
                              className="status-select"
                              style={{ 
                                minWidth: '120px',
                                fontSize: '0.875rem',
                                border: 'none',
                                backgroundColor: `var(--bs-${getStatusVariant(appointment.status)})`,
                                color: 'white',
                                fontWeight: '500'
                              }}
                            >
                              <option value="scheduled">Chờ xác nhận</option>
                              <option value="confirmed">Đã xác nhận</option>
                              <option value="arrived">Khách đã đến</option>
                              <option value="in_progress">Đang điều trị</option>
                              <option value="completed">Hoàn thành</option>
                              <option value="cancelled">Đã huỷ</option>
                              <option value="no_show">Khách không đến</option>
                            </Form.Select>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleOpenDialog(appointment)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <i className="bi bi-calendar-x text-muted me-2"></i>
                          Không có lịch hẹn nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            // IMPROVED CALENDAR WITH DATE RANGE SUPPORT
            <Calendar
              appointments={appointments} // Pass all appointments
              doctors={doctors}
              onAppointmentClick={handleOpenDialog}
              onDateClick={(date) => {
                setCurrentCalendarDate(date);
                // Don't set date range when clicking on calendar dates
                // This prevents hiding appointment boxes
                // setStartDate(dateStr);
                // setEndDate(dateStr);
                // setDateRangeError('');
              }}
              currentDate={currentCalendarDate}
              onDateChange={setCurrentCalendarDate}
              viewMode={calendarViewMode}
              onViewModeChange={setCalendarViewMode}
              startDate={startDate}
              endDate={endDate}
              showAllInRange={!!(startDate && endDate && !dateRangeError)}
            />
          )}
        </Card.Body>
      </Card>

      {/* Appointment Dialog */}
      <Modal show={showDialog} onHide={handleCloseDialog} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-calendar-event me-2"></i>
            {editingAppointment ? 'Chi tiết lịch hẹn' : 'Đặt lịch thăm khám'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="enhanced-form">
          {dialogError && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div>
                  <strong>Lỗi:</strong>
                  <div className="mt-1">{dialogError}</div>
                </div>
              </div>
            </Alert>
          )}
          
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Tên khách hàng *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="enhanced-form"
                    placeholder="Nhập tên khách hàng"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Số điện thoại *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    className="enhanced-form"
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Bác sĩ *</Form.Label>
                  <Form.Select
                    value={formData.doctor}
                    onChange={(e) => setFormData({...formData, doctor: parseInt(e.target.value)})}
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
                  <Form.Label className="fw-semibold text-primary">Chi nhánh *</Form.Label>
                  <Form.Select
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: parseInt(e.target.value)})}
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
                  <Form.Label className="fw-semibold text-primary">Ngày hẹn *</Form.Label>
                  <DatePicker
                    value={formData.appointment_date}
                    onChange={(value) => setFormData({...formData, appointment_date: value})}
                    className="enhanced-form"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Giờ hẹn *</Form.Label>
                  <TimeRangePicker
                    startTime={formData.appointment_time}
                    endTime={formData.end_time || ''}
                    onStartTimeChange={(value) => setFormData({...formData, appointment_time: value})}
                    onEndTimeChange={(value) => setFormData({...formData, end_time: value})}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Dịch vụ thăm khám</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {/* Group services by category */}
                    {(() => {
                      // Group all services by category
                      const servicesByCategory = services.reduce((acc, service) => {
                        const category = service.category || 'other';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(service);
                        return acc;
                      }, {} as Record<string, Service[]>);

                      const categoryLabels = {
                        'implant': 'Trồng răng implant',
                        'crown': 'Bọc răng sứ', 
                        'orthodontic': 'Niềng răng',
                        'other': 'Dịch vụ khác'
                      };

                      // Define the order for categories
                      const categoryOrder = ['implant', 'crown', 'orthodontic', 'other'];

                      const renderServiceButtons = (serviceList: Service[]) => (
                        <div className="d-flex flex-wrap gap-2">
                          {serviceList.map((service) => (
                            <Button
                              key={service.id}
                              variant={selectedServices.includes(service.id) ? "primary" : "outline-secondary"}
                              size="sm"
                              onClick={() => {
                                if (selectedServices.includes(service.id)) {
                                  setSelectedServices(selectedServices.filter(id => id !== service.id));
                                } else {
                                  setSelectedServices([...selectedServices, service.id]);
                                }
                              }}
                              className="enhanced-form"
                              style={{ 
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: selectedServices.includes(service.id) ? '#007bff' : 'transparent',
                                color: selectedServices.includes(service.id) ? 'white' : '#6c757d',
                                borderColor: selectedServices.includes(service.id) ? '#007bff' : '#6c757d',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                            >
                              {service.name}
                            </Button>
                          ))}
                        </div>
                      );

                      return (
                        <>
                          {/* Categories in specific order */}
                          {categoryOrder.map((category) => {
                            const categoryServices = servicesByCategory[category];
                            if (!categoryServices || categoryServices.length === 0) return null;
                            
                            return (
                              <div key={category} className="mb-3">
                                <h6 className="text-muted mb-2">{categoryLabels[category as keyof typeof categoryLabels]}</h6>
                                {renderServiceButtons(categoryServices)}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Loại lịch hẹn</Form.Label>
                  <Form.Select
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({...formData, appointment_type: e.target.value as any})}
                    className="enhanced-form"
                  >
                    <option value="consultation">Tư vấn</option>
                    <option value="treatment">Điều trị</option>
                    <option value="follow_up">Tái khám</option>
                    <option value="emergency">Khẩn cấp</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="enhanced-form"
                    placeholder="Nhập ghi chú..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              {editingAppointment && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: 'Xác nhận xóa',
                      text: 'Bạn có chắc chắn muốn xóa lịch hẹn này?',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Xóa',
                      cancelButtonText: 'Hủy',
                      confirmButtonColor: '#dc3545'
                    });
                    
                    if (result.isConfirmed) {
                      try {
                        await api.deleteAppointment(editingAppointment.id);
                        await Swal.fire({
                          title: 'Đã xóa!',
                          text: 'Lịch hẹn đã được xóa',
                          icon: 'success'
                        });
                        await fetchData();
                        handleCloseDialog();
                      } catch (err: any) {
                        Swal.fire({
                          title: 'Lỗi!',
                          text: 'Không thể xóa lịch hẹn',
                          icon: 'error'
                        });
                      }
                    }
                  }}
                >
                  <i className="bi bi-trash me-1"></i>
                  Xóa
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingAppointment ? 'Cập nhật' : 'Tạo lịch hẹn'}
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
