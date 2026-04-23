import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CustomerDetail = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerAndBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

        const customerResponse = await axios.get(`http://localhost:5000/api/customers/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setCustomer(customerResponse.data);

        const bookingsResponse = await axios.get(`http://localhost:5000/api/customers/${id}/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const completed = bookingsResponse.data.filter(booking => booking.status === 'completed');
        setCompletedBookings(completed);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching customer detail:', error);
        setError(error.message || 'Không thể tải thông tin khách hàng');
        setLoading(false);
      }
    };

    fetchCustomerAndBookings();
  }, [id]);

  if (loading) return <div className="text-center py-5">Đang tải...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;
  if (!customer) return <div className="text-center py-5">Không tìm thấy khách hàng</div>;

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Chi Tiết Khách Hàng</h2>
      <p><strong>Tên:</strong> {customer.name}</p>
      <p><strong>Số Điện Thoại:</strong> {customer.phone}</p>
      <h4 className="mt-4">Thú Cưng</h4>
      {customer.pets && customer.pets.length > 0 ? (
        <ul>
          {customer.pets.map(pet => (
            <li key={pet._id}>{`${pet.name} (${pet.type})`}</li>
          ))}
        </ul>
      ) : (
        <p>Không có thú cưng</p>
      )}
      <h4 className="mt-4">Dịch Vụ Đã Sử Dụng</h4>
      {completedBookings.length > 0 ? (
        <ul>
          {completedBookings.map(booking => (
            <li key={booking._id}>
              {booking.serviceId?.name || 'Dịch vụ không xác định'} (Thú cưng: {booking.petId?.name || 'Không xác định'})
            </li>
          ))}
        </ul>
      ) : (
        <p>Dịch Vụ Đã Sử Dụng</p>
      )}
      <div className="text-center mt-4">
        <Link to="/customers" className="btn btn-secondary">
          Quay Lại
        </Link>
      </div>
    </div>
  );
};

export default CustomerDetail;