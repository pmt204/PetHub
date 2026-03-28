import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { FaEye, FaCalendarAlt, FaUserMd, FaTruck, FaPaw, FaInfoCircle } from 'react-icons/fa';
import './MyBookings.css';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [payingBooking, setPayingBooking] = useState(null);
    const [payLoading, setPayLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserAndBookings = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Vui lòng đăng nhập để xem lịch sử.');
                    setLoading(false);
                    return;
                }

                let userData = storedUser ? JSON.parse(storedUser) : null;
                if (!userData) {
                    const userResponse = await axios.get('http://localhost:5000/auth/user/profile', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    userData = userResponse.data;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                setUser(userData);

                const bookingResponse = await axios.get('http://localhost:5000/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const activeBookings = bookingResponse.data.filter(
                    (booking) => booking.status === 'pending' || booking.status === 'active'
                );
                
                activeBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setBookings(activeBookings);
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setLoading(false);
            }
        };
        fetchUserAndBookings();
    }, []);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn này?')) return;
        setCancelLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/bookings/${bookingId}`,
                { status: 'canceled' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBookings((prev) => prev.filter((b) => b._id !== bookingId));
            alert('Hủy đơn thành công.');
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi hủy.');
        } finally {
            setCancelLoading(false);
        }
    };

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

    // --- LOGIC TÍNH GIÁ CHI TIẾT ---
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
            // Vận chuyển chính: Giá = Đơn giá * Khoảng cách
            const distance = booking.shipmentDetails?.distance || 0;
            mainPrice = Math.round(unitPrice * distance);
        } else {
            // Dịch vụ khác
            if (isHotel) {
                const days = calculateDays(booking.checkIn, booking.checkOut);
                mainPrice = unitPrice * days;
            } else {
                mainPrice = unitPrice;
            }

            // Dịch vụ phụ
            if (booking.subServices && booking.subServices.length > 0) {
                subServicesPrice = booking.subServices.reduce((acc, sub) => acc + (sub.price || 0), 0);
            }

            // Vận chuyển kèm theo (Tính ngược từ tổng)
            const currentTotal = booking.totalAmount || 0;
            const calculatedBase = mainPrice + subServicesPrice;
            if (currentTotal > calculatedBase) {
                shipmentPrice = currentTotal - calculatedBase;
            }
        }

        const total = booking.totalAmount || (mainPrice + subServicesPrice + shipmentPrice);

        return { 
            isShipmentMain, 
            isHotel, 
            unitPrice, 
            mainPrice, 
            subServicesPrice, 
            shipmentPrice, 
            total 
        };
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { class: 'badge-pending', text: 'Chờ xác nhận' };
            case 'active': return { class: 'badge-active', text: 'Đã xác nhận' };
            default: return { class: 'badge-secondary', text: status };
        }
    };

    const handleOpenPayModal = (booking) => setPayingBooking(booking);
    const handleClosePayModal = () => { setPayingBooking(null); setPayLoading(false); };

    // --- PAYMENT HANDLERS ---
    const handlePayWithVNPay = async () => {
        if (!payingBooking) return;
        try {
            setPayLoading(true);
            const { total } = getBreakdown(payingBooking);
            const orderId = payingBooking._id;
            const resp = await axios.post('http://localhost:5000/api/payment/vnpay/create', { amount: total, orderId });
            if (resp?.data?.data) window.location.href = resp.data.data;
            else alert('Lỗi tạo link VNPay.');
        } catch (e) { alert('Lỗi VNPay: ' + e.message); } finally { setPayLoading(false); }
    };

    const handlePayWithMoMo = async () => {
        if (!payingBooking) return;
        try {
            setPayLoading(true);
            const { total } = getBreakdown(payingBooking);
            const bookingId = payingBooking._id;
            const resp = await axios.post('http://localhost:5000/api/payment/momo/create', { amount: total, bookingId });
            if (resp?.data?.data) window.location.href = resp.data.data;
            else alert('Lỗi tạo link MoMo.');
        } catch (e) { alert('Lỗi MoMo: ' + e.message); } finally { setPayLoading(false); }
    };

    const handlePayPalSuccess = async (bookingId, orderId, details) => {
        setPayLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/bookings/${bookingId}`,
                {
                    paymentStatus: 'success',
                    paymentMethod: 'paypal',
                    paymentDetails: { orderId, payerId: details.payer.payer_id, payerEmail: details.payer.email_address, status: details.status }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            handleClosePayModal();
            navigate(`/payment-result?success=true&orderId=${bookingId}`);
        } catch (error) {
            console.error("PayPal Error:", error);
            alert('Lỗi cập nhật đơn hàng.');
        } finally { setPayLoading(false); }
    };

    if (loading) return <div className="text-center py-5" style={{marginTop: '100px'}}>Đang tải...</div>;

    return (
        <section className="my-bookings-container">
            <div className="container">
                <h2 className="page-title">Đơn Đặt Dịch Vụ Của Bạn</h2>

                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <p className="mb-4 text-muted">Bạn chưa có đơn hàng nào.</p>
                        <Link to="/services" className="btn btn-primary btn-lg" style={{backgroundColor: '#8B0000', border: 'none'}}>Đặt Dịch Vụ</Link>
                    </div>
                ) : (
                    <div className="row g-4">
                        {bookings.map((booking) => {
                            const statusInfo = getStatusInfo(booking.status);
                            const breakdown = getBreakdown(booking);
                            const isShipmentMain = breakdown.isShipmentMain;
                            
                            // ĐIỀU KIỆN HIỂN THỊ VẬN CHUYỂN: Phải có distance > 0
                            const showShipment = booking.shipmentDetails && booking.shipmentDetails.distance > 0;

                            return (
                                <div key={booking._id} className="col-12 col-md-6 col-lg-4">
                                    <div className="booking-card">
                                        <div className="card-body-custom">
                                            {/* Header */}
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5 className="service-title">{booking.serviceId?.name}</h5>
                                                    <div className="text-muted small">#{booking._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                                <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
                                            </div>
                                            <hr className="opacity-25" />

                                            {/* 1. THÚ CƯNG (Luôn hiện) */}
                                            <div className="info-row">
                                                <span className="info-label"><FaPaw className="me-1"/> Thú cưng:</span>
                                                <span className="info-value">{booking.petId?.name}</span>
                                            </div>

                                            {/* 2. THỜI GIAN (Xử lý chung cho cả Hotel & Shipment) */}
                                            {booking.checkIn ? (
                                                <>
                                                    <div className="info-row">
                                                        <span className="info-label"><FaCalendarAlt className="me-1"/> Nhận:</span>
                                                        <span className="info-value">{moment(booking.checkIn).format('DD/MM/YYYY')}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span className="info-label"><FaCalendarAlt className="me-1"/> Trả:</span>
                                                        <span className="info-value">{moment(booking.checkOut).format('DD/MM/YYYY')}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="info-row">
                                                    <span className="info-label"><FaCalendarAlt className="me-1"/> Ngày {isShipmentMain ? 'đi' : 'hẹn'}:</span>
                                                    <span className="info-value">{moment(booking.bookingDate).format('HH:mm - DD/MM/YYYY')}</span>
                                                </div>
                                            )}

                                            {/* 3. BÁC SĨ (Chỉ hiện nếu có và không phải Shipment chính) */}
                                            {booking.doctorId && !isShipmentMain && (
                                                <div className="info-row">
                                                    <span className="info-label"><FaUserMd className="me-1"/> Bác sĩ:</span>
                                                    <span className="info-value">{booking.doctorId.name}</span>
                                                </div>
                                            )}

                                            {/* 4. DỊCH VỤ THÊM (Tooltip) */}
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

                                            {/* 5. VẬN CHUYỂN (Chỉ hiện nếu distance > 0) */}
                                            {showShipment && (
                                                <div className="info-row align-items-center">
                                                    <span className="info-label"><FaTruck className="me-1"/> Vận chuyển:</span>
                                                    <div className="d-flex align-items-center">
                                                        {/* Hiển thị giống nhau cho cả Main & Sub */}
                                                        <span className="info-value">
                                                            Chi tiết {isShipmentMain ? '(Lộ trình)' : '(Đưa đón)'}
                                                        </span>
                                                        <div className="tooltip-wrapper">
                                                            <FaEye className="eye-icon" />
                                                            <div className="custom-tooltip">
                                                                <div className="tooltip-item"><strong>Đón:</strong> {booking.shipmentDetails.pickupAddress}</div>
                                                                <div className="tooltip-item"><strong>Trả:</strong> {booking.shipmentDetails.dropoffAddress}</div>
                                                                {/* Đã thêm hiển thị khoảng cách vào đây */}
                                                                <div className="tooltip-item"><strong>Khoảng cách:</strong> {booking.shipmentDetails.distance} km</div>
                                                                
                                                                {/* Công thức tính tiền (Hiển thị khác nhau tùy loại) */}
                                                                <div className="tooltip-item text-warning border-top pt-2 mt-1">
                                                                    {isShipmentMain ? (
                                                                         <span><strong>Phí:</strong> {booking.shipmentDetails.distance} km x {formatCurrency(breakdown.unitPrice)} = {formatCurrency(breakdown.mainPrice)}</span>
                                                                    ) : (
                                                                         <span><strong>Phí:</strong> {formatCurrency(breakdown.shipmentPrice)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- TỔNG THANH TOÁN (TOOLTIP INFO) --- */}
                                            <div className="total-amount-section">
                                                <div className="d-flex align-items-center">
                                                    <span className="total-label">Tổng thanh toán:</span>
                                                    
                                                    {/* Tooltip Chi tiết giá */}
                                                    <div className="tooltip-wrapper ms-2">
                                                        <FaInfoCircle className="eye-icon" style={{color: '#6c757d', fontSize: '1rem'}} />
                                                        <div className="custom-tooltip" style={{width: '280px'}}>
                                                            
                                                            {/* Dòng 1: Giá dịch vụ chính */}
                                                            <div className="tooltip-item">
                                                                <span>
                                                                    {isShipmentMain ? 'Phí vận chuyển' : 'Dịch vụ chính'} 
                                                                    {/* Nếu là KS hiện số ngày, nếu là Vận chuyển hiện số KM */}
                                                                    {breakdown.isHotel && ` (${calculateDays(booking.checkIn, booking.checkOut)} ngày)`}
                                                                    {isShipmentMain && ` (${booking.shipmentDetails?.distance} km)`}
                                                                </span>
                                                                <strong>{formatCurrency(breakdown.mainPrice)}</strong>
                                                            </div>

                                                            {/* Dòng 2: Phụ phí (nếu có) */}
                                                            {breakdown.subServicesPrice > 0 && (
                                                                <div className="tooltip-item">
                                                                    <span>Dịch vụ thêm</span>
                                                                    <strong>+ {formatCurrency(breakdown.subServicesPrice)}</strong>
                                                                </div>
                                                            )}

                                                            {/* Dòng 3: Phí ship kèm theo (chỉ hiện nếu KHÔNG phải dịch vụ vận chuyển chính) */}
                                                            {!isShipmentMain && breakdown.shipmentPrice > 0 && (
                                                                <div className="tooltip-item">
                                                                    <span>Phí đưa đón</span>
                                                                    <strong>+ {formatCurrency(breakdown.shipmentPrice)}</strong>
                                                                </div>
                                                            )}

                                                            <div className="tooltip-item pt-2 mt-1 border-top border-secondary">
                                                                <span className="text-warning fw-bold">Tổng cộng</span>
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

                                            {/* Buttons */}
                                            {booking.paymentStatus !== 'success' && booking.status !== 'completed' && (
                                                <div className="action-buttons">
                                                    <button className="btn btn-cancel w-50" onClick={() => handleCancelBooking(booking._id)}>Hủy</button>
                                                    <button className="btn btn-pay w-50" onClick={() => handleOpenPayModal(booking)}>Thanh Toán</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="text-center mt-5">
                            <Link to="/bookinghistory" className="btn btn-secondary btn-lg shadow-sm" style={{borderRadius: '8px'}}>
                                Xem Lịch Sử Đã Hoàn Thành / Hủy
                            </Link>
                        </div>
                    </div>
                )}
                
                {/* --- MODAL THANH TOÁN --- */}
                {payingBooking && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content" style={{borderRadius: '15px', border: 'none'}}>
                                <div className="modal-header" style={{backgroundColor: '#0d2554', color: 'white'}}>
                                    <h5 className="modal-title">Thanh toán đơn hàng</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleClosePayModal}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <p className="text-center mb-4 fs-5">
                                        Tổng tiền: <strong className="text-danger fs-3">{formatCurrency(getBreakdown(payingBooking).total)}</strong>
                                    </p>
                                    <div className="d-grid gap-3">
                                        <button className="btn btn-primary py-2 fw-bold" onClick={handlePayWithVNPay} disabled={payLoading}>
                                            {payLoading ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
                                        </button>
                                        <button className="btn btn-danger py-2 fw-bold" style={{ backgroundColor: '#A50064', borderColor: '#A50064' }} onClick={handlePayWithMoMo} disabled={payLoading}>
                                            {payLoading ? 'Đang xử lý...' : 'Thanh toán qua MoMo'}
                                        </button>
                                        
                                        <div className="mt-2">
                                            <PayPalButtons
                                                fundingSource="paypal"
                                                style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                                                createOrder={(data, actions) => {
                                                    const { total } = getBreakdown(payingBooking);
                                                    const amountUSD = (total / 25000).toFixed(2);
                                                    return actions.order.create({
                                                        purchase_units: [{
                                                            amount: { currency_code: 'USD', value: amountUSD },
                                                            custom_id: payingBooking._id.toString()
                                                        }],
                                                    });
                                                }}
                                                onApprove={async (data, actions) => {
                                                    try {
                                                        const details = await actions.order.capture();
                                                        await handlePayPalSuccess(payingBooking._id, data.orderID, details);
                                                    } catch (err) {
                                                        alert('Lỗi PayPal: ' + err);
                                                    }
                                                }}
                                                onError={(err) => alert('Lỗi PayPal: ' + err)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MyBookings;