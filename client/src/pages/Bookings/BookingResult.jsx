import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'react-feather';
import './BookingResult.css';

const BookingResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { success = true, message = '', bookingId = null } = location.state || {};

  return (
    <div className="booking-result-fullpage">
      <div className="result-container">
        <div className="icon-wrapper">
          {success ? (
            <CheckCircle size={120} className="text-success animate-bounce" />
          ) : (
            <XCircle size={120} className="text-danger animate-bounce" />
          )}
        </div>

        <h1 className={`title ${success ? 'text-success' : 'text-danger'}`}>
          {success ? 'Đặt lịch thành công!' : 'Đặt lịch thất bại'}
        </h1>

        <div className="message-box">
          <p className="message">
            {message || (success 
              ? 'Đơn hàng của bạn đã được ghi nhận thành công. Cảm ơn bạn đã tin tưởng dịch vụ của PetHub ❤️'
              : 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
            )}
          </p>
          
          {success && bookingId && (
            <div className="booking-id">
              Mã đơn hàng: <strong className="text-primary">#{bookingId.slice(-8).toUpperCase()}</strong>
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            onClick={() => navigate('/services')}
            className="btn btn-outline-primary btn-lg"
          >
            Tiếp tục đặt lịch
          </button>

          <button
            onClick={() => navigate('/mybookings')}
            className="btn btn-danger btn-lg"
          >
            Xem đơn hàng của tôi
          </button>
        </div>     
      </div>
    </div>
  );
};

export default BookingResult;