import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import "./Doctor.css";
import HeroDoctor from "../../components/Hero/HeroDoctor";
import HeroBottomDoctor from "../../components/Hero/HeroBottomDoctor";

const careTopics = [
  {
    title: 'Đồng hành cùng bạn',
    content: 'Dịch vụ chăm sóc thú cưng PetHub hiểu rằng thú cưng của bạn không thể diễn đạt bất cứ điều gì về cuộc sống hay triệu chứng của chúng. Vì vậy, chúng tôi bắt đầu bằng việc xây dựng mối quan hệ chặt chẽ giữa bác sĩ thú y và những người chủ. Sự thấu hiểu giữa bác sĩ thú y và chủ là điều cần thiết để phát triển một kế hoạch điều trị phù hợp. Các bác sĩ thú y của PetHub là những chuyên gia về sức khỏe động vật, nhưng bạn mới là người hiểu rõ nhất về các bé. Do đó, ưu tiên hàng đầu của NekoKin là lắng nghe những người chủ vật nuôi và hợp tác chặt chẽ để cùng nhau mang đến cho những người bạn đồng hành thân yêu của mình một cuộc sống hạnh phúc và khỏe mạnh hơn.'
  },
  {
    title: 'Trung thực và minh bạch',
    content: 'Là cha mẹ của các bé, bạn hoàn toàn có quyền được minh bạch về mọi thứ liên quan đến chăm sóc y tế cho thú cưng của mình. Đó là lý do tại sao PetHub muốn bạn tham gia vào mọi quyết định liên quan đến việc điều trị cho thú cưng của bạn. Chúng tôi tin rằng sự hợp tác này sẽ mang lại kết quả tốt nhất cho sức khỏe và hạnh phúc của những người bạn đồng hành thân yêu.'
  },
  {
    title: 'Mục tiêu',
    content: 'Thú y không chỉ là công việc kinh doanh của PetHub. Sức khỏe và phúc lợi động vật là sứ mệnh và niềm đam mê của chúng tôi. Thú cưng của bạn là ưu tiên hàng đầu tại đây. Chúng tôi cam kết cung cấp đội ngũ bác sĩ thú y có trình độ chuyên môn cao cùng với đội ngũ nhân viên hỗ trợ chuyên nghiệp, nhằm đảm bảo thú cưng của bạn có được sức khỏe tốt nhất.'
  },
  {
    title: 'Cách tiếp cận phù hợp',
    content: 'Giúp bạn hiểu và điều chỉnh hành vi thú cưng, từ huấn luyện vệ sinh, giảm stress đến điều trị các hành vi không mong muốn.'
  }
];

const DoctorPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://localhost:5000/api/doctors");
        setDoctors(data);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Lỗi khi tải dữ liệu bác sĩ"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleClick = (id) => {
    navigate(`/doctors/${id}`);
  };

  // --- PHẦN HIỂN THỊ KHI LOADING/ERROR ---
  if (loading) {
    return (
      <>
        <HeroDoctor />
        <div className="doctor-container">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1>Bác Sĩ Thú Y</h1>
            <p>Đang tải danh sách bác sĩ...</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeroDoctor />
        <div className="doctor-container">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1>Bác Sĩ Thú Y</h1>
            <p style={{ color: "red" }}>{error}</p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <div>
      <HeroDoctor />

      {/* 3. HIỂN THỊ DANH SÁCH BÁC SĨ */}
      <div className="doctor-container">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1>Bác sĩ thú y</h1>
          <p>Những chuyên gia hàng đầu về chăm sóc sức khỏe thú cưng của bạn</p>
          <div className="doctor-list">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="doctor-card"
                onClick={() => handleClick(doctor._id)}
              >
                <img
                  src={`http://localhost:5000/api/images/${doctor.image}`}
                  alt={doctor.name}
                />
                <h2>{doctor.name}</h2>
                <p className="specialty"> {doctor.specialty}</p>
                <p className="experience">{doctor.experienceYears} năm kinh nghiệm</p>
                <div className="rating">⭐ {doctor.rating.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <HeroBottomDoctor />
      </motion.div>
      <section className="py-3" style={{ backgroundColor: '#FAF7F1', width: '100%' }}>
        <div className="container px-4 px-md-5">
          <div className="text-center text-md-start">
            <h2 className="fw-bold mb-5 text-center health-care-title" style={{ fontFamily: 'Quicksand', fontSize: '2.5rem', color: '#0d2554' }}>
              Chăm sóc sức khoẻ toàn diện
            </h2>
            <div className="row">
              <div className="col-md-4 mb-4 mb-md-0">
                <ul className="list-unstyled ps-md-3">
                  {careTopics.map((topic, index) => (
                    <li
                      key={index}
                      className={`py-2 health-topic ${index === selectedIndex ? 'selected' : ''}`}
                      style={{
                        paddingLeft: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderLeft: `3px solid ${index === selectedIndex ? '#8B0000' : '#8B0000'}`,
                        fontWeight: index === selectedIndex ? 'bold' : 'normal',
                        color: index === selectedIndex ? '#8B0000' : '#3f3e3eff',
                      }}
                      onClick={() => setSelectedIndex(index)}
                    >
                      {topic.title}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-8" style={{ minHeight: '350px' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="border-0 p-4 bg-light h-100"
                    style={{ borderRadius: '50px' }}
                  >
                    <p className="text-muted health-content" style={{ lineHeight: '1.6' }}>
                      {careTopics[selectedIndex].content}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorPage;