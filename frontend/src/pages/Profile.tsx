import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Alert, Spinner, Image } from 'react-bootstrap';
import api from '../services/api';
import { User, ProfileFormData, ChangePasswordFormData } from '../types';
import DatePicker from '../components/DatePicker';
import { formatDate } from '../utils/time';

// Import SweetAlert2
const Swal = require('sweetalert2');

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    gender: 'male',
    date_of_birth: '',
    bio: '',
    avatar: null,
  });
  
  const [passwordFormData, setPasswordFormData] = useState<ChangePasswordFormData>({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await api.getProfile();
      setUser(profileData);
      setProfileFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        specialization: profileData.specialization || '',
        gender: profileData.gender || 'male',
        date_of_birth: profileData.date_of_birth || '',
        bio: profileData.bio || '',
        avatar: null,
      });
      setAvatarPreview(profileData.avatar_url || '');
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // Update form data
      setProfileFormData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleProfileSubmit = async () => {
    setProfileError('');
    setIsSubmitting(true);
    
    try {
      const updatedUser = await api.updateProfile(profileFormData);
      setUser(updatedUser);
      setShowProfileModal(false);
      
      await Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Thông tin hồ sơ đã được cập nhật',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd'
      });
      
      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      console.error('Profile update error:', err);
      
      let errorMessage = 'Không thể cập nhật thông tin hồ sơ';
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else {
          const fieldErrors: string[] = [];
          Object.entries(err.response.data).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        }
      }
      
      setProfileError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    setIsSubmitting(true);
    
    try {
      await api.changePassword(passwordFormData);
      setShowPasswordModal(false);
      
      // Reset form
      setPasswordFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      
      await Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Mật khẩu đã được thay đổi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d6efd'
      });
    } catch (err: any) {
      console.error('Password change error:', err);
      
      let errorMessage = 'Không thể thay đổi mật khẩu';
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else {
          const fieldErrors: string[] = [];
          Object.entries(err.response.data).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        }
      }
      
      setPasswordError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvatar = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa ảnh đại diện?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await api.deleteAvatar();
        setAvatarPreview('');
        setSelectedFile(null);
        
        await Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: 'Ảnh đại diện đã được xóa thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
        
        // Refresh profile data
        await fetchProfile();
      } catch (err: any) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xóa ảnh đại diện',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setProfileError('');
    // Reset form to original data
    if (user) {
      setProfileFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        specialization: user.specialization || '',
        gender: user.gender || 'male',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || '',
        avatar: null,
      });
      setAvatarPreview(user.avatar_url || '');
      setSelectedFile(null);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordFormData({
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    });
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-fluid p-4">
        <Alert variant="danger">
          Không thể tải thông tin hồ sơ
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold mb-0">Hồ sơ cá nhân</h2>
        <div className="d-flex gap-2">
          <Button
            variant="outline-warning"
            className="btn-outline-enhanced"
            onClick={() => setShowPasswordModal(true)}
          >
            <i className="bi bi-key me-2"></i>
            Đổi mật khẩu
          </Button>
          <Button
            variant="primary"
            className="btn-primary-enhanced"
            onClick={() => setShowProfileModal(true)}
          >
            <i className="bi bi-pencil me-2"></i>
            Chỉnh sửa
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      {/* Profile Information */}
      <Row className="g-4">
        {/* Avatar and Basic Info */}
        <Col lg={4}>
          <Card className="card-enhanced">
            <Card.Body className="text-center p-4">
              <div className="position-relative d-inline-block mb-3">
                  <Image
                    src={avatarPreview || '/images/default-avatar.svg'}
                    roundedCircle
                    width={150}
                    height={150}
                    className="border border-3 border-primary"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                    }}
                  />
                {avatarPreview && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 rounded-circle"
                    style={{ width: '30px', height: '30px', padding: 0 }}
                    onClick={handleDeleteAvatar}
                    title="Xóa ảnh đại diện"
                  >
                    <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                  </Button>
                )}
              </div>
              
              <h4 className="text-primary fw-bold mb-1">
                {user.full_name || `${user.last_name} ${user.first_name}`}
              </h4>
              <p className="text-muted mb-2">
                <i className="bi bi-person-badge me-1"></i>
                {user.role_display || user.role}
              </p>
              {user.specialization && (
                <p className="text-info mb-2">
                  <i className="bi bi-stethoscope me-1"></i>
                  {user.specialization}
                </p>
              )}
              <p className="text-muted small">
                <i className="bi bi-calendar me-1"></i>
                Tham gia: {formatDate(user.created_at)}
              </p>
            </Card.Body>
          </Card>
        </Col>

        {/* Detailed Information */}
        <Col lg={8}>
          <Row className="g-4">
            {/* Personal Information */}
            <Col md={6}>
              <Card className="card-enhanced h-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-person me-2"></i>
                    Thông tin cá nhân
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Họ và tên:</label>
                    <p className="mb-0">{user.full_name || `${user.last_name} ${user.first_name}`}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Email:</label>
                    <p className="mb-0">{user.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Số điện thoại:</label>
                    <p className="mb-0">{user.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Giới tính:</label>
                    <p className="mb-0">
                      {user.gender === 'male' ? 'Nam' : 
                       user.gender === 'female' ? 'Nữ' : 
                       user.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="mb-0">
                    <label className="fw-semibold text-primary">Ngày sinh:</label>
                    <p className="mb-0">{user.date_of_birth ? formatDate(user.date_of_birth) : 'Chưa cập nhật'}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Professional Information */}
            <Col md={6}>
              <Card className="card-enhanced h-100">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-briefcase me-2"></i>
                    Thông tin nghề nghiệp
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Vai trò:</label>
                    <p className="mb-0">{user.role_display || user.role}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Chuyên môn:</label>
                    <p className="mb-0">{user.specialization || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Địa chỉ:</label>
                    <p className="mb-0">{user.address || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-semibold text-primary">Trạng thái:</label>
                    <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <div className="mb-0">
                    <label className="fw-semibold text-primary">Cập nhật lần cuối:</label>
                    <p className="mb-0">{user.updated_at ? formatDate(user.updated_at) : 'Chưa có'}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Bio */}
            {user.bio && (
              <Col md={12}>
                <Card className="card-enhanced">
                  <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-lines-fill me-2"></i>
                      Giới thiệu
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{user.bio}</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      {/* Profile Edit Modal */}
      <Modal show={showProfileModal} onHide={handleCloseProfileModal} size="lg" className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa hồ sơ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="enhanced-form">
          {profileError && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div>
                  <strong>Lỗi:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-line' }}>{profileError}</div>
                </div>
              </div>
            </Alert>
          )}
          
          <Form>
            {/* Avatar Upload */}
            <div className="mb-4">
              <h5 className="text-primary fw-bold mb-3">
                <i className="bi bi-image me-2"></i>Ảnh đại diện
              </h5>
              <div className="text-center">
                <div className="position-relative d-inline-block mb-3">
                  <Image
                    src={avatarPreview || '/images/default-avatar.svg'}
                    roundedCircle
                    width={100}
                    height={100}
                    className="border border-2 border-primary"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                    }}
                  />
                </div>
                <div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="enhanced-form"
                  />
                  <Form.Text className="text-muted">
                    Chọn ảnh đại diện (JPG, PNG, GIF - tối đa 5MB)
                  </Form.Text>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <h5 className="text-primary fw-bold mb-3">
              <i className="bi bi-person me-2"></i>Thông tin cá nhân
            </h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Họ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.last_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                    required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.first_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                    required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    required
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Giới tính</Form.Label>
                  <Form.Select
                    value={profileFormData.gender}
                    onChange={(e) => setProfileFormData({ ...profileFormData, gender: e.target.value as any })}
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
                  <Form.Label className="fw-semibold">Ngày sinh</Form.Label>
                  <DatePicker
                    value={profileFormData.date_of_birth}
                    onChange={(value) => setProfileFormData({ ...profileFormData, date_of_birth: value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Professional Information */}
            <h5 className="text-primary fw-bold mb-3 mt-4">
              <i className="bi bi-briefcase me-2"></i>Thông tin nghề nghiệp
            </h5>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Chuyên môn</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileFormData.specialization}
                    onChange={(e) => setProfileFormData({ ...profileFormData, specialization: e.target.value })}
                    placeholder="Ví dụ: Nha khoa tổng quát, Chỉnh nha..."
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={profileFormData.address}
                    onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Giới thiệu bản thân</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={profileFormData.bio}
                    onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                    placeholder="Viết một vài dòng giới thiệu về bản thân..."
                    className="enhanced-form"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseProfileModal} className="btn-outline-enhanced me-2">
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleProfileSubmit} 
            className="btn-primary-enhanced"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Cập nhật
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={handleClosePasswordModal} className="modal-enhanced">
        <Modal.Header closeButton>
          <Modal.Title>Đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="enhanced-form">
          {passwordError && (
            <Alert variant="danger" className="alert-enhanced mb-3">
              <div className="d-flex align-items-start">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div>
                  <strong>Lỗi:</strong>
                  <div className="mt-1" style={{ whiteSpace: 'pre-line' }}>{passwordError}</div>
                </div>
              </div>
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mật khẩu hiện tại *</Form.Label>
              <Form.Control
                type="password"
                value={passwordFormData.old_password}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, old_password: e.target.value })}
                required
                className="enhanced-form"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mật khẩu mới *</Form.Label>
              <Form.Control
                type="password"
                value={passwordFormData.new_password}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password: e.target.value })}
                required
                className="enhanced-form"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Xác nhận mật khẩu mới *</Form.Label>
              <Form.Control
                type="password"
                value={passwordFormData.new_password_confirm}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password_confirm: e.target.value })}
                required
                className="enhanced-form"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClosePasswordModal} className="btn-outline-enhanced me-2">
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePasswordSubmit} 
            className="btn-primary-enhanced"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang đổi...
              </>
            ) : (
              <>
                <i className="bi bi-key me-2"></i>
                Đổi mật khẩu
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;
