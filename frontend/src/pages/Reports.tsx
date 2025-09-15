import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  ButtonGroup, 
  Spinner, 
  Alert, 
  Form, 
  FormControl,
  FormSelect,
  Table,
  Badge
} from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../services/api';
import { FinancialSummary, DashboardStats } from '../types';
import DatePicker from '../components/DatePicker';
import DateRangePicker from '../components/DateRangePicker';
import { formatCurrency } from '../utils/currency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports: React.FC = () => {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueByService, setRevenueByService] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    try {
      const [summaryData, revenueData] = await Promise.all([
        api.getFinancialSummary(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')),
        api.getRevenueByService(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')),
      ]);
      setFinancialSummary(summaryData);
      setRevenueByService(revenueData);
      
      // Tạo mock data cho dashboard stats thay vì gọi API
      setDashboardStats({
        total_customers: 0,
        total_appointments: 0,
        today_appointments: 0,
        this_month_revenue: summaryData.total_revenue || 0,
        this_month_expenses: summaryData.total_expenses || 0,
        pending_payments: 0,
      });
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError('Không thể tải dữ liệu báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    fetchReportData();
  };

  const handleExportReport = () => {
    const reportId = (window as any).lastGeneratedReportId;
    if (!reportId) {
      alert('Vui lòng tạo báo cáo trước để xuất.');
      return;
    }
    api.exportGeneratedReportXlsx(reportId);
  };

  const handleExportReportPdf = () => {
    const reportId = (window as any).lastGeneratedReportId;
    if (!reportId) {
      alert('Vui lòng tạo báo cáo trước để xuất.');
      return;
    }
    api.exportGeneratedReportPdf(reportId);
  };

  const getRevenueChartData = () => {
    const data = [];
    for (let i = 0; i < 30; i++) {
      const date = dayjs().subtract(29 - i, 'day');
      data.push({
        date: date.format('DD/MM'),
        revenue: Math.floor(Math.random() * 1000000) + 500000,
        expenses: Math.floor(Math.random() * 500000) + 200000,
      });
    }
    return data;
  };

  const getAppointmentChartData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(6 - i, 'day');
      data.push({
        date: date.format('ddd'),
        appointments: Math.floor(Math.random() * 20) + 5,
        completed: Math.floor(Math.random() * 15) + 3,
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <Container className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold mb-0">Báo cáo thống kê</h2>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            className="btn-success-enhanced"
            onClick={handleExportReport}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Xuất Excel
          </Button>
          <Button
            variant="outline-primary"
            className="btn-outline-enhanced"
            onClick={handleExportReportPdf}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Xuất PDF
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      {/* Date Range Selector */}
      <Card className="card-enhanced mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Khoảng thời gian</Form.Label>
                <DateRangePicker
                  startDate={startDate.format('DD/MM/YYYY')}
                  endDate={endDate.format('DD/MM/YYYY')}
                  onStartDateChange={(value) => {
                    if (value) {
                      // Convert DD/MM/YYYY to dayjs object
                      const [day, month, year] = value.split('/');
                      setStartDate(dayjs(`${year}-${month}-${day}`));
                    }
                  }}
                  onEndDateChange={(value) => {
                    if (value) {
                      // Convert DD/MM/YYYY to dayjs object
                      const [day, month, year] = value.split('/');
                      setEndDate(dayjs(`${year}-${month}-${day}`));
                    }
                  }}
                  placeholder="Chọn khoảng thời gian"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={3}>
              <Form.Group>
                <Form.Label>Loại báo cáo</Form.Label>
                <FormSelect
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  <option value="overview">Tổng quan</option>
                  <option value="revenue">Doanh thu</option>
                  <option value="appointments">Lịch hẹn</option>
                  <option value="customers">Khách hàng</option>
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12} sm={3}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <Button variant="primary" onClick={handleDateRangeChange} className="w-100">
                  Cập nhật
                </Button>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Overview Cards */}
      {financialSummary && (
        <Row className="mb-4">
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="card-enhanced h-100">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-graph-up fs-1"></i>
                </div>
                <h4 className="mb-1">{formatCurrency(financialSummary.total_revenue)}</h4>
                <p className="text-muted mb-0">Tổng doanh thu</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="card-enhanced h-100">
              <Card.Body className="text-center">
                <div className="text-danger mb-2">
                  <i className="bi bi-graph-down fs-1"></i>
                </div>
                <h4 className="mb-1">{formatCurrency(financialSummary.total_expenses)}</h4>
                <p className="text-muted mb-0">Tổng chi phí</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="card-enhanced h-100">
              <Card.Body className="text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-clock-history fs-1"></i>
                </div>
                <h4 className="mb-1">{formatCurrency(financialSummary.pending_payments)}</h4>
                <p className="text-muted mb-0">Chờ thanh toán</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="card-enhanced h-100">
              <Card.Body className="text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-people fs-1"></i>
                </div>
                <h4 className="mb-1">{dashboardStats?.total_customers || 0}</h4>
                <p className="text-muted mb-0">Tổng khách hàng</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row>
        {/* Revenue Chart */}
        <Col xs={12} md={8} className="mb-4">
          <Card className="card-enhanced">
            <Card.Header>
              <h5 className="mb-0">Biểu đồ doanh thu và chi phí</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getRevenueChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'VNĐ']} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Appointments Chart */}
        <Col xs={12} md={4} className="mb-4">
          <Card className="card-enhanced">
            <Card.Header>
              <h5 className="mb-0">Lịch hẹn tuần này</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAppointmentChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#8884d8" />
                  <Bar dataKey="completed" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Revenue by Service */}
        <Col xs={12} md={6} className="mb-4">
          <Card className="card-enhanced">
            <Card.Header>
              <h5 className="mb-0">Doanh thu theo dịch vụ</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Dịch vụ</th>
                    <th className="text-end">Tổng tiền</th>
                    <th className="text-end">Đã thu</th>
                    <th className="text-end">Còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByService.map((item, index) => (
                    <tr key={index}>
                      <td>{item.service_name}</td>
                      <td className="text-end">
                        {formatCurrency(item.total_amount)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(item.paid_amount)}
                      </td>
                      <td className="text-end">
                        <Badge bg={item.pending_amount > 0 ? 'warning' : 'success'}>
                          {formatCurrency(item.pending_amount)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Service Distribution */}
        <Col xs={12} md={6} className="mb-4">
          <Card className="card-enhanced">
            <Card.Header>
              <h5 className="mb-0">Phân bố dịch vụ</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByService}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_amount"
                  >
                    {revenueByService.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'VNĐ']} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
