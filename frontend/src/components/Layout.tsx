import React, { useState } from 'react';
import { Navbar, Nav, Container, Offcanvas, Button, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Trang chủ', icon: 'bi-house', path: '/', roles: ['admin', 'manager', 'doctor', 'creceptionist'] },
  { text: 'Khách hàng', icon: 'bi-people', path: '/customers', roles: ['admin', 'manager', 'creceptionist'] },
  { text: 'Lịch hẹn', icon: 'bi-calendar3', path: '/appointments', roles: ['admin', 'manager', 'doctor', 'creceptionist'] },
  { text: 'Thu chi', icon: 'bi-cash-stack', path: '/financials', roles: ['admin', 'manager', 'creceptionist'] },
  { text: 'Báo cáo', icon: 'bi-graph-up', path: '/reports', roles: ['admin', 'manager'] },
  { text: 'Quản lý nhân viên', icon: 'bi-person-gear', path: '/staff', roles: ['admin', 'manager'] },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show all menu items if user is not loaded yet, or filter by role if user is loaded
  const filteredMenuItems = user 
    ? menuItems.filter(item => item.roles.includes(user.role))
    : menuItems; // Show all items while loading

  // Don't show loading state - let sidebar render immediately

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar d-none d-lg-block" style={{ width: '240px', minHeight: '100vh' }}>
        <div className="p-3 border-bottom">
          <h5 className="text-primary fw-semibold mb-0">
            <i className="bi bi-tooth me-2"></i>
            I-DENT CLINIC
          </h5>
        </div>
        <nav className="p-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.path}
              className={`btn w-100 text-start mb-1 nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
              onClick={() => navigate(item.path)}
              style={{ border: 'none', background: 'none' }}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.text}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Navigation */}
        <Navbar bg="white" expand="lg" className="border-bottom">
          <Container fluid>
            <Button
              variant="outline-primary"
              onClick={handleShow}
              className="d-lg-none me-3"
              size="sm"
            >
              <i className="bi bi-list"></i>
            </Button>
            
            <Navbar.Brand className="d-none d-lg-block">
              <h6 className="text-muted mb-0">
                {filteredMenuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
              </h6>
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center" size="sm">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px', overflow: 'hidden' }}>
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt="Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                          }}
                        />
                      ) : (
                        <img 
                          src="/images/default-avatar.svg" 
                          alt="Default Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <span className="d-none d-md-inline">
                      {user ? `${user.last_name} ${user.first_name}` : 'Đang tải...'}
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <div className="text-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                          {user?.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="Avatar" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                              }}
                            />
                          ) : (
                            <img 
                              src="/images/default-avatar.svg" 
                              alt="Default Avatar" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                        <div className="fw-semibold">
                          {user ? `${user.last_name} ${user.first_name}` : 'Đang tải...'}
                        </div>
                        <small className="text-muted">{user?.email || 'Đang tải...'}</small>
                        <div className="mt-1">
                          <span className="badge bg-primary">{user?.role || 'Đang tải...'}</span>
                        </div>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Item onClick={() => navigate('/profile')}>
                      <i className="bi bi-person-circle me-2"></i>
                      Hồ sơ cá nhân
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Page Content */}
        <main className="flex-grow-1">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <h6 className="text-primary fw-semibold mb-0">
              <i className="bi bi-tooth me-2"></i>
              Dental Clinic
            </h6>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <nav className="p-2">
            {filteredMenuItems.map((item) => (
              <button
                key={item.path}
                className={`btn w-100 text-start mb-1 nav-link ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                onClick={() => {
                  navigate(item.path);
                  handleClose();
                }}
                style={{ border: 'none', background: 'none' }}
              >
                <i className={`${item.icon} me-2`}></i>
                {item.text}
              </button>
            ))}
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Layout;
