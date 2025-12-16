// src/components/BookingModal.jsx – PHIÊN BẢN HOÀN CHỈNH NHẤT 2025 (KHÔNG LƯỢC BỎ GÌ HẾT!)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import TimeSlotPicker from './TimeSlotPicker';
import GoongMap from '../map/GoongMap';
import GoongAutocomplete from '../map/GoongAutocomplete';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingModal.css';

const SHOP_ADDRESS = "57 Đường Số 31, Linh Đông, Thủ Đức, Thành phố Hồ Chí Minh";

const BookingModal = ({ isOpen, onClose, initialCategoryId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        serviceId: '',
        petId: '',
        doctorId: '',
        bookingDate: null,
        checkIn: null,
        checkOut: null,
        bookingTime: '',
        notes: '',
        subServiceIds: [],

        // PHẦN VẬN CHUYỂN MỚI
        needsTransport: false,
        transportType: null, // 'pickup' | 'return' | 'both'
        homeAddress: '',
        selectedTransportServiceId: '',
    });

    const [pets, setPets] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [transportServices, setTransportServices] = useState([]);
    const [selectedServiceDetails, setSelectedServiceDetails] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [distanceInfo, setDistanceInfo] = useState(null);

    const currentCategoryId = initialCategoryId?.toString();
    const serviceScrollRef = useRef(null);
    const doctorScrollRef = useRef(null);

    // Reset khi mở modal
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({
                serviceId: '', petId: '', doctorId: '', bookingDate: null, checkIn: null, checkOut: null,
                bookingTime: '', notes: '', subServiceIds: [],
                needsTransport: false, transportType: null, homeAddress: '', selectedTransportServiceId: '',
            });
            setError(''); setSuccess(''); setDistanceInfo(null); setAvailability(null);

            fetchPets();
            if (currentCategoryId === '1') {
                fetchAvailableServices();
                fetchDoctors();
            } else if (currentCategoryId === '3') {
                fetchAvailableServices();
                fetchSubServices();
            } else {
                fetchAvailableServices();
            }
            fetchTransportServices();
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // Cuộn ngang cho dịch vụ & bác sĩ
        const preventVerticalScroll = (e) => {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
        };
        const serviceEl = serviceScrollRef.current;
        const doctorEl = doctorScrollRef.current;
        if (serviceEl) serviceEl.addEventListener('wheel', preventVerticalScroll, { passive: false });
        if (doctorEl) doctorEl.addEventListener('wheel', preventVerticalScroll, { passive: false });

        return () => {
            if (serviceEl) serviceEl.removeEventListener('wheel', preventVerticalScroll);
            if (doctorEl) doctorEl.removeEventListener('wheel', preventVerticalScroll);
        };
    }, [isOpen, currentCategoryId]);

    const fetchPets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPets(res.data);
        } catch (err) {
            setError('Không tải được thú cưng');
        }
    };

    const fetchAvailableServices = async () => {
        if (!currentCategoryId) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/services/category/${currentCategoryId}`);
            setAvailableServices(res.data);
        } catch (err) {
            setError('Không tải được dịch vụ');
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubServices = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/services/category/2');
            setSubServices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTransportServices = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/services/category/4');
            setTransportServices(res.data);
        } catch (err) {
            console.error('Lỗi tải dịch vụ vận chuyển:', err);
        }
    };

    // Lấy chi tiết dịch vụ khi chọn
    useEffect(() => {
        if (formData.serviceId) {
            axios.get(`http://localhost:5000/api/services/${formData.serviceId}`)
                .then(res => setSelectedServiceDetails(res.data))
                .catch(() => setError('Không tải được thông tin dịch vụ'));
        } else {
            setSelectedServiceDetails(null);
        }
    }, [formData.serviceId]);

    // Tính khoảng cách vận chuyển
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.needsTransport && formData.homeAddress && formData.selectedTransportServiceId) {
                
                let origin = formData.homeAddress;
                let destination = SHOP_ADDRESS;

                if (formData.transportType === 'return' || formData.transportType === 'both') {
                    origin = SHOP_ADDRESS;
                    destination = formData.homeAddress;
                }

                try {
                    const res = await axios.post('http://localhost:5000/api/maps/calculate', { origin, destination });
                    const km = (res.data.distanceValue / 1000).toFixed(1);
                    setDistanceInfo({
                        distance: `${km} km`,
                        duration: res.data.durationText,
                        distanceKm: parseFloat(km)
                    });
                } catch (err) {
                    setDistanceInfo(null);
                }
            } else {
                setDistanceInfo(null);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.homeAddress, formData.transportType, formData.selectedTransportServiceId, formData.needsTransport]);

    // Kiểm tra phòng khách sạn
    const checkAvailability = useCallback(
        debounce(async () => {
            if (selectedServiceDetails?.category === 3 && formData.checkIn && formData.checkOut) {
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.post(
                        `http://localhost:5000/api/bookings/check-availability/${formData.serviceId}`,
                        { checkIn: formData.checkIn.toISOString(), checkOut: formData.checkOut.toISOString() },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAvailability(response.data);
                    setError('');
                } catch (err) {
                    setError(err.response?.data?.message || 'Lỗi kiểm tra phòng.');
                    setAvailability(null);
                } finally {
                    setLoading(false);
                }
            }
        }, 500),
        [formData.checkIn, formData.checkOut, formData.serviceId, selectedServiceDetails?.category]
    );

    useEffect(() => {
        if (step === 2 && selectedServiceDetails?.category === 3) checkAvailability();
        return () => checkAvailability.cancel();
    }, [formData.checkIn, formData.checkOut, checkAvailability, step, selectedServiceDetails?.category]);

    const handleDateChange = (date, name) => {
        setFormData(prev => ({ ...prev, [name]: date }));
        setError('');
    };

    const handleTimeSelect = (time) => {
        setFormData(prev => ({ ...prev, bookingTime: time }));
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubServiceChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            subServiceIds: checked
                ? [...prev.subServiceIds, value]
                : prev.subServiceIds.filter(id => id !== value)
        }));
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (!formData.serviceId) return setError('Vui lòng chọn dịch vụ');
            if (currentCategoryId === '1' && !formData.doctorId) return setError('Vui lòng chọn bác sĩ');
            if (!formData.petId) return setError('Vui lòng chọn thú cưng');
        }
        if (step === 2) {
            if (selectedServiceDetails?.category !== 3 && (!formData.bookingDate || !formData.bookingTime))
                return setError('Vui lòng chọn ngày giờ');
            if (selectedServiceDetails?.category === 3 && (!formData.checkIn || !formData.checkOut))
                return setError('Vui lòng chọn ngày nhận/trả phòng');
            if (selectedServiceDetails?.category === 3 && availability?.availableRooms <= 0)
                return setError('Không còn phòng trống');
        }
        if (step === 3 && formData.needsTransport) {
            if (!formData.homeAddress.trim()) return setError('Vui lòng nhập địa chỉ nhà');
            if (!formData.selectedTransportServiceId) return setError('Vui lòng chọn gói vận chuyển');
        }
        setError('');
        setStep(prev => prev + 1);
    };

    const handlePrevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                serviceId: formData.serviceId,
                petId: formData.petId,
                doctorId: formData.doctorId || undefined,
                notes: formData.notes,
                subServiceIds: formData.subServiceIds,
                bookingDate: formData.bookingDate || formData.checkIn,
                checkIn: formData.checkIn || undefined,
                checkOut: formData.checkOut || undefined,

                needsTransport: formData.needsTransport,
                transportType: formData.transportType,
                homeAddress: formData.homeAddress,
                selectedTransportServiceId: formData.selectedTransportServiceId || undefined,
            };

            // PHẢI GÁN RESPONSE ĐỂ LẤY DATA
            const response = await axios.post(
                'http://localhost:5000/api/bookings/unified',
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // ĐÓNG MODAL VÀ CHUYỂN QUA TRANG KẾT QUẢ
            onClose();

            navigate('/booking-result', {
                state: {
                    success: true,
                    message: '',
                    bookingId: response.data.data._id // ĐÚNG RỒI ĐÂY!
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lịch thất bại');
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => moment().startOf('day').toDate();
    const getMinCheckoutDate = () => formData.checkIn ? moment(formData.checkIn).add(1, 'day').toDate() : getMinDate();

    const calculateTotal = () => {
        let total = selectedServiceDetails?.price || 0;

        if (selectedServiceDetails?.category === 3 && formData.checkIn && formData.checkOut) {
            const days = moment(formData.checkOut).diff(moment(formData.checkIn), 'days') || 1;
            total *= days;
        }

        total += subServices
            .filter(s => formData.subServiceIds.includes(s._id))
            .reduce((sum, s) => sum + s.price, 0);

        if (distanceInfo && formData.selectedTransportServiceId) {
            const transport = transportServices.find(s => s._id === formData.selectedTransportServiceId);
            if (transport) {
                const trips = formData.transportType === 'both' ? 2 : 1;
                total += transport.price * distanceInfo.distanceKm * trips;
            }
        }

        return Math.round(total);
    };

    if (!isOpen) return null;

    return (
        <Sidebar isOpen={isOpen} onClose={onClose} title="Đặt Lịch Dịch Vụ">
            <div className="modal-content-custom p-4">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="progress mb-4">
                    <div className="progress-bar bg-danger" style={{ width: `${(step / 4) * 100}%` }}>
                        Bước {step}/4
                    </div>
                </div>

                {/* BƯỚC 1: CHỌN DỊCH VỤ, BÁC SĨ, THÚ CƯNG */}
                {step === 1 && (
                    <div>
                        <h4 className="mb-4 text-center">Chọn dịch vụ</h4>

                        {/* PHẦN DỊCH VỤ */}
                        <div className="mb-5">
                            <h5 className="text-primary fw-bold mb-3">
                                {currentCategoryId === '1' ? 'Chọn gói khám' : 'Chọn dịch vụ'}
                            </h5>
                            <div className="service-scroll-container" ref={serviceScrollRef}>
                                <div className="d-flex gap-3 pb-3">
                                    {availableServices.length > 0 ? (
                                        availableServices.map(service => (
                                            <div
                                                key={service._id}
                                                className={`service-card text-center flex-shrink-0 ${formData.serviceId === service._id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, serviceId: service._id }));
                                                    setError('');
                                                }}
                                                style={{ width: '180px', cursor: 'pointer' }}
                                            >
                                                <img
                                                    src={`http://localhost:5000/api/images/${service.image}`}
                                                    alt={service.name}
                                                    className="rounded mb-2"
                                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                />
                                                <h6 className="mb-1">{service.name}</h6>
                                                <p className="text-danger fw-bold small mb-0">
                                                    {service.price.toLocaleString('vi-VN')}₫
                                                </p>
                                                {formData.serviceId === service._id && (
                                                    <div className="selected-check">✓</div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">Đang tải dịch vụ...</p>
                                    )}
                                </div>
                            </div>
                            {!formData.serviceId && <small className="text-danger">Vui lòng chọn một dịch vụ</small>}
                        </div>

                        {/* PHẦN BÁC SĨ */}
                        {currentCategoryId === '1' && (
                            <div className="mb-5">
                                <h5 className="text-danger fw-bold mb-3">Chọn bác sĩ</h5>
                                <div className="doctor-scroll-container" ref={doctorScrollRef}>
                                    <div className="d-flex gap-3 pb-3">
                                        {doctors.length > 0 ? (
                                            doctors.map(doctor => (
                                                <div
                                                    key={doctor._id}
                                                    className={`doctor-card text-center flex-shrink-0 ${formData.doctorId === doctor._id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, doctorId: doctor._id }));
                                                        setError('');
                                                    }}
                                                    style={{ width: '160px', cursor: 'pointer' }}
                                                >
                                                    <div className="position-relative">
                                                        <img
                                                            src={`http://localhost:5000/api/images/${doctor.image || 'default-doctor.jpg'}`}
                                                            alt={doctor.name}
                                                            className="rounded-circle mx-auto d-block mb-2"
                                                            style={{ width: '90px', height: '90px', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                                            onError={(e) => { e.target.src = 'http://localhost:5000/api/images/default-doctor.jpg'; }}
                                                        />
                                                        {formData.doctorId === doctor._id && (
                                                            <div className="selected-check-doctor">✓</div>
                                                        )}
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">{doctor.name}</h6>
                                                    <p className="text-muted small mb-1">{doctor.specialty}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted">Đang tải bác sĩ...</p>
                                        )}
                                    </div>
                                </div>
                                {!formData.doctorId && <small className="text-danger d-block">Vui lòng chọn bác sĩ</small>}
                            </div>
                        )}

                        {/* PHẦN THÚ CƯNG */}
                        <div className="mb-4">
                            <h5 className="fw-bold mb-3">Chọn thú cưng</h5>
                            {pets.length === 0 ? (
                                <div className="alert alert-warning text-center">
                                    Bạn chưa có thú cưng! <Link to="/mypets" className="text-decoration-underline">Thêm ngay</Link>
                                </div>
                            ) : (
                                <select
                                    name="petId"
                                    value={formData.petId}
                                    onChange={handleChange}
                                    className="form-select form-select-lg"
                                    required
                                >
                                    <option value="">-- Chọn thú cưng của bạn --</option>
                                    {pets.map(pet => (
                                        <option key={pet._id} value={pet._id}>
                                            {pet.name} - {pet.type} {pet.breed && `(${pet.breed})`}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="position-sticky bottom-0 bg-white pt-3 border-top" style={{ margin: '0 -1.5rem', padding: '1rem 1.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-danger btn-lg w-100 shadow-lg"
                                onClick={handleNextStep}
                                disabled={loading || !formData.serviceId || (currentCategoryId === '1' && !formData.doctorId) || !formData.petId}
                            >
                                {loading ? 'Đang tải...' : 'Tiếp tục →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* BƯỚC 2: CHỌN NGÀY GIỜ */}
                {step === 2 && (
                    <div>
                        <h4 className="mb-3">Chọn ngày giờ</h4>
                        {selectedServiceDetails && (
                            <p className="text-muted">Bạn đang đặt dịch vụ: <strong>{selectedServiceDetails.name}</strong></p>
                        )}

                        {selectedServiceDetails?.category === 3 ? (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Ngày nhận phòng</label>
                                    <DatePicker
                                        selected={formData.checkIn}
                                        onChange={(date) => handleDateChange(date, 'checkIn')}
                                        selectsStart
                                        startDate={formData.checkIn}
                                        endDate={formData.checkOut}
                                        minDate={getMinDate()}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày nhận phòng"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Ngày trả phòng</label>
                                    <DatePicker
                                        selected={formData.checkOut}
                                        onChange={(date) => handleDateChange(date, 'checkOut')}
                                        selectsEnd
                                        startDate={formData.checkIn}
                                        endDate={formData.checkOut}
                                        minDate={getMinCheckoutDate()}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày trả phòng"
                                        required
                                    />
                                </div>
                                {loading ? (
                                    <div className="text-center text-muted mb-3">Đang kiểm tra khả dụng...</div>
                                ) : (
                                    availability && (
                                        <div className={`alert ${availability.availableRooms > 0 ? 'alert-success' : 'alert-warning'} mb-3`}>
                                            Số phòng trống: {availability.availableRooms} / {availability.totalRooms}
                                        </div>
                                    )
                                )}
                            </>
                        ) : (
                            <>
                                <div className="d-flex flex-column flex-lg-row gap-4 justify-content-center align-items-start">
                                    <div className="mb-3 flex-grow-1">
                                        <label className="form-label">Ngày đặt hẹn</label>
                                        <DatePicker
                                            selected={formData.bookingDate}
                                            onChange={(date) => handleDateChange(date, 'bookingDate')}
                                            minDate={getMinDate()}
                                            dateFormat="dd/MM/yyyy"
                                            className="form-control"
                                            placeholderText="Chọn ngày đặt lịch"
                                            inline
                                            required
                                        />
                                    </div>
                                    <div className="mb-3 flex-grow-1">
                                        <label className="form-label">Chọn giờ</label>
                                        {formData.bookingDate ? (
                                            <TimeSlotPicker
                                                selectedDate={formData.bookingDate}
                                                selectedTime={formData.bookingTime}
                                                onSelectTime={handleTimeSelect}
                                                serviceId={formData.serviceId}
                                            />
                                        ) : (
                                            <div className="alert alert-info text-center py-4">Vui lòng chọn ngày để xem giờ khả dụng.</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="d-flex justify-content-between">
                            <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>
                                Quay lại
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleNextStep}
                                disabled={loading || (selectedServiceDetails?.category === 3 && (availability === null || availability.availableRooms <= 0))}
                            >
                                Tiếp tục
                            </button>
                        </div>
                    </div>
                )}

                {/* BƯỚC 3: VẬN CHUYỂN – DROPDOWN + GÓI TRƯỚC + ĐỊA CHỈ + BẢN ĐỒ */}
                {step === 3 && (
                    <div>
                        <h4 className="mb-4 text-center fw-bold text-primary">
                            Vận chuyển đưa/rước bé (tùy chọn)
                        </h4>

                        {/* DỊCH VỤ PHỤ – CHỈ HIỆN KHI LÀ KHÁCH SẠN (category 3) */}
                        {selectedServiceDetails?.category === 3 && subServices.length > 0 && (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4 bg-light">
                                    <h5 className="text-primary fw-bold mb-3">Dịch vụ phụ cho khách sạn (chọn thêm)</h5>
                                    <div className="row g-3">
                                        {subServices.map((sub) => (
                                            <div key={sub._id} className="col-12 col-md-6">
                                                <div className="form-check p-3 border rounded bg-white shadow-sm">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={sub._id}
                                                        id={`subservice-${sub._id}`}
                                                        checked={formData.subServiceIds.includes(sub._id)}
                                                        onChange={handleSubServiceChange}
                                                    />
                                                    <label className="form-check-label d-flex justify-content-between align-items-center" htmlFor={`subservice-${sub._id}`}>
                                                        <span className="fw-bold">{sub.name}</span>
                                                        <span className="text-danger fw-bold ms-3">{sub.price.toLocaleString('vi-VN')} ₫</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.subServiceIds.length > 0 && (
                                        <div className="alert alert-success mt-3 text-center">
                                            ✓ Đã chọn {formData.subServiceIds.length} dịch vụ phụ
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PHẦN CHỌN CÓ/KHÔNG CẦN VẬN CHUYỂN + LOẠI VẬN CHUYỂN BẰNG DROPDOWN */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body p-4">
                                <h5 className="mb-4 text-center">Bạn có muốn chúng tôi đưa/rước bé không?</h5>

                                <select
                                    className="form-select form-select-lg mb-3"
                                    value={formData.needsTransport ? (formData.transportType || '') : 'no'}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'no') {
                                            setFormData(prev => ({
                                                ...prev,
                                                needsTransport: false,
                                                transportType: null,
                                                homeAddress: '',
                                                selectedTransportServiceId: ''
                                            }));
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                needsTransport: true,
                                                transportType: value
                                            }));
                                        }
                                    }}
                                >
                                    <option value="no">Không cần, tôi tự mang bé đến</option>
                                    <option value="pickup">Chỉ ĐÓN bé tại nhà</option>
                                    <option value="return">Chỉ TRẢ bé về nhà</option>
                                    <option value="both">CẢ 2 CHIỀU (ĐÓN + TRẢ) – Tiết kiệm nhất!</option>
                                </select>

                                {/* HIỂN THỊ ICON ĐẸP KHI CHỌN CÓ VẬN CHUYỂN */}
                                {formData.needsTransport && (
                                    <div className="text-center mt-3">
                                        {formData.transportType === 'pickup' && <span className="fs-1 text-success">🚗 Đón bé</span>}
                                        {formData.transportType === 'return' && <span className="fs-1 text-danger">🚙 Trả bé</span>}
                                        {formData.transportType === 'both' && <span className="fs-1 text-primary">🚐 Khứ hồi (tiết kiệm!)</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* NẾU CẦN VẬN CHUYỂN → HIỂN THỊ GÓI + ĐỊA CHỈ + BẢN ĐỒ */}
                        {formData.needsTransport && (
                            <>
                                {/* 1. CHỌN GÓI VẬN CHUYỂN – ĐƯA LÊN TRÊN */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold fs-5">Chọn gói vận chuyển</label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={formData.selectedTransportServiceId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, selectedTransportServiceId: e.target.value }))}
                                        required
                                    >
                                        <option value="">-- Chọn gói vận chuyển --</option>
                                        {transportServices.map(s => (
                                            <option key={s._id} value={s._id}>
                                                {s.name} – {s.price.toLocaleString('vi-VN')} ₫/km
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* AUTOCOMPLETE SIÊU THÔNG MINH */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold fs-5">Địa chỉ nhà bạn</label>
                                    <GoongAutocomplete
                                        onPlaceSelect={(address) => {
                                            setFormData(prev => ({ ...prev, homeAddress: address }));
                                            setError('');
                                        }}
                                        placeholder="Gõ địa chỉ để gợi ý tự động..."
                                    />
                                    {formData.homeAddress && (
                                        <small className="text-success d-block mt-2">✓ Địa chỉ đã chọn: {formData.homeAddress}</small>
                                    )}
                                </div>

                                {/* BẢN ĐỒ – VẼ ĐƯỜNG XANH LÁ */}
                                <div className="mb-4 rounded-4 overflow-hidden shadow-lg" style={{ height: '380px' }}>
                                    <GoongMap
                                        pickup={formData.transportType.includes('pickup') ? formData.homeAddress : SHOP_ADDRESS}
                                        dropoff={formData.transportType.includes('pickup') ? SHOP_ADDRESS : formData.homeAddress}
                                    />
                                </div>

                                {/* KHOẢNG CÁCH */}
                                {distanceInfo && (
                                    <div className="alert alert-success text-center py-3 mb-4">
                                        <strong>Khoảng cách: {distanceInfo.distance}</strong> • Thời gian di chuyển: <strong>{distanceInfo.duration}</strong>
                                        {formData.transportType === 'both' && ' (khứ hồi)'}
                                    </div>
                                )}
                            </>
                        )}

                        {/* NÚT TIẾP TỤC */}
                        <div className="d-flex gap-3 mt-4">
                            <button type="button" className="btn btn-outline-secondary flex-fill py-3 fw-bold" onClick={handlePrevStep}>
                                Quay lại
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger flex-fill py-3 fw-bold fs-5 shadow-lg"
                                onClick={handleNextStep}
                                disabled={formData.needsTransport && (!formData.homeAddress.trim() || !formData.selectedTransportServiceId)}
                            >
                                Xem tổng tiền
                            </button>
                        </div>
                    </div>
                )}

                {/* BƯỚC 4: NHẬP GHI CHÚ Ở ĐÂY + HIỂN THỊ TRONG TÓM TẮT DỊCH VỤ CHÍNH */}
                {step === 4 && (
                    <div>
                        <h4 className="text-center mb-4 fw-bold text-primary">Xác nhận đơn hàng</h4>

                        {/* Ô NHẬP GHI CHÚ – NGAY ĐẦU STEP 4 */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <h5 className="text-success fw-bold mb-3">📝 Ghi chú thêm (tùy chọn)</h5>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Ví dụ: Bé sợ tiếng lạ, dị ứng phấn hoa, cần bế nhẹ nhàng..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* DỊCH VỤ CHÍNH – HIỂN THỊ GHI CHÚ Ở ĐÂY NẾU CÓ */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <h5 className="text-success fw-bold mb-3">Dịch vụ chính</h5>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                        <p className="mb-1 fw-bold">{selectedServiceDetails?.name || 'Đang tải...'}</p>
                                        
                                        {/* HIỂN THỊ GHI CHÚ NGAY DƯỚI TÊN DỊCH VỤ */}
                                        {formData.notes && (
                                            <p className="mb-2 text-muted fst-italic border-start border-success border-4 ps-3">
                                                "{formData.notes}"
                                            </p>
                                        )}

                                        {selectedServiceDetails?.category === 3 ? (
                                            <p className="text-muted small mb-0">
                                                Từ {formData.checkIn ? moment(formData.checkIn).format('DD/MM/YYYY') : 'N/A'} → {formData.checkOut ? moment(formData.checkOut).format('DD/MM/YYYY') : 'N/A'} 
                                                ({moment(formData.checkOut).diff(moment(formData.checkIn), 'days') || 1} ngày)
                                            </p>
                                        ) : (
                                            <p className="text-muted small mb-0">
                                                Ngày: {formData.bookingDate ? moment(formData.bookingDate).format('DD/MM/YYYY') : 'N/A'} 
                                                {formData.bookingTime && ` - Giờ: ${formData.bookingTime}`}
                                            </p>
                                        )}
                                        {currentCategoryId === '1' && formData.doctorId && doctors.length > 0 && (
                                            <p className="text-muted small mb-0">
                                                Bác sĩ: <strong>{doctors.find(d => d._id === formData.doctorId)?.name || 'Đang tải...'}</strong>
                                            </p>
                                        )}
                                        <p className="text-muted small mb-0">
                                            Thú cưng: <strong>{pets.find(p => p._id === formData.petId)?.name || 'N/A'}</strong>
                                        </p>
                                    </div>
                                    <div className="text-end">
                                        <p className="fw-bold text-danger fs-5">
                                            {selectedServiceDetails ? (
                                                selectedServiceDetails.category === 3 
                                                    ? (selectedServiceDetails.price * (moment(formData.checkOut).diff(moment(formData.checkIn), 'days') || 1)).toLocaleString('vi-VN')
                                                    : selectedServiceDetails.price.toLocaleString('vi-VN')
                                            ) : 0} ₫
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* DỊCH VỤ PHỤ */}
                    {subServices.length > 0 && formData.subServiceIds.length > 0 && (
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                        <h5 className="text-success fw-bold mb-3">Dịch vụ phụ đã chọn</h5>
                        {subServices
                            .filter(s => formData.subServiceIds.includes(s._id))
                            .map(sub => (
                            <div key={sub._id} className="d-flex justify-content-between mb-2">
                                <span>{sub.name}</span>
                                <span className="text-danger fw-bold">{sub.price.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            ))}
                        <div className="border-top pt-2 mt-2 text-end">
                            <strong>Tổng dịch vụ phụ: {
                            subServices
                                .filter(s => formData.subServiceIds.includes(s._id))
                                .reduce((sum, s) => sum + s.price, 0)
                                .toLocaleString('vi-VN')
                            } ₫</strong>
                        </div>
                        </div>
                    </div>
                    )}

                    {/* VẬN CHUYỂN – NẾU CÓ */}
                    {formData.needsTransport && distanceInfo && formData.selectedTransportServiceId && transportServices.length > 0 && (
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                        <h5 className="text-success fw-bold mb-3">
                            Vận chuyển {formData.transportType === 'both' ? 'khứ hồi' : formData.transportType === 'pickup' ? 'đón' : 'trả'}
                        </h5>
                        
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                            <span>Điểm đón:</span>
                            <span className="text-end">{formData.transportType.includes('pickup') ? formData.homeAddress : SHOP_ADDRESS}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                            <span>Điểm trả:</span>
                            <span className="text-end">{formData.transportType.includes('return') ? formData.homeAddress : SHOP_ADDRESS}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                            <span>Khoảng cách:</span>
                            <span>{distanceInfo.distance} • {distanceInfo.duration}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                            <span>Gói vận chuyển:</span>
                            <span>{transportServices.find(s => s._id === formData.selectedTransportServiceId)?.name || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="border-top pt-2 text-end">
                            <p className="mb-1">
                            <strong>Phí vận chuyển ({formData.transportType === 'both' ? '2 chiều' : '1 chiều'}):</strong>
                            </p>
                            <p className="text-danger fw-bold fs-5 mb-0">
                            {((transportServices.find(s => s._id === formData.selectedTransportServiceId)?.price || 0) * distanceInfo.distanceKm * (formData.transportType === 'both' ? 2 : 1)).toLocaleString('vi-VN')} ₫
                            </p>
                            {formData.transportType === 'both' && (
                            <small className="text-success d-block">Tiết kiệm với gói khứ hồi!</small>
                            )}
                        </div>
                        </div>
                    </div>
                    )}

                    {/* TỔNG TIỀN – NỔI BẬT NHẤT */}
                    <div className="card border-0 shadow-lg bg-white text-white">
                        <div className="card-body text-center py-4">
                            <h3 className="mb-2">TỔNG CỘNG</h3>
                            <h1 className="display-5 fw-bold mb-0">
                                {calculateTotal().toLocaleString('vi-VN')} ₫
                            </h1>
                        </div>
                    </div>

                    {/* NÚT HÀNH ĐỘNG */}
                    <div className="d-flex gap-3 mt-4">
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary flex-fill py-3 fw-bold" 
                        onClick={handlePrevStep}
                    >
                        Sửa lại
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-danger flex-fill py-3 fw-bold fs-5 shadow-lg" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'XÁC NHẬN ĐẶT LỊCH'}
                    </button>
                    </div>
                </div>
                )}
            </div>
        </Sidebar>
    );
};

export default BookingModal;