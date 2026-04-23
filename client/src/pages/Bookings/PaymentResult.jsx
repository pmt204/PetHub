import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaHome, FaHistory, FaReceipt } from 'react-icons/fa';
import './PaymentResult.css'; 
const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId') || 'GD-' + Math.floor(Math.random() * 1000000);

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="payment-page-wrapper">
            <motion.img 
                src="/images/logo.png" 
                alt="PetHub Logo" 
                className="pet-logo"
                style={{ height: '70px', objectFit: 'contain' }}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onError={(e) => e.target.style.display = 'none'} 
            />

            <motion.div 
                className="payment-card"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div 
                    className="p-4 text-center" 
                    style={{ 
                        backgroundColor: success ? '#d1fae5' : '#fee2e2', 
                        height: '120px'
                    }}
                >
                </div>

                <div className="text-center position-relative" style={{ top: '-50px', marginBottom: '-30px' }}>
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="payment-header-icon"
                    >
                        <div 
                            className={`d-flex align-items-center justify-content-center rounded-circle text-white shadow-sm`}
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                backgroundColor: success ? '#10b981' : '#ef4444',
                                fontSize: '40px'
                            }}
                        >
                            {success ? <FaCheck /> : <FaTimes />}
                        </div>
                    </motion.div>
                </div>

                <div className="card-body px-5 pb-5 pt-4 text-center">
                    <h2 className="fw-bold mb-2" style={{ color: '#1f2937' }}>
                        {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                    </h2>
                    <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                        {success 
                            ? 'Tuyệt vời! Dịch vụ chăm sóc cho bé cưng đã được thanh toán.' 
                            : 'Có vẻ như đã có lỗi xảy ra trong quá trình xử lý.'}
                    </p>

                    <div className="bg-light p-3 rounded-3 mb-4 text-start border border-light">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-secondary small"><FaReceipt className="me-2"/>Mã đơn hàng:</span>
                            <span className="fw-bold text-dark font-monospace">{orderId}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span className="text-secondary small"><FaHistory className="me-2"/>Thời gian:</span>
                            <span className="fw-bold text-dark">{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>

                    <div className="d-grid gap-3">
                        {success ? (
                            <>
                                <button 
                                    className="btn btn-dark py-3 rounded-pill fw-bold shadow-sm"
                                    onClick={() => navigate('/mybookings')}
                                >
                                    Xem lịch sử đơn hàng
                                </button>
                                <button 
                                    className="btn btn-outline-secondary py-3 rounded-pill fw-bold"
                                    onClick={() => navigate('/')}
                                >
                                    <FaHome className="me-2 mb-1" /> Về trang chủ
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    className="btn btn-danger py-3 rounded-pill fw-bold shadow-sm"
                                    onClick={() => navigate(-1)}
                                >
                                    Thử thanh toán lại
                                </button>
                                <button 
                                    className="btn btn-link text-decoration-none text-muted"
                                    onClick={() => navigate('/')}
                                >
                                    Bỏ qua, về trang chủ
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="mt-4 text-muted small opacity-75">
                © 2025 PetHub Services
            </div>
        </div>
    );
};

export default PaymentResult;