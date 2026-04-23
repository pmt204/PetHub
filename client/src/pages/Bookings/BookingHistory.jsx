import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { FaEye, FaCalendarAlt, FaUserMd, FaTruck, FaPaw, FaInfoCircle, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './MyBookings.css'; 

const BookingHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Vui lòng đăng nhập.');
                    setLoading(false);
                    return;
                }

                const res = await axios.get('http://localhost:5000/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const historyBookings = res.data.filter(
                    b => b.status === 'completed' || b.status === 'canceled'
                );
                
                historyBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setBookings(historyBookings);
            } catch (err) {
                console.error(err);
                setError('Lỗi tải lịch sử.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const calculateDays = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = moment(checkIn);
        const end = moment(checkOut);
        const days = Math.ceil(end.diff(start, 'days'));
        return days > 0 ? days : 1;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const getBreakdown = (booking) => {
        const category = booking.serviceId?.category;
        const catId = typeof category === 'object' ? category?._id : String(category);
        const unitPrice = booking.serviceId?.price || 0;
        
        let mainPrice = 0;
        let subServicesPrice = 0;
        let shipmentPrice = 0;
        
        const isShipmentMain = catId === '4' || Number(catId) === 4;
        const isHotel = catId === '3' || Number(catId) === 3;

        if (isShipmentMain) {
            const distance = booking.shipmentDetails?.distance || 0;
            mainPrice = Math.round(unitPrice * distance);
        } else {
            if (isHotel) {
                const days = calculateDays(booking.checkIn, booking.checkOut);
                mainPrice = unitPrice * days;
            } else {
                mainPrice = unitPrice;
            }
            if (booking.subServices && booking.subServices.length > 0) {
                subServicesPrice = booking.subServices.reduce((acc, sub) => acc + (sub.price || 0), 0);
            }
            const currentTotal = booking.totalAmount || 0;
            const calculatedBase = mainPrice + subServicesPrice;
            if (currentTotal > calculatedBase) {
                shipmentPrice = currentTotal - calculatedBase;
            }
        }
        const total = booking.totalAmount || (mainPrice + subServicesPrice + shipmentPrice);
        return { isShipmentMain, isHotel, unitPrice, mainPrice, subServicesPrice, shipmentPrice, total };
    };

    const getStatusBadge = (status) => {
        if (status === 'completed') return <span className="badge bg-success"><FaCheckCircle className="me-1"/> Hoàn thành</span>;
        if (status === 'canceled') return <span className="badge bg-danger"><FaTimesCircle className="me-1"/> Đã hủy</span>;
        return <span className="badge bg-secondary">{status}</span>;
    };

    if (loading) return <div className="text-center py-5" style={{marginTop:'100px'}}>Đang tải dữ liệu...</div>;
    if (error) return <div className="text-center py-5 text-danger" style={{marginTop:'100px'}}>{error}</div>;

    return (
        <section className="my-bookings-container">
            <div className="container">
                <h2 className="page-title">Lịch Sử Dịch Vụ Đã Sử Dụng</h2>

                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <p className="mb-4 text-muted">Bạn chưa có lịch sử đơn hàng nào.</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Link to="/services" className="btn btn-primary" style={{backgroundColor: '#8B0000', border: 'none'}}>Đặt Dịch Vụ</Link>
                            <Link to="/mybookings" className="btn btn-outline-secondary">Xem Đơn Đang Chờ</Link>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {bookings.map((booking) => {
                            const breakdown = getBreakdown(booking);
                            const isShipmentMain = breakdown.isShipmentMain;
                            const showShipment = booking.shipmentDetails && booking.shipmentDetails.distance > 0;

                            return (
                                <div key={booking._id} className="col-12 col-md-6 col-lg-4">
                                    <div className={`booking-card ${booking.status === 'canceled' ? 'opacity-75' : ''}`}>
                                        <div className="card-body-custom">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5 className="service-title">{booking.serviceId?.name}</h5>
                                                    <div className="text-muted small">#{booking._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                                {getStatusBadge(booking.status)}
                                            </div>
                                            <hr className="opacity-25" />

                                            <div className="info-row">
                                                <span className="info-label"><FaPaw className="me-1"/> Thú cưng:</span>
                                                <span className="info-value">{booking.petId?.name}</span>
                                            </div>

                                            {isShipmentMain ? (
                                                <>
                                                    <div className="info-row">
                                                        <span className="info-label"><FaCalendarAlt className="me-1"/> Ngày đi:</span>
                                                        <span className="info-value">{moment(booking.bookingDate).format('DD/MM/YYYY')}</span>
                                                    </div>
                                                    <div className="info-row align-items-start">
                                                        <span className="info-label mt-1"><FaMapMarkerAlt className="me-1"/> Lộ trình:</span>
                                                        <div className="text-end" style={{fontSize: '0.9rem', maxWidth: '60%'}}>
                                                            <div className="text-truncate">{booking.shipmentDetails?.pickupAddress}</div>
                                                            <div className="text-center text-muted my-1">↓</div>
                                                            <div className="text-truncate">{booking.shipmentDetails?.dropoffAddress}</div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {booking.checkIn ? (
                                                        <>
                                                            <div className="info-row">
                                                                <span className="info-label">Check-in:</span>
                                                                <span className="info-value">{moment(booking.checkIn).format('DD/MM/YYYY')}</span>
                                                            </div>
                                                            <div className="info-row">
                                                                <span className="info-label">Check-out:</span>
                                                                <span className="info-value">{moment(booking.checkOut).format('DD/MM/YYYY')}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="info-row">
                                                            <span className="info-label"><FaCalendarAlt className="me-1"/> Ngày hẹn:</span>
                                                            <span className="info-value">{moment(booking.bookingDate).format('HH:mm - DD/MM/YYYY')}</span>
                                                        </div>
                                                    )}

                                                    {booking.doctorId && (
                                                        <div className="info-row">
                                                            <span className="info-label"><FaUserMd className="me-1"/> Bác sĩ:</span>
                                                            <span className="info-value">{booking.doctorId.name}</span>
                                                        </div>
                                                    )}

                                                    {booking.subServices && booking.subServices.length > 0 && (
                                                        <div className="info-row align-items-center">
                                                            <span className="info-label">Dịch vụ thêm:</span>
                                                            <div className="d-flex align-items-center">
                                                                <span className="info-value">{booking.subServices.length} dịch vụ</span>
                                                                <div className="tooltip-wrapper">
                                                                    <FaEye className="eye-icon" />
                                                                    <div className="custom-tooltip">
                                                                        {booking.subServices.map((sub, idx) => (
                                                                            <div key={idx} className="tooltip-item">
                                                                                <span>{sub.name}</span>
                                                                                <strong>{formatCurrency(sub.price)}</strong>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {showShipment && (
                                                        <div className="info-row align-items-center">
                                                            <span className="info-label"><FaTruck className="me-1"/> Vận chuyển:</span>
                                                            <div className="d-flex align-items-center">
                                                                <span className="info-value">Chi tiết</span>
                                                                <div className="tooltip-wrapper">
                                                                    <FaEye className="eye-icon" />
                                                                    <div className="custom-tooltip">
                                                                        <div className="tooltip-item"><strong>Đón:</strong> {booking.shipmentDetails.pickupAddress}</div>
                                                                        <div className="tooltip-item"><strong>Trả:</strong> {booking.shipmentDetails.dropoffAddress}</div>
                                                                        <div className="tooltip-item text-warning">
                                                                            <strong>Phí:</strong> {formatCurrency(breakdown.shipmentPrice)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            <div className="total-amount-section">
                                                <div className="d-flex align-items-center">
                                                    <span className="total-label">Tổng tiền:</span>
                                                    <div className="tooltip-wrapper ms-2">
                                                        <FaInfoCircle className="eye-icon" style={{color: '#6c757d'}} />
                                                        <div className="custom-tooltip" style={{width: '280px'}}>
                                                            <div className="tooltip-item">
                                                                <span>Dịch vụ chính</span>
                                                                <strong>{formatCurrency(breakdown.mainPrice)}</strong>
                                                            </div>
                                                            {breakdown.subServicesPrice > 0 && (
                                                                <div className="tooltip-item">
                                                                    <span>Phụ phí</span>
                                                                    <strong>+ {formatCurrency(breakdown.subServicesPrice)}</strong>
                                                                </div>
                                                            )}
                                                            {(!isShipmentMain && breakdown.shipmentPrice > 0) && (
                                                                <div className="tooltip-item">
                                                                    <span>Vận chuyển</span>
                                                                    <strong>+ {formatCurrency(breakdown.shipmentPrice)}</strong>
                                                                </div>
                                                            )}
                                                            <div className="tooltip-item pt-2 mt-1 border-top border-secondary">
                                                                <span className="text-warning fw-bold">Tổng</span>
                                                                <span className="text-warning fw-bold">{formatCurrency(breakdown.total)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="total-value">{formatCurrency(breakdown.total)}</span>
                                            </div>

                                            <div className="mt-2 text-end">
                                                {booking.paymentStatus === 'success' ? (
                                                    <span className="badge bg-success">Đã thanh toán</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Chưa thanh toán</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="text-center mt-5">
                    <Link to="/mybookings" className="btn btn-secondary btn-lg shadow-sm" style={{borderRadius: '8px'}}>
                        Quay Lại Đơn Đặt Dịch Vụ Đang Chờ
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default BookingHistory;