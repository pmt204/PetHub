import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'; 
import { FaInstagram, FaTiktok, FaFacebook, FaYoutube } from 'react-icons/fa';
import FloatingContact from '../components/FloatingContact/FloatingContact';

const Layout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); 

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login'); 
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="navbar navbar-expand-lg navbar-light fixed-top" style={{ backgroundColor: '#FAF7F1', height: '80px' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center fw-bold" to="/home" style={{ color: '#8B0000' }}>
            <img src="/images/logo.jpg" alt="NekoKin Logo" style={{ height: 40 }} className="me-2" />
            PetHub
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav" style={{ fontFamily: 'Quicksand, sans-serif', backgroundColor: '#FAF7F1' }}>
            <ul className="navbar-nav mx-auto">
              <li className="nav-item"><Link className="nav-link fw-semibold" to="/home">Trang chủ</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" to="/about">Giới thiệu</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" to="/services">Dịch vụ</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" to="/doctors">Bác Sĩ</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" to="/news">Tin tức</Link></li>
            </ul>

            <div className="d-flex align-items-center position-relative pb-3 pb-lg-0">
              {user ? (
                <>
                  <div className="dropdown me-3">
                    <span
                      className="text-muted cursor-pointer dropdown-toggle"
                      style={{
                        fontWeight: 'bold',
                        fontFamily: 'Quicksand, sans-serif',
                        padding: '5px 10px',
                        border: '2px solid #8B0000',
                        borderRadius: '5px',
                        transition: 'all 0.2s',
                        color: '#8B0000',
                      }}
                      id="userDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {user.username}
                    </span>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      aria-labelledby="userDropdown"
                      style={{
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        backgroundColor: '#FAF7F1',
                        minWidth: '180px',
                        border: 'none',
                        padding: '8px',
                        marginTop: '5px',
                      }}
                    >
                      <li>
                        <button
                          className="dropdown-item text-start"
                          style={{ fontFamily: 'Quicksand, sans-serif', borderRadius: '5px', padding: '8px 20px', color: '#333' }}
                          onClick={() => handleNavigate('/account')}
                        >
                          Tài khoản
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-start"
                          style={{ fontFamily: 'Quicksand, sans-serif', borderRadius: '5px', padding: '8px 20px', color: '#333' }}
                          onClick={() => handleNavigate('/mypets')}
                        >
                          Thú cưng của tôi
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-start"
                          style={{ fontFamily: 'Quicksand, sans-serif', borderRadius: '5px', padding: '8px 20px', color: '#333' }}
                          onClick={() => handleNavigate('/mybookings')}
                        >
                          Dịch vụ của tôi
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-start"
                          style={{ fontFamily: 'Quicksand, sans-serif', borderRadius: '5px', padding: '8px 20px', color: '#8B0000' }}
                          onClick={handleLogout}
                        >
                          Đăng xuất
                        </button>
                      </li>
                    </ul>
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="btn btn-sm ms-2"
                      style={{ backgroundColor: '#8B0000', color: 'white' }}
                    >
                      Quản trị
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-sm" style={{ backgroundColor: '#8B0000', color: 'white' }}>
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-sm ms-2"
                    style={{ backgroundColor: '#8B0000', color: 'white' }}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow-1" style={{ paddingTop: '80px' }}>
        <Outlet />
      </main>

      <footer className="text-white py-5 mt-auto" style={{ backgroundColor: '#0d2554' }}>
        <div className="container">
          <div className="row gy-4 gx-2">
            <div className="col-12 col-md-4 text-start">
              <p style={{ fontFamily: 'Quicksand, sans-serif', lineHeight: '1.8', fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
                <strong style={{ color: 'white', fontSize: '30px' }}>PetHub </strong> là cộng đồng cung cấp sản phẩm và dịch vụ chăm sóc thú cưng tốt nhất – nơi bạn có thể tin tưởng hoàn toàn cho bé cưng của mình.
              </p>
              <div className="mt-3">
                <p className="mb-0" style={{ fontFamily: 'Quicksand, sans-serif', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong style={{ color: 'white' }}>Hotline:</strong> 0363 213 230
                </p>
                <p className="mb-1" style={{ fontFamily: 'Quicksand, sans-serif', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <strong style={{ color: 'white' }}>Địa chỉ:</strong> 57 Đường Số 31, Linh Đông, Thủ Đức, Thành phố Hồ Chí Minh
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4 text-center">
              <h5 className="mb-3 fw-bold" style={{ color: 'white', fontFamily: 'Quicksand, sans-serif', letterSpacing: '1px' }}>Danh Mục</h5>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="/home" className="text-white text-decoration-none">Trang chủ</Link></li>
                <li><Link to="/about" className="text-white text-decoration-none">Giới thiệu</Link></li>
                <li><Link to="/services" className="text-white text-decoration-none">Dịch vụ</Link></li>
                <li><Link to="/doctors" className="text-white text-decoration-none">Bác Sĩ</Link></li>
                <li><Link to="/news" className="text-white text-decoration-none">Tin tức</Link></li>
              </ul>
            </div>

            <div className="col-12 col-md-4 text-start">
              <h5 className="mb-3 fw-bold" style={{ color: 'white', fontFamily: 'Quicksand, sans-serif', letterSpacing: '1px' }}>Mạng xã hội</h5>
              <div className="d-flex gap-3">
                <a href="https://www.facebook.com/neko.kin" className="text-white" target="_blank" rel="noopener noreferrer">
                  <FaFacebook size={24} />
                </a>
                <a href="https://www.instagram.com/neko.kin" className="text-white" target="_blank" rel="noopener noreferrer">
                  <FaInstagram size={24} />
                </a>
                <a href="https://www.tiktok.com/@neko.kin" className="text-white" target="_blank" rel="noopener noreferrer">
                  <FaTiktok size={24} />
                </a>
                <a href="https://www.youtube.com/@NekoKin" className="text-white" target="_blank" rel="noopener noreferrer">
                  <FaYoutube size={24} />
                </a>
              </div>
            </div>
          </div>

          <div className="text-start mt-4 border-top pt-3 small" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
            © 2025 PetHub. All rights reserved.
          </div>
        </div>
      </footer>
      <FloatingContact />
    </div>
  );
};

export default Layout;