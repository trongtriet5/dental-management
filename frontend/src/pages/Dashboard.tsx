import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { DashboardStats, FinancialSummary, Appointment } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current month date range for financial summary
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const startDate = firstDayOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = lastDayOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch all dashboard data in parallel
        const [
          statsResponse,
          financialResponse,
          todayResponse,
          upcomingResponse,
          customersResponse
        ] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getFinancialSummary(startDate, endDate),
          api.getTodayAppointments(),
          api.getUpcomingAppointments(),
          api.getCustomers({ page_size: 5 })
        ]);

        // Handle stats
        if (statsResponse.status === 'fulfilled') {
          setStats(statsResponse.value);
        }

        // Handle financial summary
        if (financialResponse.status === 'fulfilled') {
          setFinancialSummary(financialResponse.value);
        }

        // Handle today's appointments
        if (todayResponse.status === 'fulfilled') {
          setTodayAppointments(todayResponse.value);
        }

        // Handle upcoming appointments
        if (upcomingResponse.status === 'fulfilled') {
          setUpcomingAppointments(upcomingResponse.value);
        }

        // Handle recent customers
        if (customersResponse.status === 'fulfilled') {
          setRecentCustomers(customersResponse.value.results || []);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    // Get current time in Vietnam timezone (UTC+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    const hour = vietnamTime.getHours();
    
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Lỗi!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="py-4">
              <h2 className="mb-2">
                {getGreeting()}, {user?.last_name} {user?.first_name}! 👋
              </h2>
              <p className="mb-0 opacity-75">
                Chào mừng bạn đến với hệ thống quản lý phòng khám nha khoa I-DENT CLINIC
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center position-relative">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="total-customers-tooltip">
                    Tổng khách hàng trong tháng này
                  </Tooltip>
                }
              >
                <i className="bi bi-info-circle position-absolute top-0 end-0 m-2 text-muted" style={{ cursor: 'help' }}></i>
              </OverlayTrigger>
              <div className="text-primary mb-2">
                <i className="bi bi-people fs-1"></i>
              </div>
              <h4 className="text-primary mb-1">{stats?.total_customers || 0}</h4>
              <p className="text-muted mb-0">Tổng khách hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center position-relative">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="today-appointments-tooltip">
                    Tổng số lịch hẹn trong ngày hôm nay
                  </Tooltip>
                }
              >
                <i className="bi bi-info-circle position-absolute top-0 end-0 m-2 text-muted" style={{ cursor: 'help' }}></i>
              </OverlayTrigger>
              <div className="text-info mb-2">
                <i className="bi bi-calendar-check fs-1"></i>
              </div>
              <h4 className="text-info mb-1">{todayAppointments.length}</h4>
              <p className="text-muted mb-0">Lịch hẹn hôm nay</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center position-relative">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="monthly-revenue-tooltip">
                    Số tiền khách hàng đã thanh toán trong tháng này
                  </Tooltip>
                }
              >
                <i className="bi bi-info-circle position-absolute top-0 end-0 m-2 text-muted" style={{ cursor: 'help' }}></i>
              </OverlayTrigger>
              <div className="text-success mb-2">
                <i className="bi bi-graph-up fs-1"></i>
              </div>
              <h4 className="text-success mb-1">{formatCurrency(financialSummary?.total_revenue || 0)}</h4>
              <p className="text-muted mb-0">Doanh thu tháng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center position-relative">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="pending-revenue-tooltip">
                    Số tiền khách hàng chưa thanh toán trong tháng này
                  </Tooltip>
                }
              >
                <i className="bi bi-info-circle position-absolute top-0 end-0 m-2 text-muted" style={{ cursor: 'help' }}></i>
              </OverlayTrigger>
              <div className="text-warning mb-2">
                <i className="bi bi-clock-history fs-1"></i>
              </div>
              <h4 className="text-warning mb-1">{formatCurrency(financialSummary?.pending_payments || 0)}</h4>
              <p className="text-muted mb-0">Doanh thu chờ</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center position-relative">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="expenses-tooltip">
                    Tổng chi phí trong tháng này
                  </Tooltip>
                }
              >
                <i className="bi bi-info-circle position-absolute top-0 end-0 m-2 text-muted" style={{ cursor: 'help' }}></i>
              </OverlayTrigger>
              <div className="text-danger mb-2">
                <i className="bi bi-graph-down fs-1"></i>
              </div>
              <h4 className="text-danger mb-1">{formatCurrency(financialSummary?.total_expenses || 0)}</h4>
              <p className="text-muted mb-0">Chi phí</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Appointments Section - Moved to top */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-calendar-day me-2"></i>
                Lịch hẹn hôm nay
              </h5>
            </Card.Header>
            <Card.Body>
              {todayAppointments.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                  <p>Không có lịch hẹn nào hôm nay</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {todayAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{appointment.customer_name}</h6>
                          <small className="text-muted">
                            {appointment.appointment_time} - {appointment.doctor_name}
                          </small>
                        </div>
                        <span className={`badge ${
                          appointment.status === 'scheduled' ? 'bg-primary' :
                          appointment.status === 'confirmed' ? 'bg-success' :
                          appointment.status === 'arrived' ? 'bg-info' :
                          appointment.status === 'in_progress' ? 'bg-warning' :
                          appointment.status === 'completed' ? 'bg-success' :
                          appointment.status === 'cancelled' ? 'bg-danger' :
                          appointment.status === 'no_show' ? 'bg-secondary' :
                          'bg-secondary'
                        }`}>
                          {appointment.status === 'scheduled' ? 'Đã đặt' :
                           appointment.status === 'confirmed' ? 'Xác nhận' :
                           appointment.status === 'arrived' ? 'Đã đến' :
                           appointment.status === 'in_progress' ? 'Đang khám' :
                           appointment.status === 'completed' ? 'Hoàn thành' :
                           appointment.status === 'cancelled' ? 'Hủy' :
                           appointment.status === 'no_show' ? 'Không đến' :
                           appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-calendar3 me-2"></i>
                Lịch hẹn sắp tới
              </h5>
            </Card.Header>
            <Card.Body>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-calendar-check fs-1 mb-3 d-block"></i>
                  <p>Không có lịch hẹn sắp tới</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="list-group-item border-0 px-0">
                      <div>
                        <h6 className="mb-1">{appointment.customer_name}</h6>
                        <small className="text-muted">
                          {(() => {
                            try {
                              // Parse DD/MM/YYYY format
                              if (appointment.appointment_date && appointment.appointment_date.includes('/')) {
                                const [day, month, year] = appointment.appointment_date.split('/');
                                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                return date.toLocaleDateString('vi-VN');
                              }
                              // Fallback to direct parsing
                              return new Date(appointment.appointment_date).toLocaleDateString('vi-VN');
                            } catch (error) {
                              return appointment.appointment_date;
                            }
                          })()} - {appointment.appointment_time}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Customers Section - Moved to bottom */}
      <Row className="mb-4">
        <Col>
          <Card className="h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Khách hàng mới nhất
              </h5>
            </Card.Header>
            <Card.Body>
              {recentCustomers.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-person-x fs-1 mb-3 d-block"></i>
                  <p>Chưa có khách hàng nào</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Số điện thoại</th>
                        <th>Email</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="fw-semibold">{customer.full_name}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.email || 'Chưa có'}</td>
                          <td>
                            {(() => {
                              try {
                                // Handle DD/MM/YYYY HH:MM format from backend
                                if (customer.created_at && customer.created_at.includes('/')) {
                                  const [datePart, timePart] = customer.created_at.split(' ');
                                  const [day, month, year] = datePart.split('/');
                                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                  return date.toLocaleDateString('vi-VN');
                                }
                                // Fallback to direct parsing
                                return new Date(customer.created_at).toLocaleDateString('vi-VN');
                              } catch (error) {
                                return customer.created_at || 'N/A';
                              }
                            })()}
                          </td>
                          <td>
                            <span className={`badge ${
                              customer.status === 'active' ? 'bg-success' :
                              customer.status === 'inactive' ? 'bg-secondary' :
                              customer.status === 'success' ? 'bg-primary' :
                              'bg-success' // Default to 'Đang chăm sóc'
                            }`}>
                              {customer.status === 'active' ? 'Đang chăm sóc' :
                               customer.status === 'inactive' ? 'Ngưng chăm sóc' :
                               customer.status === 'success' ? 'Thành công' :
                               'Đang chăm sóc'} {/* Default status */}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;