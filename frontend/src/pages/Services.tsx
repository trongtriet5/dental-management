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
  Badge,
  InputGroup,
  Dropdown,
  ButtonGroup,
  Spinner
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Swal from 'sweetalert2';
import apiService from '../services/api';
import { Service } from '../types';

const serviceSchema = yup.object({
  name: yup.string().required('Tên dịch vụ là bắt buộc').min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự'),
  category: yup.string().required('Danh mục là bắt buộc'),
  description: yup.string().optional(),
  level: yup.string().required('Cấp độ là bắt buộc'),
  level_number: yup.number().required('Cấp độ số là bắt buộc').min(1, 'Cấp độ số phải lớn hơn 0'),
  price: yup.number().required('Giá là bắt buộc').min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  is_active: yup.boolean().required('Trạng thái là bắt buộc')
});

type ServiceFormData = {
  name: string;
  category: 'implant' | 'crown' | 'orthodontic' | 'other';
  description?: string;
  level: string;
  level_number: number;
  price: number;
  is_active: boolean;
};

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Service>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<ServiceFormData>({
    resolver: yupResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: 'other',
      description: '',
      level: 'Standard',
      level_number: 1,
      price: 0,
      is_active: true
    }
  });

  const isActive = watch('is_active');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getServices();
      setServices(response.results || response);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    reset({
      name: '',
      category: 'other',
      description: '',
      level: 'Standard',
      level_number: 1,
      price: 0,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setValue('name', service.name);
    setValue('category', service.category);
    setValue('description', service.description || '');
    setValue('level', service.level);
    setValue('level_number', service.level_number);
    setValue('price', service.price);
    setValue('is_active', service.is_active);
    setShowModal(true);
  };

  const handleDeleteService = async (service: Service) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await apiService.deleteService(service.id);
        await loadServices();
        Swal.fire('Đã xóa!', 'Dịch vụ đã được xóa thành công.', 'success');
      } catch (err: any) {
        console.error('Error deleting service:', err);
        Swal.fire('Lỗi!', 'Không thể xóa dịch vụ.', 'error');
      }
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await apiService.updateService(editingService.id, data);
        Swal.fire('Thành công!', 'Dịch vụ đã được cập nhật.', 'success');
      } else {
        await apiService.createService(data);
        Swal.fire('Thành công!', 'Dịch vụ đã được tạo.', 'success');
      }
      setShowModal(false);
      await loadServices();
    } catch (err: any) {
      console.error('Error saving service:', err);
      Swal.fire('Lỗi!', 'Không thể lưu dịch vụ.', 'error');
    }
  };

  const filteredServices = services
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterActive === null || service.is_active === filterActive;
      const matchesCategory = filterCategory === null || service.category === filterCategory;
      return matchesSearch && matchesFilter && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const handleSort = (field: keyof Service) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-0">
            <i className="bi bi-gear me-2"></i>
            Quản lý dịch vụ
          </h2>
          <p className="text-muted mb-0">Quản lý các dịch vụ nha khoa</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            className="btn-primary-enhanced"
            onClick={handleCreateService}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Thêm dịch vụ
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="alert-enhanced mb-3">
          {error}
        </Alert>
      )}

      <Card className="card-enhanced">
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-end gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm" className="btn-outline-enhanced">
                    <i className="bi bi-tags me-2"></i>
                    Danh mục: {filterCategory === null ? 'Tất cả' : 
                      filterCategory === 'implant' ? 'Trồng răng implant' :
                      filterCategory === 'crown' ? 'Bọc răng sứ' :
                      filterCategory === 'orthodontic' ? 'Niềng răng' :
                      'Dịch vụ khác'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterCategory(null)}>
                      Tất cả
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterCategory('implant')}>
                      Trồng răng implant
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterCategory('crown')}>
                      Bọc răng sứ
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterCategory('orthodontic')}>
                      Niềng răng
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterCategory('other')}>
                      Dịch vụ khác
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm" className="btn-outline-enhanced">
                    <i className="bi bi-funnel me-2"></i>
                    Trạng thái: {filterActive === null ? 'Tất cả' : filterActive ? 'Hoạt động' : 'Không hoạt động'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setFilterActive(null)}>
                      Tất cả
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterActive(true)}>
                      Hoạt động
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setFilterActive(false)}>
                      Không hoạt động
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-enhanced mb-0">
              <thead>
                <tr>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('name')}
                  >
                    Tên dịch vụ
                    {sortField === 'name' && (
                      <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                    )}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('category')}
                  >
                    Danh mục
                    {sortField === 'category' && (
                      <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                    )}
                  </th>
                  <th>Cấp độ</th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('price')}
                  >
                    Giá
                    {sortField === 'price' && (
                      <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                    )}
                  </th>
                  <th>Trạng thái</th>
                  <th style={{ width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      <i className="bi bi-inbox me-2"></i>
                      Không có dịch vụ nào
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{service.name}</div>
                          {service.description && (
                            <small className="text-muted">{service.description}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg={
                          service.category === 'implant' ? 'primary' :
                          service.category === 'crown' ? 'info' :
                          service.category === 'orthodontic' ? 'warning' :
                          'secondary'
                        }>
                          {service.category_display || 
                            (service.category === 'implant' ? 'Trồng răng implant' :
                             service.category === 'crown' ? 'Bọc răng sứ' :
                             service.category === 'orthodontic' ? 'Niềng răng' :
                             'Dịch vụ khác')
                          }
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {service.level} - Cấp {service.level_number}
                        </Badge>
                      </td>
                      <td className="fw-semibold text-success">
                        {formatPrice(service.price)}
                      </td>
                      <td>
                        <Badge bg={service.is_active ? 'success' : 'secondary'}>
                          {service.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-primary"
                            onClick={() => handleEditService(service)}
                            title="Chỉnh sửa"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleDeleteService(service)}
                            title="Xóa"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>
            Hiển thị {filteredServices.length} / {services.length} dịch vụ
          </small>
        </Card.Footer>
      </Card>

      {/* Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Tên dịch vụ *</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('name')}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Danh mục *</Form.Label>
                  <Form.Select {...register('category')} isInvalid={!!errors.category}>
                    <option value="implant">Trồng răng implant</option>
                    <option value="crown">Bọc răng sứ</option>
                    <option value="orthodontic">Niềng răng</option>
                    <option value="other">Dịch vụ khác</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.category?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Cấp độ *</Form.Label>
                  <Form.Select {...register('level')} isInvalid={!!errors.level}>
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.level?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Cấp độ số *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    {...register('level_number')}
                    isInvalid={!!errors.level_number}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.level_number?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Giá (VNĐ) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    {...register('price')}
                    isInvalid={!!errors.price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.price?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái *</Form.Label>
                  <Form.Select {...register('is_active')} isInvalid={!!errors.is_active}>
                    <option value="true">Hoạt động</option>
                    <option value="false">Không hoạt động</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.is_active?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-primary">Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                {...register('description')}
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="btn-outline-enhanced" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" className="btn-primary-enhanced" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Đang lưu...
                </>
              ) : (
                editingService ? 'Cập nhật' : 'Tạo mới'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Services;
