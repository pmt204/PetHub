import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const response = await fetch('http://localhost:5000/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Lỗi khi lấy danh sách khách hàng');

      const customersData = await response.json();

      const customersWithBookings = await Promise.all(
        customersData.map(async (customer) => {
          try {
            const bookingsResponse = await axios.get(
              `http://localhost:5000/api/customers/${customer._id}/bookings`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              }
            );
            const completedBookings = bookingsResponse.data.filter(
              (booking) => booking.status === 'completed'
            );
            return { ...customer, completedBookings };
          } catch (bookingError) {
            console.error(`Error fetching bookings for customer ${customer._id}:`, bookingError);
            return { ...customer, completedBookings: [] };
          }
        })
      );

      setCustomers(customersWithBookings);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5">Đang tải...</div>;

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Quản Lý Khách Hàng</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tên Khách Hàng</th>
            <th>Số Điện Thoại</th>
            <th>Thú Cưng</th>
            <th>Dịch Vụ Đã Sử Dụng</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr key={customer._id}>
              <td>{index + 1}</td>
              <td>{customer.name}</td>
              <td>{customer.phone}</td>
              <td>
                {customer.pets && customer.pets.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {customer.pets.map(pet => (
                      <li key={pet._id}>{`${pet.name} (${pet.type})`}</li>
                    ))}
                  </ul>
                ) : (
                  'Không có thú cưng'
                )}
              </td>
              <td>
                {customer.completedBookings && customer.completedBookings.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {customer.completedBookings.map(booking => (
                      <li key={booking._id}>
                        {booking.serviceId?.name || 'Dịch vụ không xác định'} (Thú cưng: {booking.petId?.name || 'Không xác định'})
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Không có dịch vụ đã sử dụng'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerManagement;