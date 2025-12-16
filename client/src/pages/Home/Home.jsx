import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeroIntro from '../../components/Hero/HeroIntro';
import { motion } from 'framer-motion';
import NewsSlider from '../../components/Bookings/NewsSlider';
import '../../pages/Home/Home.css';

const Home = () => {
  const [featuredNews, setFeaturedNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]); 
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Lấy tin tức
    axios.get('http://localhost:5000/api/news')
      .then((res) => {
        const sortedNews = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setFeaturedNews(sortedNews);
      })
      .catch((err) => console.error('Error fetching news:', err));

    // 2. Lấy danh mục dịch vụ
    axios.get('http://localhost:5000/api/categoryservices')
      .then((res) => {
        const shuffled = res.data.sort(() => 0.5 - Math.random()).slice(0, 3);
        setCategories(shuffled);
      })
      .catch((err) => console.error('Error fetching categories:', err));

    // 3. Lấy danh sách bác sĩ
    axios.get('http://localhost:5000/api/doctors')
      .then((res) => {
        const topDoctors = res.data.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
        setFeaturedDoctors(topDoctors);
      })
      .catch((err) => console.error('Error fetching doctors:', err));
  }, []);

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDoctorClick = (id) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/doctors/${id}`);
  };

  return (
    <div>
      <HeroIntro />

      {/* --- PHẦN 1: GIỚI THIỆU (NỀN TRẮNG) --- */}
      <section className="py-5" id="gioi-thieu" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-6">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h2 className="mb-4 intro-title">Giới thiệu</h2>
                <p className="text-muted mb-3 intro-text">
                  Thú cưng là một phần quan trọng như một thành viên gia đình. Chúng xứng đáng được yêu thương và chăm sóc tốt nhất.
                </p>
                <p className="text-muted mb-3 intro-text">
                  Chúng tôi thành lập PetHub để đáp ứng nhu cầu chăm sóc sức khỏe toàn diện cho thú cưng của bạn với đội ngũ chuyên nghiệp và tận tâm.
                </p>
                <Link to="/about" className="btn btn-red" onClick={handleLinkClick}>Chi tiết về chúng tôi</Link>
              </motion.div>
            </div>
            <div className="col-12 col-lg-6 text-center">
              <motion.img
                src="/images/thú-cưng-và-bs.jpg"
                alt="Thú cưng"
                className="img-fluid rounded shadow"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- PHẦN 2: DANH MỤC DỊCH VỤ (NỀN KEM - Đan xen) --- */}
      <motion.section 
        className="py-5" 
        style={{ backgroundColor: '#FAF7F1' }} 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <h2 className="text-center mb-5 intro-title">Danh mục dịch vụ</h2>
          <div className="row g-4 justify-content-center">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <Link
                    to={`/categoryservices/${category._id}`}
                    className="text-decoration-none text-dark"
                    onClick={handleLinkClick}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }} className="card h-100 shadow-sm border-0">
                      <img
                        src={`http://localhost:5000/api/images/${category.image}`}
                        className="card-img-top img-fluid card-img-custom"
                        alt={category.name}
                        onError={(e) => (e.target.src = '/images/default_category.jpg')}
                      />
                      <div className="card-body">
                        <h3 className="card-title card-title-center">{category.name}</h3>
                      </div>
                    </motion.div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-12 text-center">
                <p className="text-muted">Đang cập nhật danh mục...</p>
              </div>
            )}
          </div>
          <div className="text-center mt-5">
            <Link to="/services" onClick={handleLinkClick} className="btn btn-red px-4 py-2">Xem tất cả dịch vụ</Link>
          </div>
        </div>
      </motion.section>

      {/* --- PHẦN 3: BÁC SĨ NỔI BẬT (NỀN TRẮNG - Đan xen) --- */}
      <motion.section 
        className="py-5" 
        style={{ backgroundColor: '#FFFFFF' }} 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <h2 className="text-center mb-5 intro-title">Đội ngũ bác sĩ tiêu biểu</h2>
          <div className="row g-4 justify-content-center">
            {featuredDoctors.length > 0 ? (
              featuredDoctors.map((doctor) => (
                <div key={doctor._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <motion.div 
                    whileHover={{ y: -10 }} 
                    className="card h-100 shadow-sm border-0 doctor-card-home"
                    onClick={() => handleDoctorClick(doctor._id)}
                  >
                    <div className="doctor-img-wrapper">
                       <img
                        src={`http://localhost:5000/api/images/${doctor.image}`}
                        className="card-img-top doctor-img-home"
                        alt={doctor.name}
                        onError={(e) => (e.target.src = '/images/default_doctor.jpg')}
                      />
                    </div>
                    <div className="card-body text-center">
                      <h4 className="card-title fw-bold" style={{color: '#0d2554', fontSize: '1.25rem'}}>{doctor.name}</h4>
                      <p className="text-muted mb-2 small">{doctor.specialty}</p>
                      <div className="text-warning fw-bold">
                         ⭐ {doctor.rating ? doctor.rating.toFixed(1) : '5.0'}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center">
                <p className="text-muted">Đang cập nhật danh sách bác sĩ...</p>
              </div>
            )}
          </div>
          <div className="text-center mt-5">
             <Link to="/doctors" onClick={handleLinkClick} className="btn btn-red px-4 py-2">Xem tất cả bác sĩ</Link>
          </div>
        </div>
      </motion.section>

      {/* --- PHẦN 4: TIN TỨC (NỀN KEM - Đan xen) --- */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }} 
        className="py-5"
        style={{ backgroundColor: '#FAF7F1' }}
      >
         <div className="container">
            <NewsSlider featuredNews={featuredNews} />
         </div>
      </motion.div>
    </div>
  );
};

export default Home;