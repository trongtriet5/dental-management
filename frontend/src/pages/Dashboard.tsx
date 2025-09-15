import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [
          statsResponse,
          financialResponse,
          todayResponse,
          upcomingResponse
        ] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getFinancialSummary(),
          api.getTodayAppointments(),
          api.getUpcomingAppointments()
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
    const hour = new Date().getHours();
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
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">
                <i className="bi bi-people fs-1"></i>
              </div>
              <h4 className="text-primary mb-1">{stats?.total_customers || 0}</h4>
              <p className="text-muted mb-0">Tổng khách hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <i className="bi bi-calendar-check fs-1"></i>
              </div>
              <h4 className="text-success mb-1">{stats?.today_appointments || 0}</h4>
              <p className="text-muted mb-0">Lịch hẹn hôm nay</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <i className="bi bi-cash-stack fs-1"></i>
              </div>
              <h4 className="text-warning mb-1">{formatCurrency(stats?.this_month_revenue || 0)}</h4>
              <p className="text-muted mb-0">Doanh thu tháng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <i className="bi bi-clock-history fs-1"></i>
              </div>
              <h4 className="text-info mb-1">{stats?.pending_payments || 0}</h4>
              <p className="text-muted mb-0">Thanh toán chờ</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Today's Appointments */}
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
    </Container>
  );
};

export default Dashboard;