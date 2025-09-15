import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  ButtonGroup,
  Dropdown,
  InputGroup,
} from 'react-bootstrap';
import { User, CreateUserRequest } from '../types';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import DatePicker from '../components/DatePicker';
import { formatDateForInput, formatDateForAPI } from '../utils/date';

// Import SweetAlert2
const Swal = require('sweetalert2');

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'creceptionist' as 'admin' | 'manager' | 'doctor' | 'creceptionist',
    phone: '',
    specialization: '',
    gender: 'male' as 'male' | 'female' | 'other',
    date_of_birth: '',
    bio: '',
    is_active: true,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers();
      // Filter out current user and only show staff (not admin)
      const staffData = response.results.filter(
        (user: User) => user.id !== currentUser?.id && user.role !== 'admin'
      );
      setStaff(staffData);
    } catch (err: any) {
      setError('Không thể tải danh sách nhân viên');
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingStaff) {
        const updateData = {
          ...formData,
          date_of_birth: formatDateForAPI(formData.date_of_birth)
        };
        await api.updateUser(editingStaff.id, updateData);
        
        // Success - close modal and refresh data
        setShowModal(false);
        setEditingStaff(null);
        resetForm();
        fetchStaff();
        
        // Show success message with SweetAlert
        await Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công!',
          text: `Đã cập nhật thông tin nhân viên ${formData.first_name} ${formData.last_name} thành công!`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
        
      } else {
        const createData: CreateUserRequest = {
          ...formData,
          password: '123456',
          date_of_birth: formatDateForAPI(formData.date_of_birth)
        };
        await api.createUser(createData);
        
        // Success - close modal and refresh data
        setShowModal(false);
        setEditingStaff(null);
        resetForm();
        fetchStaff();
        
        // Show success message with SweetAlert
        await Swal.fire({
          icon: 'success',
          title: 'Thêm thành công!',
          text: `Đã thêm nhân viên ${formData.first_name} ${formData.last_name} thành công!`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
      }
      
    } catch (err: any) {
      console.error('Error saving staff:', err);
      
      // Parse error message for better display
      let errorMessage = 'Không thể lưu thông tin nhân viên';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat();
          errorMessage = errorMessages.join(', ');
        } else {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show error message with SweetAlert
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      
      // Don't close modal on error - let user fix the issues
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (staffMember: User) => {
    setEditingStaff(staffMember);
    setFormData({
      username: staffMember.username,
      email: staffMember.email,
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      role: staffMember.role,
      phone: staffMember.phone || '',
      specialization: staffMember.specialization || '',
      gender: staffMember.gender || 'male',
      date_of_birth: formatDateForInput(staffMember.date_of_birth),
      bio: staffMember.bio || '',
      is_active: staffMember.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (staffId: number) => {
    const staffMember = staff.find(s => s.id === staffId);
    const staffName = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'nhân viên này';
    
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa nhân viên ${staffName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }) as { isConfirmed: boolean };

    if (result.isConfirmed) {
      try {
        await api.deleteUser(staffId);
        fetchStaff();
        
        await Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: `Nhân viên ${staffName} đã được xóa thành công.`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
      } catch (err: any) {
        console.error('Error deleting staff:', err);
        
        let errorMessage = 'Không thể xóa nhân viên';
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.non_field_errors) {
            errorMessage = err.response.data.non_field_errors.join(', ');
          }
        }
        
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: errorMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'creceptionist',
      phone: '',
      specialization: '',
      gender: 'male',
      date_of_birth: '',
      bio: '',
      is_active: true,
    });
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    resetForm();
    setShowModal(true);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      manager: 'Quản lý',
      doctor: 'Bác sĩ',
      creceptionist: 'Nhân viên tư vấn & Lễ tân',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, string> = {
      admin: 'danger',
      manager: 'warning',
      doctor: 'primary',
      creceptionist: 'success',
    };
    return variantMap[role] || 'secondary';
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
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
        <h2 className="text-primary fw-bold mb-0">Quản lý nhân viên</h2>
        <Button 
          variant="primary" 
          className="btn-primary-enhanced"
          onClick={handleAddNew}
        >
          <i className="bi bi-person-plus me-2"></i>
          Thêm nhân viên
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="card-enhanced mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Tìm kiếm</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tìm theo tên, email, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="enhanced-form"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="enhanced-form"
                >
                  <option value="all">Tất cả</option>
                  <option value="manager">Quản lý</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="creceptionist">Nhân viên tư vấn & Lễ tân</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Reset
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Staff Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Danh sách nhân viên ({filteredStaff.length})</h5>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive striped hover className="table-enhanced">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Username</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Số điện thoại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-2" 
                           style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef' }}>
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt="Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                            }}
                          />
                        ) : (
                          <i className="bi bi-person text-muted"></i>
                        )}
                      </div>
                      <div>
                        <div className="fw-semibold">{member.first_name} {member.last_name}</div>
                        {member.specialization && (
                          <small className="text-muted">{member.specialization}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{member.username}</td>
                  <td>{member.email}</td>
                  <td>
                    <Badge bg={getRoleBadgeVariant(member.role)}>
                      {getRoleDisplay(member.role)}
                    </Badge>
                  </td>
                  <td>{member.phone || '-'}</td>
                  <td>
                    <Badge bg={member.is_active ? 'success' : 'secondary'}>
                      {member.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button variant="outline-primary" onClick={() => handleEdit(member)}>
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" onClick={() => handleDelete(member.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {filteredStaff.length === 0 && (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-person-x fs-1"></i>
              <p className="mt-2">Không tìm thấy nhân viên nào</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Họ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Vai trò *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    required
                    className="enhanced-form"
                  >
                    <option value="manager">Quản lý</option>
                    <option value="doctor">Bác sĩ</option>
                    <option value="creceptionist">Nhân viên tư vấn & Lễ tân</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              {formData.role === 'doctor' && (
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Chuyên khoa</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Ví dụ: Nha khoa tổng quát, Chỉnh nha..."
                    />
                  </Form.Group>
                </Col>
              )}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Giới tính</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Ngày sinh</Form.Label>
                  <DatePicker
                    value={formData.date_of_birth}
                    onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Giới thiệu</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Giới thiệu về nhân viên..."
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  label="Tài khoản hoạt động"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingStaff ? 'Đang cập nhật...' : 'Đang thêm...'}
                </>
              ) : (
                editingStaff ? 'Cập nhật' : 'Thêm mới'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
