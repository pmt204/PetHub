import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PetServiceHistory.css';

const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('vi-VN', options).format(date);
};

const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const PetServiceHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); 

  useEffect(() => {
    if (!petId) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/pets/${petId}/service-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data.data || []);
      } catch (err) {
        console.error('Lỗi tải lịch sử:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [petId]);

  const filteredHistory = history.filter((item) => {
    const category = item.serviceId?.category;
    const catId = typeof category === 'object' ? category?._id : category;
    
    if (filterType === 'all') return true;
    if (filterType === 'medical') return Number(catId) === 1;
    if (filterType === 'spa') return Number(catId) === 2;
    if (filterType === 'hotel') return Number(catId) === 3;
    if (filterType === 'transport') return Number(catId) === 4;
    return true;
  });

  const getBreakdown = (booking) => {
      const category = booking.serviceId?.category;
      const catId = typeof category === 'object' ? category?._id : category;
      const unitPrice = booking.serviceId?.price || 0;
      
      let mainPrice = 0;
      let subServicesPrice = 0;
      let shipmentPrice = 0;
      
      const isShipmentMain = Number(catId) === 4;
      const isHotel = Number(catId) === 3;

      if (isShipmentMain) {
          const distance = booking.shipmentDetails?.distance || 0;
          mainPrice = Math.round(unitPrice * distance);
      } else {
          if (isHotel) {
              if (booking.checkIn && booking.checkOut) {
                  const diffTime = new Date(booking.checkOut) - new Date(booking.checkIn);
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  mainPrice = unitPrice * (days > 0 ? days : 1);
              } else {
                  mainPrice = unitPrice;
              }
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
      
      if (booking.shipmentDetails && booking.shipmentDetails.price) {
          shipmentPrice = booking.shipmentDetails.price;
          if(isShipmentMain) mainPrice = shipmentPrice;
      }

      return { isShipmentMain, isHotel, mainPrice, subServicesPrice, shipmentPrice };
  };

  if (loading) return <div className="status-message">Đang tải dữ liệu lịch sử...</div>;
  if (history.length === 0) return <div className="status-message">Chưa có lịch sử sử dụng dịch vụ.</div>;

  return (
    <div className="history-container">
      <div className="history-header">
        <span className="history-title">Lịch sử dịch vụ</span>
        <span className="history-count">Tổng: {history.length}</span>
      </div>

      <div className="filter-container">
        <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>Tất cả</button>
        <button className={`filter-btn ${filterType === 'medical' ? 'active' : ''}`} onClick={() => setFilterType('medical')}>Y tế</button>
        <button className={`filter-btn ${filterType === 'spa' ? 'active' : ''}`} onClick={() => setFilterType('spa')}>Spa</button>
        <button className={`filter-btn ${filterType === 'hotel' ? 'active' : ''}`} onClick={() => setFilterType('hotel')}>Khách sạn</button>
        <button className={`filter-btn ${filterType === 'transport' ? 'active' : ''}`} onClick={() => setFilterType('transport')}>Vận chuyển</button>
      </div>

      <div>
        {filteredHistory.length === 0 ? (
          <div className="empty-filter-message">Không tìm thấy đơn nào theo bộ lọc này.</div>
        ) : (
          filteredHistory.map((booking) => {
            const breakdown = getBreakdown(booking);
            const { isShipmentMain, isHotel, mainPrice, subServicesPrice, shipmentPrice } = breakdown;
            const category = booking.serviceId?.category;
            const catId = typeof category === 'object' ? category?._id : category;
            const isMedical = Number(catId) === 1;

            let serviceClass = 'service-name';
            if (isHotel) serviceClass += ' hotel';
            else if (isMedical) serviceClass += ' medical';
            else if (isShipmentMain) serviceClass += ' transport';

            return (
              <div key={booking._id} className="history-card">
                
                <div className="card-main-content">
                  <div className="card-top-row">
                    <div>
                      <h3 className={serviceClass}>{booking.serviceId?.name}</h3>
                      <div className="order-code">Mã đơn: {booking._id.slice(-6).toUpperCase()}</div>
                    </div>
                    <div className="status-badge">Hoàn thành</div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Thời gian thực hiện</label>
                      {isHotel ? (
                        <div>
                          <p>Nhận: {formatDate(booking.checkIn, false)}</p>
                          <p>Trả: {formatDate(booking.checkOut, false)}</p>
                        </div>
                      ) : (
                        <p>{formatDate(booking.bookingDate)}</p>
                      )}
                    </div>

                    <div className="detail-item">
                      {isShipmentMain || (booking.shipmentDetails && booking.shipmentDetails.distance > 0) ? (
                          <>
                           <label>Lộ trình vận chuyển</label>
                           {booking.shipmentDetails ? (
                             <div className="transport-route">
                               <div className="route-point">
                                 <span className="route-label">Đón</span>
                                 <span className="route-address text-truncate" title={booking.shipmentDetails.pickupAddress}>{booking.shipmentDetails.pickupAddress}</span>
                               </div>
                               <div className="route-point" style={{ marginTop: '6px' }}>
                                 <span className="route-label">Trả</span>
                                 <span className="route-address text-truncate" title={booking.shipmentDetails.dropoffAddress}>{booking.shipmentDetails.dropoffAddress}</span>
                               </div>
                               <div className="transport-info mt-1">
                                 Khoảng cách: {booking.shipmentDetails.distance} km
                               </div>
                             </div>
                           ) : <p>Chưa cập nhật lộ trình</p>}
                          </>
                      ) : isMedical ? (
                        <>
                           <label>Người thực hiện</label>
                           <p>{booking.doctorId ? `Bs. ${booking.doctorId.name}` : 'Chưa cập nhật'}</p>
                        </>
                      ) : (
                        <>
                           <label>Người thực hiện</label>
                           <p>Nhân viên PetHub</p>
                        </>
                      )}
                    </div>

                    {booking.notes && (
                      <div className="detail-item notes">
                        <label>Ghi chú</label>
                        <p className="note-content">"{booking.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-bill-section">
                  <div className="bill-label">Chi tiết thanh toán</div>
                  
                  <div className="bill-list">
                    <div className="bill-row main-service">
                      <span>{isShipmentMain ? 'Phí vận chuyển' : 'Dịch vụ chính'}</span>
                      <span>{formatPrice(mainPrice)}</span>
                    </div>

                    {booking.subServices && booking.subServices.map(sub => (
                      <div key={sub._id} className="bill-row sub-service">
                        <span>{sub.name}</span>
                        <span>{formatPrice(sub.price)}</span>
                      </div>
                    ))}
                    
                    {!isShipmentMain && shipmentPrice > 0 && (
                        <div className="bill-row sub-service">
                            <span>Phí đưa đón</span>
                            <span>{formatPrice(shipmentPrice)}</span>
                        </div>
                    )}
                  </div>

                  <div className="bill-divider"></div>

                  <div className="bill-total">
                    <span className="total-text">Thành tiền</span>
                    <span className="total-price">{formatPrice(booking.totalAmount)}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PetServiceHistory;