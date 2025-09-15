import React, { useState, useEffect } from 'react';
import {
  Container, 
  Row, 
  Col, 
  Card, 
  Button,
  ButtonGroup,
  Table,
  Spinner, 
  Alert,
  Modal, 
  Form, 
  Badge, 
  Nav, 
  Tab, 
  InputGroup,
  FormControl,
  FormSelect,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../services/api';
import { Payment as PaymentType, Expense, Customer, Service, Branch, FinancialSummary, PaymentFormData } from '../types';
import DatePicker from '../components/DatePicker';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/date';
import { formatCurrency } from '../utils/currency';

const Financials: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentType | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');
  const [customerServices, setCustomerServices] = useState<Service[]>([]);

  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    customer: 0,
    services: [],
    branch: 0,
    amount: 0,
    payment_method: 'cash',
    notes: '',
  });

  const getServicePrice = (serviceId: number) => {
    const svc = services.find((s) => s.id === serviceId);
    return svc ? Number(svc.price) : 0;
  };

  const getTotalServicePrice = (serviceIds: number[]) => {
    if (!serviceIds || serviceIds.length === 0) return 0;
    return serviceIds.reduce((total, serviceId) => {
      return total + getServicePrice(serviceId);
    }, 0);
  };

  const formatCurrencyInput = (value: number) => {
    if (!value || value === 0) return '';
    return value.toLocaleString('vi-VN');
  };

  const parseCurrencyInput = (value: string) => {
    if (!value) return 0;
    // Loại bỏ dấu phẩy và đơn vị "đ"
    const cleanValue = value.replace(/[,\sđ]/g, '');
    return parseFloat(cleanValue) || 0;
  };

  const handleAmountInputChange = (value: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const numbersOnly = value.replace(/[^\d]/g, '');
    
    if (numbersOnly === '') {
      setExpenseAmountDisplay('');
      setExpenseFormData({ ...expenseFormData, amount: 0 });
      return;
    }
    
    // Convert thành số và format lại
    const numericValue = parseFloat(numbersOnly);
    const formattedValue = numericValue.toLocaleString('vi-VN');
    
    setExpenseAmountDisplay(formattedValue);
    setExpenseFormData({ ...expenseFormData, amount: numericValue });
  };

  const handleAddPaymentAmountChange = (value: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const numbersOnly = value.replace(/[^\d]/g, '');
    
    if (numbersOnly === '') {
      setAddPaymentAmountDisplay('');
      setAddPaymentData({ ...addPaymentData, amount: 0 });
      return;
    }
    
    // Convert thành số và format lại
    const numericValue = parseFloat(numbersOnly);
    const formattedValue = numericValue.toLocaleString('vi-VN');
    
    setAddPaymentAmountDisplay(formattedValue);
    setAddPaymentData({ ...addPaymentData, amount: numericValue });
  };

  const [expenseFormData, setExpenseFormData] = useState<{ 
    title: string; 
    description: string; 
    amount: number; 
    category: Expense['category']; 
    branch: number; 
    expense_date: string; 
  }>({    
    title: '',
    description: '',
    amount: 0,
    category: 'supplies',
    branch: 0,
    expense_date: dayjs().format('YYYY-MM-DD'),
  });

  const [expenseAmountDisplay, setExpenseAmountDisplay] = useState<string>('');

  const [addPaymentData, setAddPaymentData] = useState({
    amount: 0,
    payment_method: 'cash' as const,
    notes: '',
  });

  const [addPaymentAmountDisplay, setAddPaymentAmountDisplay] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCustomerServices = async () => {
        if (showPaymentModal && !editingPayment && paymentFormData.customer > 0) {
            try {
                const cust = await api.getCustomer(paymentFormData.customer);
                const customerRegisteredServices = services.filter(s => 
                    cust.services_used && cust.services_used.some(service => service.id === s.id)
                );
                setCustomerServices(customerRegisteredServices);
            } catch (err) {
                console.error("Failed to fetch customer services", err);
                setCustomerServices([]);
            }
        }
    };
    fetchCustomerServices();
    if (!paymentFormData.customer) {
      setCustomerServices([]);
    }
  }, [paymentFormData.customer, showPaymentModal, editingPayment, services]);

  const fetchData = async () => {
    try {
      const [paymentsData, expensesData, customersData, servicesData, branchesData, summaryData] = await Promise.all([
        api.getPayments(),
        api.getExpenses(),
        api.getCustomers(),
        api.getServices(),
        api.getBranches(),
        api.getFinancialSummary(),
      ]);
      setPayments(paymentsData.results);
      setExpenses(expensesData.results);
      setCustomers(customersData.results);
      setServices(servicesData.results);
      setBranches(branchesData.results);
      setFinancialSummary(summaryData);
      
      // Debug financial data
      console.log('🔍 Payments data:', paymentsData.results);
      console.log('🔍 Expenses data:', expensesData.results);
      if (paymentsData.results && paymentsData.results.length > 0) {
        const firstPayment = paymentsData.results[0];
        console.log('💰 First payment:', firstPayment);
        console.log('💰 Payment amount:', firstPayment.amount, typeof firstPayment.amount);
        console.log('💰 Payment paid_amount:', firstPayment.paid_amount, typeof firstPayment.paid_amount);
        console.log('💰 Payment remaining_amount:', firstPayment.remaining_amount, typeof firstPayment.remaining_amount);
        console.log('💰 Calculated remaining:', Number(firstPayment.amount) - Number(firstPayment.paid_amount));
      }
      if (expensesData.results && expensesData.results.length > 0) {
        console.log('💰 First expense:', expensesData.results[0]);
        console.log('💰 Expense amount:', expensesData.results[0].amount);
      }
      
      // Debug services data
      console.log('🔍 Financials Services data:', servicesData.results);
      if (servicesData.results && servicesData.results.length > 0) {
        console.log('💰 Financials First service:', servicesData.results[0]);
        console.log('💰 Financials Price type:', typeof servicesData.results[0].price);
        console.log('💰 Financials Price value:', servicesData.results[0].price);
      }
    } catch (err: any) {
      setError('Không thể tải dữ liệu tài chính');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaymentModal = (payment?: PaymentType) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentFormData({
        customer: payment.customer,
        services: payment.services || [],
        branch: payment.branch,
        amount: payment.amount,
        payment_method: payment.payment_method,
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setPaymentFormData({
        customer: 0,
        services: [],
        branch: 0,
        amount: 0,
        payment_method: 'cash',
        notes: '',
      });
      setCustomerServices([]);
    }
    setShowPaymentModal(true);
  };

  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseFormData({
        title: expense.title,
        description: expense.description || '',
        amount: expense.amount,
        category: expense.category,
        branch: expense.branch,
        expense_date: dayjs(expense.expense_date).format('YYYY-MM-DD'),
      });
      setExpenseAmountDisplay(formatCurrencyInput(expense.amount));
    } else {
      setEditingExpense(null);
      setExpenseFormData({
        title: '',
        description: '',
        amount: 0,
        category: 'supplies',
        branch: 0,
        expense_date: dayjs().format('YYYY-MM-DD'),
      });
      setExpenseAmountDisplay('');
    }
    setShowExpenseModal(true);
  };

  const handleOpenAddPaymentModal = (payment: PaymentType) => {
    setSelectedPayment(payment);
    const remainingAmount = Number(payment.remaining_amount);
    setAddPaymentData({
      amount: remainingAmount,
      payment_method: 'cash',
      notes: '',
    });
    setAddPaymentAmountDisplay(formatCurrencyInput(remainingAmount));
    setShowAddPaymentModal(true);
  };

  const handleCloseModals = () => {
    setShowPaymentModal(false);
    setShowExpenseModal(false);
    setShowAddPaymentModal(false);
    setEditingPayment(null);
    setEditingExpense(null);
    setSelectedPayment(null);
  };

  const handleSubmitPayment = async () => {
    try {
      console.log('Submitting payment data:', paymentFormData);
      
      if (editingPayment) {
        await api.updatePayment(editingPayment.id, paymentFormData);
      } else {
        await api.createPayment(paymentFormData);
      }
      await fetchData();
      handleCloseModals();
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      setError('Không thể lưu thanh toán');
    }
  };

  const handleSubmitExpense = async () => {
    try {
      const submitData = {
        ...expenseFormData,
        expense_date: expenseFormData.expense_date // Giữ nguyên format YYYY-MM-DD
      };
      
      console.log('Submitting expense data:', submitData);
      console.log('Editing expense:', editingExpense);
      console.log('Expense form data:', expenseFormData);
      
      if (editingExpense) {
        console.log('Updating expense with ID:', editingExpense.id);
        await api.updateExpense(editingExpense.id, submitData);
      } else {
        console.log('Creating new expense');
        await api.createExpense(submitData);
      }
      await fetchData();
      handleCloseModals();
    } catch (err: any) {
      console.error('Error submitting expense:', err);
      console.error('Error details:', err.response?.data);
      setError('Không thể lưu chi phí: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      await api.addPayment(selectedPayment.id, addPaymentData.amount, addPaymentData.payment_method, addPaymentData.notes);
      await fetchData();
      handleCloseModals();
    } catch (err: any) {
      setError('Không thể thêm thanh toán');
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thanh toán này?')) {
      try {
        await api.deletePayment(id);
        await fetchData();
      } catch (err: any) {
        setError('Không thể xóa thanh toán');
      }
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      try {
        await api.deleteExpense(id);
        await fetchData();
      } catch (err: any) {
        setError('Không thể xóa chi phí');
      }
    }
  };

  const handleDebugCustomers = async () => {
    try {
      const response = await fetch('/api/customers/debug/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      console.log('Debug result:', result);
      alert(`Debug: ${result.customers_with_services} khách hàng có dịch vụ\nChi tiết xem trong Console (F12)`);
      
    } catch (err: any) {
      setError('Không thể debug dữ liệu');
    }
  };

  const handleFixPayments = async () => {
    if (window.confirm('Bạn có chắc chắn muốn sửa tất cả Payment records để cập nhật giá dịch vụ?')) {
      try {
        const result = await api.fixPayments();
        
        if (result.success) {
          alert(`Đã sửa ${result.customers_processed} Payment records thành công!`);
          await fetchData(); // Refresh data
        } else {
          setError('Không thể sửa Payment records');
        }
      } catch (err: any) {
        setError('Không thể sửa Payment records');
      }
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'success';
      case 'partial':
        return 'info';
      case 'refunded':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'partial':
        return 'Thanh toán một phần';
      case 'refunded':
        return 'Đã hoàn tiền';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'supplies':
        return 'Vật tư';
      case 'equipment':
        return 'Thiết bị';
      case 'rent':
        return 'Thuê mặt bằng';
      case 'utilities':
        return 'Tiện ích';
      case 'salary':
        return 'Lương';
      case 'marketing':
        return 'Marketing';
      case 'other':
        return 'Khác';
      default:
        return category;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (payment.services_names?.join(', ').toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || payment.status === selectedStatus;
    const matchesBranch = !selectedBranch || payment.branch === selectedBranch;
    
    // Filter by date range
    let matchesDateRange = true;
    if (selectedStartDate || selectedEndDate) {
      try {
        const paymentDate = new Date(payment.created_at);
        if (selectedStartDate) {
          const startDate = new Date(selectedStartDate);
          matchesDateRange = matchesDateRange && paymentDate >= startDate;
        }
        if (selectedEndDate) {
          const endDate = new Date(selectedEndDate);
          endDate.setHours(23, 59, 59, 999); // Include entire end date
          matchesDateRange = matchesDateRange && paymentDate <= endDate;
        }
      } catch (error) {
        console.error('Error filtering by date:', error);
        matchesDateRange = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesBranch && matchesDateRange;
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesBranch = !selectedBranch || expense.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

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
        <h2 className="text-primary fw-bold mb-0">Quản lý thu chi</h2>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            className="btn-success-enhanced"
            onClick={() => setShowAddPaymentModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Thêm thanh toán
          </Button>
          <Button
            variant="outline-primary"
            className="btn-outline-enhanced"
            onClick={() => setShowExpenseModal(true)}
          >
            <i className="bi bi-dash-circle me-2"></i>
            Thêm chi phí
          </Button>
          <Button
            variant="outline-secondary"
            className="btn-outline-enhanced"
            onClick={() => {
              const params: any = {};
              if (selectedStatus) params.status = selectedStatus;
              if (selectedBranch) params.branch = selectedBranch;
              if (selectedStartDate) params.start_date = selectedStartDate;
              if (selectedEndDate) params.end_date = selectedEndDate;
              api.exportPaymentsXlsx(params);
            }}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Xuất Excel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      {/* Financial Summary */}
      {financialSummary && (
        <Row className="mb-4">
          <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card className="card-enhanced h-100">
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
                <h4 className="mb-1">{financialSummary.total_customers ?? 0}</h4>
                <p className="text-muted mb-0">Tổng khách hàng</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card className="card-enhanced h-100">
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
                <h4 className="mb-1">{financialSummary.today_appointments ?? 0}</h4>
                <p className="text-muted mb-0">Lịch hẹn hôm nay</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card className="card-enhanced h-100">
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
                <h4 className="mb-1">{formatCurrency(financialSummary.total_revenue)}</h4>
                <p className="text-muted mb-0">Doanh thu tháng</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card className="card-enhanced h-100">
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
                <h4 className="mb-1">{formatCurrency(financialSummary.pending_payments)}</h4>
                <p className="text-muted mb-0">Doanh thu chờ</p>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={2} lg={2} xl={2} className="mb-3" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
            <Card className="card-enhanced h-100">
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
                <h4 className="mb-1">{formatCurrency(financialSummary.total_expenses)}</h4>
                <p className="text-muted mb-0">Chi phí</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs */}
      <Card>
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'payments')}>
              <Nav.Item>
                <Nav.Link eventKey="payments" className="px-3 py-2">
                  <i className="bi bi-cash-stack me-2"></i>Thanh toán
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="expenses" className="px-3 py-2">
                  <i className="bi bi-graph-down me-2"></i>Chi phí
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <div>
              {activeTab === 'payments' && (
                <Button variant="primary" size="sm" onClick={() => handleOpenPaymentModal()}>
                  <i className="bi bi-plus me-1"></i>Thêm thanh toán
                </Button>
              )}
              {activeTab === 'expenses' && (
                <Button variant="primary" size="sm" onClick={() => handleOpenExpenseModal()}>
                  <i className="bi bi-plus me-1"></i>Thêm chi phí
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Tab.Container activeKey={activeTab}>
            <Tab.Content>
              {/* Payments Tab */}
              <Tab.Pane eventKey="payments">

          {/* Filters */}
                <Card className="mb-3">
                  <Card.Body>
                    <Row className="g-3">
                      <Col xs={12} sm={4}>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                          <FormControl
                            placeholder="Tìm kiếm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col xs={12} sm={3}>
                        <FormSelect
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                          <option value="">Tất cả trạng thái</option>
                          <option value="pending">Chờ thanh toán</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="partial">Thanh toán một phần</option>
                          <option value="refunded">Đã hoàn tiền</option>
                          <option value="cancelled">Đã hủy</option>
                        </FormSelect>
                      </Col>
                      <Col xs={12} sm={3}>
                        <FormSelect
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as number | '')}
                  >
                          <option value="">Tất cả chi nhánh</option>
                    {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                        {branch.name}
                            </option>
                          ))}
                        </FormSelect>
                      </Col>
                      <Col xs={12} sm={3}>
                        <Form.Control
                          type="date"
                          placeholder="Từ ngày"
                          value={selectedStartDate}
                          onChange={(e) => setSelectedStartDate(e.target.value)}
                        />
                      </Col>
                      <Col xs={12} sm={3}>
                        <Form.Control
                          type="date"
                          placeholder="Đến ngày"
                          value={selectedEndDate}
                          onChange={(e) => setSelectedEndDate(e.target.value)}
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

          {/* Payments Table */}
                <Table responsive striped hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>ID Khách hàng</th>
                      <th>Khách hàng</th>
                      <th>Dịch vụ</th>
                      <th>Số tiền</th>
                      <th>Đã trả</th>
                      <th>Còn lại</th>
                      <th>Trạng thái</th>
                      <th>Phương thức</th>
                      <th>Ngày tạo</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.customer_id}</td>
                        <td>{payment.customer_name}</td>
                        <td>{payment.services_names?.join(', ') || 'Không có dịch vụ'}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{formatCurrency(payment.paid_amount)}</td>
                        <td>{formatCurrency(payment.remaining_amount)}</td>
                        <td>
                          <Badge bg={getStatusVariant(payment.status)}>
                            {getStatusText(payment.status)}
                          </Badge>
                        </td>
                        <td>{payment.payment_method}</td>
                        <td>{(() => {
                          try {
                            // Parse DD/MM/YYYY format
                            if (payment.created_at && payment.created_at.includes('/')) {
                              const [day, month, year] = payment.created_at.split('/');
                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              return date.toLocaleDateString('vi-VN');
                            }
                            // Fallback to direct parsing
                            return dayjs(payment.created_at).isValid() ? dayjs(payment.created_at).format('DD/MM/YYYY') : payment.created_at;
                          } catch (error) {
                            return payment.created_at;
                          }
                        })()}</td>
                        <td className="text-end">
                          <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleOpenPaymentModal(payment)}>
                            <i className="bi bi-pencil"></i>
                          </Button>
                      {Number(payment.remaining_amount) > 0 && (
                            <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleOpenAddPaymentModal(payment)}>
                              <i className="bi bi-plus-circle"></i>
                            </Button>
                          )}
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </Table>
              </Tab.Pane>

              {/* Expenses Tab */}
              <Tab.Pane eventKey="expenses">

          {/* Expenses Table */}
                <Table responsive striped hover className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Mô tả</th>
                      <th>Danh mục</th>
                      <th>Số tiền</th>
                      <th>Chi nhánh</th>
                      <th>Ngày chi</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.title}</td>
                        <td>{expense.description || '-'}</td>
                        <td>{getCategoryText(expense.category)}</td>
                        <td>{formatCurrency(expense.amount)}</td>
                        <td>{expense.branch_name}</td>
                        <td>{(() => {
                          try {
                            // Parse DD/MM/YYYY format
                            if (expense.expense_date && expense.expense_date.includes('/')) {
                              const [day, month, year] = expense.expense_date.split('/');
                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              return date.toLocaleDateString('vi-VN');
                            }
                            // Fallback to direct parsing
                            return dayjs(expense.expense_date).isValid() ? dayjs(expense.expense_date).format('DD/MM/YYYY') : expense.expense_date;
                          } catch (error) {
                            return expense.expense_date;
                          }
                        })()}</td>
                        <td className="text-end">
                          <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleOpenExpenseModal(expense)}>
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </Table>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={handleCloseModals} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>{editingPayment ? 'Chỉnh sửa thanh toán' : 'Thêm thanh toán mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Khách hàng *</Form.Label>
                <FormSelect
                    value={paymentFormData.customer}
                    onChange={async (e) => {
                    const customerId = parseInt(e.target.value) || 0;
                      let updates: any = { customer: customerId, services: [], amount: 0 };
                      try {
                        const detail = await api.getCustomer(customerId);
                        updates.branch = detail.branch;
                      } catch (_) {}
                      setPaymentFormData({ ...paymentFormData, ...updates });
                    }}
                  >
                  <option value={0}>Chọn khách hàng</option>
                    {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.phone}
                    </option>
                  ))}
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
                {editingPayment ? (
                <Form.Group>
                  <Form.Label>Dịch vụ</Form.Label>
                  <Form.Control
                        value={editingPayment.services_names?.join(', ') || 'Không có dịch vụ'}
                    readOnly
                    plaintext
                  />
                </Form.Group>
              ) : (
                <Form.Group>
                  <Form.Label>Dịch vụ *</Form.Label>
                  <FormSelect
                            multiple
                            value={paymentFormData.services?.map(String) || []}
                            onChange={(e) => {
                      const selectedServices = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                setPaymentFormData({
                                    ...paymentFormData,
                                    services: selectedServices,
                                    amount: getTotalServicePrice(selectedServices),
                                });
                            }}
                            disabled={!paymentFormData.customer || customerServices.length === 0}
                        >
                            {customerServices.map((service) => (
                      <option key={service.id} value={service.id}>
    {service.name} 
    {service.level_number && ` - Cấp ${service.level_number}`} 
    - {formatCurrency(service.price || 0)}
                      </option>
                    ))}
                  </FormSelect>
                  <Form.Text className="text-muted">
                    Giữ Ctrl để chọn nhiều dịch vụ
                  </Form.Text>
                </Form.Group>
              )}
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Chi nhánh *</Form.Label>
                <FormSelect
                    value={paymentFormData.branch}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, branch: Number(e.target.value) || 0 })}
                  >
                  <option value={0}>Chọn chi nhánh</option>
                    {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                  ))}
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Số tiền *</Form.Label>
                <Form.Control
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) })}
                  readOnly={!editingPayment}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Phương thức thanh toán *</Form.Label>
                <FormSelect
                    value={paymentFormData.payment_method}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value as any })}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="insurance">Bảo hiểm</option>
                  <option value="other">Khác</option>
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmitPayment}>
            {editingPayment ? 'Cập nhật' : 'Thêm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Expense Modal */}
      <Modal show={showExpenseModal} onHide={handleCloseModals} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>{editingExpense ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Tiêu đề *</Form.Label>
                <Form.Control
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Danh mục *</Form.Label>
                <FormSelect
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
                >
                  <option value="supplies">Vật tư</option>
                  <option value="equipment">Thiết bị</option>
                  <option value="rent">Thuê mặt bằng</option>
                  <option value="utilities">Tiện ích</option>
                  <option value="salary">Lương</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Khác</option>
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Số tiền *</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={expenseAmountDisplay}
                    onChange={(e) => handleAmountInputChange(e.target.value)}
                    placeholder="Nhập số tiền"
                  />
                  <InputGroup.Text>đ</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Ví dụ: 1,000,000đ
                </Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Chi nhánh *</Form.Label>
                <FormSelect
                    value={expenseFormData.branch}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, branch: Number(e.target.value) || 0 })}
                  >
                  <option value={0}>Chọn chi nhánh</option>
                    {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                  ))}
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Ngày chi *</Form.Label>
                <DatePicker
                  value={expenseFormData.expense_date}
                  onChange={(value) => setExpenseFormData({ ...expenseFormData, expense_date: value })}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmitExpense}>
            {editingExpense ? 'Cập nhật' : 'Thêm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Payment Modal */}
      <Modal show={showAddPaymentModal} onHide={handleCloseModals} className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>Thêm thanh toán cho {selectedPayment?.customer_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <p className="text-muted">
                  Số tiền còn lại: {selectedPayment ? formatCurrency(selectedPayment.remaining_amount) : ''}
              </p>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Số tiền *</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={addPaymentAmountDisplay}
                    onChange={(e) => handleAddPaymentAmountChange(e.target.value)}
                    placeholder="Nhập số tiền"
                  />
                  <InputGroup.Text>đ</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Ví dụ: 1,000,000đ
                </Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Phương thức thanh toán *</Form.Label>
                <FormSelect
                    value={addPaymentData.payment_method}
                    onChange={(e) => setAddPaymentData({ ...addPaymentData, payment_method: e.target.value as any })}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="insurance">Bảo hiểm</option>
                  <option value="other">Khác</option>
                </FormSelect>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={addPaymentData.notes}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, notes: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>Hủy</Button>
          <Button variant="primary" onClick={handleAddPayment}>Thêm thanh toán</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Financials;
