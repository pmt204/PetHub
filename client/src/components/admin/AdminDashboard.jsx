import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment'; // Cần cài đặt: npm install moment
import { 
  FaBoxOpen, FaNewspaper, FaClipboardList, FaUsers, FaMoneyBillWave, 
  FaFileExcel, FaCalendarAlt, FaSearch,
  FaTruck, FaPlusCircle, FaUser, FaInfoCircle
} from 'react-icons/fa'; 
import './AdminDashboard.css'; 

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalServices: 0,
    totalNews: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    revenueDetails: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` },
          params: { startDate, endDate }
        });
        
        const data = response.data || {};
        setStats({
          totalServices: data.totalServices || 0,
          totalNews: data.totalNews || 0,
          totalBookings: data.totalBookings || 0,
          totalCustomers: data.totalCustomers || 0,
          totalRevenue: data.totalRevenue || 0,
          // Đảm bảo revenueDetails là mảng các booking
          revenueDetails: Array.isArray(data.revenueDetails) ? data.revenueDetails : []
        });
        setError('');
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        setError('Không thể tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  // --- FORMAT TIỀN TỆ ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // --- XUẤT EXCEL CHI TIẾT ---
  const exportToExcel = () => {
    const dataToExport = stats.revenueDetails.map(booking => {
      // Xây dựng chuỗi diễn giải chi tiết cho Excel
      let details = `Dịch vụ: ${booking.serviceId?.name || 'Đã xóa'}`;
      
      // Thêm thông tin dịch vụ phụ
      if (booking.subServices && booking.subServices.length > 0) {
        const subNames = booking.subServices.map(s => `${s.name} (${s.price})`).join(', ');
        details += ` | Phụ phí: ${subNames}`;
      }
      
      // Thêm thông tin vận chuyển
      if (booking.shipmentDetails && booking.shipmentDetails.distance > 0) {
        details += ` | Vận chuyển: ${booking.shipmentDetails.distance}km`;
        if(booking.shipmentDetails.price) {
             details += ` (${booking.shipmentDetails.price})`;
        }
      }

      return {
        'Ngày giao dịch': moment(booking.bookingDate).format('DD/MM/YYYY HH:mm'),
        'Mã đơn': booking._id.slice(-6).toUpperCase(),
        'Khách hàng': booking.customerId?.name || 'Khách vãng lai',
        'SĐT': booking.customerId?.phone || '',
        'Diễn giải chi tiết': details,
        'Tổng thanh toán (VND)': booking.totalAmount || 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Chỉnh độ rộng cột Excel cho dễ nhìn
    ws['!cols'] = [
        { wch: 20 }, // Ngày
        { wch: 10 }, // Mã đơn
        { wch: 20 }, // Khách hàng
        { wch: 15 }, // SĐT
        { wch: 60 }, // Diễn giải (Rộng nhất)
        { wch: 15 }  // Tổng tiền
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doanh thu Chi tiết');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `BaoCao_DoanhThu_${moment().format('DDMMYYYY')}.xlsx`);
  };

  if (loading) return <div className="text-center p-5 mt-5"><h4>Đang tải dữ liệu Dashboard...</h4></div>;
  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger shadow-sm border-0">{error}</div>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <h2 className="dashboard-title">Dashboard Quản Trị</h2>

      {/* --- PHẦN 1: THỐNG KÊ TỔNG QUAN (CARDS) --- */}
      <div className="row g-4 mb-5">
        <div className="col-xl-3 col-md-6">
          <div className="card stat-card bg-gradient-primary">
            <div className="card-body">
              <div className="stat-label">Dịch Vụ</div>
              <div className="stat-value">{stats.totalServices}</div>
              <FaBoxOpen className="stat-icon" />
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6">
          <div className="card stat-card bg-gradient-success">
            <div className="card-body">
              <div className="stat-label">Tin Tức</div>
              <div className="stat-value">{stats.totalNews}</div>
              <FaNewspaper className="stat-icon" />
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card stat-card bg-gradient-warning">
            <div className="card-body">
              <div className="stat-label">Đơn Đặt</div>
              <div className="stat-value">{stats.totalBookings}</div>
              <FaClipboardList className="stat-icon" />
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card stat-card bg-gradient-info">
            <div className="card-body">
              <div className="stat-label">Khách Hàng</div>
              <div className="stat-value">{stats.totalCustomers}</div>
              <FaUsers className="stat-icon" />
            </div>
          </div>
        </div>

        {/* Card Tổng Doanh Thu */}
        <div className="col-12">
          <div className="card stat-card bg-gradient-purple">
            <div className="card-body d-flex align-items-center justify-content-between px-5">
              <div>
                <div className="stat-label mb-2">Tổng Doanh Thu Thực Tế</div>
                <div className="stat-value" style={{fontSize: '3rem'}}>
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
              <FaMoneyBillWave className="stat-icon" style={{opacity: 0.3, fontSize: '6rem', position: 'static', transform: 'none'}} />
            </div>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: BỘ LỌC & BẢNG CHI TIẾT --- */}
      <h4 className="mb-3 text-secondary fw-bold border-start border-4 border-success ps-3">
        Nhật Ký Doanh Thu Chi Tiết
      </h4>
      
      <div className="filter-toolbar">
        <div className="filter-group">
          <label><FaCalendarAlt className="me-2"/>Từ ngày:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control filter-input" />
        </div>
        <div className="filter-group">
          <label><FaCalendarAlt className="me-2"/>Đến ngày:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control filter-input" />
        </div>
        <div className="ms-auto"> 
          <button className="btn btn-export shadow-sm" onClick={exportToExcel}>
            <FaFileExcel /> Xuất Báo Cáo Excel
          </button>
        </div>
      </div>

      <div className="card table-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th style={{width: '5%'}}>#</th>
                  <th style={{width: '15%'}}>Ngày</th>
                  <th style={{width: '25%'}}>Khách Hàng</th>
                  <th style={{width: '40%'}}>Diễn Giải (Dịch vụ & Phụ phí)</th>
                  <th style={{width: '15%'}} className="text-end">Tổng Tiền</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(stats.revenueDetails) && stats.revenueDetails.length > 0 ? (
                  stats.revenueDetails.map((booking, index) => (
                    <tr key={index}>
                      <td className="text-muted fw-bold">{index + 1}</td>
                      
                      {/* Cột Ngày */}
                      <td>
                        <div className="fw-bold text-dark">{moment(booking.bookingDate).format('DD/MM/YYYY')}</div>
                        <div className="small text-muted">{moment(booking.bookingDate).format('HH:mm')}</div>
                        <div className="small text-muted fst-italic">#{booking._id.slice(-6).toUpperCase()}</div>
                      </td>

                      {/* Cột Khách Hàng */}
                      <td>
                        <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-2 text-secondary">
                                <FaUser size={12}/>
                            </div>
                            <div>
                                <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
                                    {booking.customerId?.name || 'Khách vãng lai'}
                                </div>
                                <div className="small text-muted" style={{fontSize: '0.8rem'}}>
                                    {booking.customerId?.phone || ''}
                                </div>
                            </div>
                        </div>
                      </td>

                      {/* Cột Diễn Giải (Chi tiết tiền) */}
                      <td>
                        {/* Dịch vụ chính */}
                        <div className="mb-1 fw-bold text-primary">
                            {booking.serviceId?.name || <span className="text-danger">Dịch vụ đã xóa</span>}
                        </div>

                        {/* Danh sách Dịch vụ phụ */}
                        {booking.subServices && booking.subServices.length > 0 && (
                            <div className="small text-secondary ps-3 border-start border-2 border-light mb-1">
                                {booking.subServices.map((sub, idx) => (
                                    <div key={idx} className="d-flex align-items-center">
                                        <FaPlusCircle className="me-1 text-success" style={{fontSize:'0.7rem'}}/> 
                                        {sub.name} <span className="text-muted ms-1">({formatCurrency(sub.price)})</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Vận chuyển */}
                        {booking.shipmentDetails && booking.shipmentDetails.distance > 0 && (
                            <div className="small text-info ps-3 border-start border-2 border-info bg-light rounded py-1 mt-1" style={{width: 'fit-content'}}>
                                <div className="d-flex align-items-center">
                                    <FaTruck className="me-1"/> 
                                    <span>Vận chuyển: {booking.shipmentDetails.distance} km</span>
                                    {/* Nếu có giá ship riêng */}
                                    {booking.shipmentDetails.price > 0 && (
                                        <span className="ms-1 fw-bold">({formatCurrency(booking.shipmentDetails.price)})</span>
                                    )}
                                </div>
                            </div>
                        )}
                      </td>

                      {/* Cột Tổng Tiền */}
                      <td className="text-end">
                          <span className="price-text fs-5">
                              {formatCurrency(booking.totalAmount)}
                          </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <FaSearch className="mb-2 fs-3 d-block mx-auto"/>
                      Không có giao dịch nào hoàn thành trong khoảng thời gian này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="shareModal" className="modal fade" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog"><div className="modal-content"></div></div>
      </div>
    </div>
  );
};

export default AdminDashboard;