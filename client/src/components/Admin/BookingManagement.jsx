import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FaEye, FaTruck, FaUserMd, FaMapMarkerAlt, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';
import './BookingManagement.css'; 

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [currentTab, setCurrentTab] = useState('pending'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Vui lòng đăng nhập Admin');

      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(sorted);
      filterData(sorted, currentTab);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu đơn hàng');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterData(bookings, currentTab);
  }, [currentTab, bookings]);

  const filterData = (data, status) => {
    setFilteredBookings(data.filter(b => b.status === status));
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    console.log(`Updating booking ${bookingId} to ${newStatus}`);
    
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái sang "${newStatus}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(`Cập nhật trạng thái thành công!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchBookings();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái. Vui lòng kiểm tra console.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const renderServiceDetails = (booking) => {
    const category = booking.serviceId?.category;
    const catId = typeof category === 'object' ? category._id : String(category);
    const isShipmentMain = catId === '4';
    const hasShipment = booking.shipmentDetails && booking.shipmentDetails.distance > 0;

    return (
      <div>
        <div className="fw-bold text-primary d-flex align-items-center">
          {booking.serviceId?.name}
          {booking.subServices && booking.subServices.length > 0 && (
            <div className="tooltip-container">
              <FaEye className="tooltip-icon" />
              <div className="tooltip-content">
                <div className="fw-bold mb-1 border-bottom pb-1">Dịch vụ thêm:</div>
                {booking.subServices.map((sub, idx) => (
                  <div key={idx}>+ {sub.name} ({formatCurrency(sub.price)})</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="small text-muted mt-1">
          {catId === '3' && booking.checkIn && (
            <div>
              <div>In: {moment(booking.checkIn).format('DD/MM/YYYY')}</div>
              <div>Out: {moment(booking.checkOut).format('DD/MM/YYYY')}</div>
            </div>
          )}

          {(isShipmentMain || hasShipment) && booking.shipmentDetails && (
            <div className="mt-1">
              <div className="d-flex align-items-center text-info">
                <FaTruck className="me-1"/> 
                <span>{booking.shipmentDetails.distance} km</span>
                <div className="tooltip-container ms-1">
                  <FaMapMarkerAlt className="tooltip-icon" style={{color: '#0dcaf0'}}/>
                  <div className="tooltip-content" style={{width: '300px'}}>
                    <div><strong>Đón:</strong> {booking.shipmentDetails.pickupAddress}</div>
                    <div className="my-1 text-center">↓</div>
                    <div><strong>Trả:</strong> {booking.shipmentDetails.dropoffAddress}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {booking.doctorId && (
            <div className="text-success"><FaUserMd className="me-1"/>{booking.doctorId.name}</div>
          )}
          
          {catId !== '3' && !isShipmentMain && (
             <div>Hẹn: {moment(booking.bookingDate).format('HH:mm - DD/MM/YYYY')}</div>
          )}
           {isShipmentMain && (
             <div>Ngày đi: {moment(booking.bookingDate).format('HH:mm - DD/MM/YYYY')}</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center p-5">Đang tải dữ liệu quản trị...</div>;

  return (
    <div className="admin-booking-container">
      <h2 className="mb-4 fw-bold text-dark border-start border-5 border-primary ps-3">Quản Lý Đơn Đặt Dịch Vụ</h2>

      {successMsg && <div className="alert alert-success shadow-sm">{successMsg}</div>}
      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      <div className="status-tabs">
        <button 
          className={`tab-btn ${currentTab === 'pending' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('pending')}>
          Chờ xử lý ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${currentTab === 'active' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('active')}>
          Đang thực hiện ({bookings.filter(b => b.status === 'active').length})
        </button>
        <button 
          className={`tab-btn ${currentTab === 'completed' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('completed')}>
          Hoàn thành ({bookings.filter(b => b.status === 'completed').length})
        </button>
        <button 
          className={`tab-btn ${currentTab === 'canceled' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('canceled')}>
          Đã hủy ({bookings.filter(b => b.status === 'canceled').length})
        </button>
      </div>

      <div className="card admin-card">
        <div className="table-responsive">
          <table className="table table-hover admin-table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách Hàng</th>
                <th>Thú Cưng</th>
                <th>Thông Tin Dịch Vụ</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">Không có đơn hàng nào trong mục này.</td></tr>
              ) : (
                filteredBookings.map((booking, index) => (
                  <tr key={booking._id}>
                    <td>{index + 1}</td>
                    
                    <td className="customer-info">
                      <span className="fw-bold">{booking.customerId?.name || 'N/A'}</span>
                      <small>{booking.customerId?.phone || '---'}</small>
                    </td>

                    <td>
                      <span className="badge bg-light text-dark border">
                        {booking.petId?.name} ({booking.petId?.type === 'cat' ? 'Mèo' : 'Chó'})
                      </span>
                    </td>

                    <td>{renderServiceDetails(booking)}</td>

                    <td className="fw-bold text-danger">
                      {formatCurrency(booking.totalAmount)}
                    </td>

                    <td>
                      {booking.paymentStatus === 'success' ? (
                        <span className="badge bg-success"><FaMoneyBillWave className="me-1"/>Đã TT</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Chưa TT</span>
                      )}
                      <div className="small text-muted mt-1 text-uppercase">{booking.paymentMethod}</div>
                    </td>

                    <td>
                      {booking.status === 'pending' && <span className="badge bg-warning text-dark">Chờ xử lý</span>}
                      {booking.status === 'active' && <span className="badge bg-primary">Đang thực hiện</span>}
                      {booking.status === 'completed' && <span className="badge bg-success">Hoàn thành</span>}
                      {booking.status === 'canceled' && <span className="badge bg-danger">Đã hủy</span>}
                    </td>

                    <td>
                      <div className="d-flex flex-column gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleUpdateStatus(booking._id, 'active')}
                            >
                              Xác nhận đơn
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleUpdateStatus(booking._id, 'canceled')}
                            >
                              Hủy đơn
                            </button>
                          </>
                        )}

                        {booking.status === 'active' && (
                          <>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleUpdateStatus(booking._id, 'completed')}
                            >
                              Hoàn thành
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleUpdateStatus(booking._id, 'canceled')}
                            >
                              Hủy đơn
                            </button>
                          </>
                        )}
                        
                        {(booking.status === 'completed' || booking.status === 'canceled') && (
                           <span className="text-muted small fst-italic">Đã đóng</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;