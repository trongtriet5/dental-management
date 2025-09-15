import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Table, Alert, Spinner, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import api from '../services/api';
import { Appointment, Customer, Service, Branch, User, AppointmentFormData } from '../types';
import TimePicker from '../components/TimePicker';
import DatePicker from '../components/DatePicker';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/date';
import { formatTime, formatDate } from '../utils/time';

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
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer: 0,
    doctor: 0,
    branch: 0,
    services: [],
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 60,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, customersData, servicesData, branchesData, doctorsData] = await Promise.all([
        api.getAppointments({ page_size: 1000 }),
        api.getCustomers({ page_size: 1000 }),
        api.getServices(),
        api.getBranches(),
        api.getDoctors(),
      ]);
      setAppointments(appointmentsData.results);
      setCustomers(customersData.results);
      setServices(servicesData.results);
      setBranches(branchesData.results);
      setDoctors(doctorsData.results);
    } catch (err: any) {
      setError('Không thể tải dữ liệu lịch hẹn');
    } finally {
      setIsLoading(false);
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
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        duration_minutes: appointment.duration_minutes,
        notes: appointment.notes || '',
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        customer: 0,
        doctor: 0,
        branch: 0,
        services: [],
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        duration_minutes: 60,
        notes: ''
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAppointment(null);
  };

  const handleSubmit = async () => {
    setDialogError('');
    setIsSubmitting(true);

    const validServiceIds = new Set(services.map(s => s.id));
    const sanitizedServices = (formData.services || []).filter(id => validServiceIds.has(id));

    if (sanitizedServices.length !== (formData.services || []).length) {
        setDialogError('Một vài dịch vụ đã chọn không còn hợp lệ và đã được tự động loại bỏ. Vui lòng kiểm tra lại.');
        setFormData({...formData, services: sanitizedServices });
        return;
    }

    if (!formData.customer || !formData.doctor || !formData.branch) {
        setDialogError('Vui lòng điền đầy đủ các trường bắt buộc: Khách hàng, Bác sĩ, và Chi nhánh.');
        return;
    }

    // Only require services for new appointments
    if (!editingAppointment && sanitizedServices.length === 0) {
        setDialogError('Vui lòng chọn ít nhất một dịch vụ.');
        return;
    }

    // Check business hours
    if (!isValidAppointmentTime(formData.appointment_date, formData.appointment_time)) {
        const businessHoursInfo = getBusinessHoursInfo(formData.appointment_date);
        setDialogError(`Thời gian đặt lịch không hợp lệ. Giờ làm việc: ${businessHoursInfo}`);
        return;
    }

    try {
      const dataToSubmit = { ...formData, services: sanitizedServices };

      if (editingAppointment) {
        await api.updateAppointment(editingAppointment.id, dataToSubmit);
      } else {
        await api.createAppointment(dataToSubmit);
      }
      
      // Only close dialog and refresh data if successful
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
      // Do NOT close the dialog - let user fix the error
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
    
    if (viewMode === 'calendar') {
      // For calendar view, filter by selected calendar date
      if (calendarDate) {
        const calendarDateObj = new Date(calendarDate);
        const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        const calendarDateOnly = new Date(calendarDateObj.getFullYear(), calendarDateObj.getMonth(), calendarDateObj.getDate());
        matchesDate = appointmentDateOnly.getTime() === calendarDateOnly.getTime();
      }
    } else {
      // For table view, use date range filters
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
    for (let hour = 8; hour <= 20; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      });
    }
    return slots;
  };

  const getAppointmentsForTimeSlot = (timeSlot: { time: string; hour: number }) => {
    return filteredAppointments.filter(appointment => {
      const appointmentHour = parseInt(appointment.appointment_time.split(':')[0]);
      return appointmentHour === timeSlot.hour;
    });
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
            {viewMode === 'table' && (
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
            )}
            {viewMode === 'calendar' && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-primary">Ngày xem</Form.Label>
                  <DatePicker
                    value={calendarDate}
                    onChange={setCalendarDate}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            )}
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
                  Lịch trình ngày {calendarDate ? formatDate(calendarDate) : 'Hôm nay'}
                </h4>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const prevDate = new Date(calendarDate);
                      prevDate.setDate(prevDate.getDate() - 1);
                      setCalendarDate(prevDate.toISOString().split('T')[0]);
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCalendarDate(new Date().toISOString().split('T')[0])}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const nextDate = new Date(calendarDate);
                      nextDate.setDate(nextDate.getDate() + 1);
                      setCalendarDate(nextDate.toISOString().split('T')[0]);
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
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
              <div className="border rounded">
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
                {generateTimeSlots().map((timeSlot) => {
                  const appointmentsInSlot = getAppointmentsForTimeSlot(timeSlot);
                  return (
                    <div key={timeSlot.time} className="row g-0 border-bottom">
                      {/* Time Slot */}
                      <div className="col-2 border-end bg-light d-flex align-items-center justify-content-center">
                        <div className="p-3 text-center">
                          <div className="fw-semibold">{timeSlot.time}</div>
                        </div>
                      </div>
                      
                      {/* Appointments */}
                      <div className="col-10 p-3">
                        {appointmentsInSlot.length > 0 ? (
                          <div className="row g-2">
                            {appointmentsInSlot.map((appointment) => (
                              <div key={appointment.id} className="col-md-6 col-lg-4">
                                <div
                                  className="card border-0 h-100"
                                  style={{
                                    borderLeft: `4px solid ${getDoctorColor(appointment.doctor)} !important`,
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                                    transition: 'box-shadow 0.2s ease-in-out'
                                  }}
                                >
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0 fw-semibold text-dark">
                                        {appointment.customer_name}
                                      </h6>
                                      <span className={`badge bg-${getStatusVariant(appointment.status)}`}>
                                        {getStatusText(appointment.status)}
                                      </span>
                                    </div>
                                    
                                    <div className="mb-2">
                                      <small className="text-muted d-block">
                                        <i className="bi bi-person me-1"></i>
                                        {appointment.doctor_name}
                                      </small>
                                      <small className="text-muted d-block">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {appointment.branch_name}
                                      </small>
                                    </div>
                                    
                                    <div className="mb-3">
                                      <small className="text-muted d-block mb-1">Dịch vụ:</small>
                                      <div className="text-truncate" title={appointment.service_names}>
                                        {appointment.service_names}
                                      </div>
                                    </div>
                                    
                                    <div className="d-flex gap-1">
                                      <Form.Select
                                        size="sm"
                                        value={appointment.status}
                                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                                        className="flex-grow-1"
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        {['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].map(status => (
                                          <option key={status} value={status}>{getStatusText(status)}</option>
                                        ))}
                                      </Form.Select>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleOpenDialog(appointment)}
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(appointment.id)}
                                        style={{ fontSize: '0.75rem' }}
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
                          <div className="text-center text-muted py-3">
                            <i className="bi bi-calendar-x me-2"></i>
                            Không có lịch hẹn
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Khách hàng *</Form.Label>
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
                  <Form.Label className="fw-semibold">Dịch vụ *</Form.Label>
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
                    <Form.Select
                      multiple
                      value={formData.services.map(String)}
                      onChange={handleServiceChange}
                      className="enhanced-form"
                      size="sm"
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </Form.Select>
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
