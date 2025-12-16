import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import BookingModal from '../../components/Bookings/BookingModal';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AOS from 'aos';
import 'aos/dist/aos.css';

const ServiceShipmentDetail = () => {
    const { id: categoryId } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const testimonials = [
        {
            avatar: "/images/shipmentfeed1.png",
            name: "Lan & Coffee",
            review: "Dịch vụ vận chuyển rất chuyên nghiệp. Bé nhà mình đi hơn 800km mà vẫn khỏe re, được cập nhật hình ảnh suốt hành trình!"
        },
        {
            avatar: "/images/shipmentfeed2.png",
            name: "Raúl Om",
            review: "Nhân viên PetHub rất chuyên nghiệp, thân thiện và nhiệt tình..."
        },
        {
            avatar: "/images/shipmentfeed3.png",
            name: "Thành & Kin",
            review: "Lần đầu gửi chó đi dịch vụ vận chuyển mà yên tâm tuyệt đối..."
        },
        {
            avatar: "/images/shipmentfeed4.png",
            name: "Thành & Kin",
            review: "Dịch vụ vận chuyển thú cưng rất tận tâm và chuyên nghiệp..."
        }
    ];

    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    useEffect(() => {
        const fetchCategoryDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/categoryservices/${categoryId}`);
                setCategory(response.data);
            } catch (err) {
                setError('Không thể tải thông tin dịch vụ.');
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) fetchCategoryDetails();
    }, [categoryId]);

    const closeBookingModal = () => setIsBookingModalOpen(false);
    const handleBookingClick = () => navigate("/shipment");

    // GALLERY
    const galleryImages = [
        '/images/shipment1.png',
        '/images/shipment2.png',
        '/images/shipment3.png',
        '/images/shipment4.jpeg',
        '/images/shipment5.jpg',
        '/images/shipment6.jpeg',
        '/images/shipment7.jpeg',
        '/images/shipment8.jpeg',
        '/images/shpment9.jpeg'
    ];

    if (loading) return <div className="text-center py-5">Đang tải...</div>;
    if (error) return <div className="alert alert-danger py-5 text-center">{error}</div>;
    if (!category) return <div className="alert alert-info py-5 text-center">Không tìm thấy dữ liệu.</div>;

    return (
        <>
            <section
                className="shipment-header py-5"
                style={{ backgroundColor: "#fff" }}
                data-aos="fade-up"
            >
                <div className="container">
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <h3
                            className="heading text-center mb-4 fw-bold"
                            style={{
                                fontFamily: "Quicksand, sans-serif",
                                fontSize: "2.4rem",
                                background: "linear-gradient(90deg, #001f4c 0%, #0d2554 50%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Vận chuyển thú cưng an toàn – nhanh chóng – tận tâm
                        </h3>
                    </motion.div>

                    <div className="row justify-content-center">
                        <div className="col-md-4 mb-0" data-aos="fade-right">
                            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                <p className="FirstParagraph">
                                    Khi di chuyển xa, thú cưng thường dễ căng thẳng và lo lắng. Phương tiện cá nhân đôi khi không
                                    đảm bảo an toàn hoặc không phù hợp cho các chuyến vận chuyển dài.
                                </p>
                            </motion.div>
                        </div>

                        <div className="col-md-4 mb-0" data-aos="fade-left">
                            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                <p className="FirstParagraph">
                                    Với xe chuyên dụng, lồng đạt chuẩn IATA và đội ngũ theo sát hành trình, chúng tôi đảm bảo thú
                                    cưng được di chuyển êm ái, an toàn và thoải mái nhất.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-0" style={{ backgroundColor: "#fff" }} data-aos="fade-up">
                <Slider
                    dots={true}
                    arrows={true}
                    infinite={true}
                    speed={600}
                    slidesToShow={1}
                    slidesToScroll={1}
                    className="gallery-slider full-width-slider"
                >
                    {[
                        {
                            top: [
                                { type: "landscape", img: galleryImages[0] },
                                { type: "portrait", img: galleryImages[1] },
                                { type: "portrait", img: galleryImages[2] },
                                { type: "portrait", img: galleryImages[8] },
                            ],
                            bottom: [
                                { type: "portrait", img: galleryImages[3] },
                                { type: "landscape", img: galleryImages[4] },
                                { type: "portrait", img: galleryImages[5] },
                                { type: "landscape", img: galleryImages[7] },
                            ],
                        },
                        {
                            top: [
                                { type: "portrait", img: galleryImages[6] },
                                { type: "landscape", img: galleryImages[7] },
                                { type: "portrait", img: galleryImages[8] },
                                { type: "portrait", img: galleryImages[3] },
                            ],
                            bottom: [
                                { type: "landscape", img: galleryImages[0] },
                                { type: "portrait", img: galleryImages[1] },
                                { type: "portrait", img: galleryImages[2] },
                                { type: "landscape", img: galleryImages[4] },
                            ],
                        },
                    ].map((slide, index) => (
                        <div key={index}>
                            <div className="gallery-row d-flex justify-content-center gap-3 mb-3">
                                {slide.top.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`gallery-img-wrapper ${item.type}`}
                                        style={{ backgroundImage: `url(${item.img})` }}
                                    />
                                ))}
                            </div>

                            <div className="gallery-row d-flex justify-content-center gap-3">
                                {slide.bottom.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`gallery-img-wrapper ${item.type}`}
                                        style={{ backgroundImage: `url(${item.img})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </Slider>
            </section>


            {/* BUTTON */}
            <section className="py-4 text-center" style={{ backgroundColor: "#fff" }} data-aos="zoom-in">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <button
                        onClick={handleBookingClick}
                        className="btn btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                        style={{
                            background: 'linear-gradient(135deg, #8B0000, #A52A2A)',
                            color: 'white',
                            fontFamily: 'Quicksand, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transition: 'all 0.4s ease'
                        }}
                        onMouseEnter={(e) => (e.target.style.transform = 'translateY(-4px)')}
                        onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
                    >
                        Đặt Vận Chuyển Ngay
                    </button>
                </motion.div>
            </section>

            {/* FEEDBACK */}
            <section className="py-5" style={{ backgroundColor: "#FAF7F1" }} data-aos="fade-up">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <h2 className="text-center mb-2 fw-bold"
                        style={{ fontFamily: "Quicksand", fontSize: "2.8rem", color: "#0d2554" }}>
                        Đừng chỉ nghe chúng tôi nói!
                    </h2>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <p className="text-center mb-5"
                        style={{ fontSize: "1.35rem", color: "#555", fontWeight: 500 }}>
                        Hãy gặp gỡ những khách hàng của chúng tôi
                    </p>
                </motion.div>

                <div className="d-flex justify-content-center align-items-end gap-4 flex-wrap px-3 mt-5">
                    {testimonials.map((item, index) => {
                        const isActive = selectedIndex === index;

                        return (
                            <div
                                key={index}
                                className="text-center cursor-pointer position-relative"
                                onClick={() => setSelectedIndex(index)}
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isActive ? 'translateY(-18px) scale(1.1)' : 'translateY(0) scale(0.93)',
                                    zIndex: isActive ? 20 : 1,
                                    filter: isActive ? 'brightness(1)' : 'brightness(0.87)',
                                }}
                            >
                                <div
                                    style={{
                                        borderRadius: '36px',
                                        overflow: 'hidden',
                                        border: isActive ? '8px solid #fff' : '5px solid transparent',
                                        boxShadow: isActive
                                            ? '0 18px 40px rgba(139, 0, 0, 0.3)'
                                            : '0 10px 25px rgba(0, 0, 0, 0.15)',
                                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    <img
                                        src={item.avatar}
                                        alt={item.name}
                                        style={{
                                            width: isActive ? '270px' : '230px',
                                            height: isActive ? '380px' : '340px',
                                            objectFit: 'cover',
                                            display: 'block',
                                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="row justify-content-center mt-5">
                    <div className="col-lg-9 col-xl-8">
                        <div className="text-center px-3">
                            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                <p
                                    className="fst-italic lh-lg text-secondary mb-5 position-relative d-inline-block px-5"
                                    style={{
                                        fontSize: '1.5rem',
                                        maxWidth: '900px',
                                        margin: '0 auto',
                                        lineHeight: '2.2rem',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '4rem',
                                        color: '#0d2455',
                                        opacity: 0.15,
                                        position: 'absolute',
                                        left: '-20px',
                                        top: '-30px',
                                        fontFamily: 'Georgia, serif'
                                    }}>“</span>

                                    {testimonials[selectedIndex].review}

                                    <span style={{
                                        fontSize: '4rem',
                                        color: '#0d2445',
                                        opacity: 0.15,
                                        position: 'absolute',
                                        right: '-20px',
                                        bottom: '-50px',
                                        fontFamily: 'Georgia, serif'
                                    }}>”</span>
                                </p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                <p className="fw-bold text-danger mb-0"
                                    style={{ fontSize: '2rem', letterSpacing: '1px', fontFamily: "Quicksand" }}>
                                    {testimonials[selectedIndex].name}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={closeBookingModal}
                initialCategoryId={categoryId}
            />
        </>
    );
};

export default ServiceShipmentDetail;
