import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import './TimeSlotPicker.css';

const TimeSlotPicker = ({ selectedDate, selectedTime, onSelectTime, serviceId, doctorId }) => {
    const [availableTimes, setAvailableTimes] = useState([]); 
    const [loading, setLoading] = useState(false);
    
    const allTimeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00'
    ];

    useEffect(() => {
        const fetchAvailableTimes = async () => {
            if (!selectedDate || !serviceId) return;

            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
                
                const response = await axios.get(
                    `http://localhost:5000/api/bookings/available-times/${serviceId}`,
                    {
                        params: { 
                            date: formattedDate,
                            doctorId: doctorId 
                        },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setAvailableTimes(response.data.availableTimes || []);
            } catch (err) {
                console.error('Error fetching available times:', err);
                setAvailableTimes([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchAvailableTimes();
    }, [selectedDate, serviceId, doctorId]); 

    const handleTimeSelect = (time) => {
        onSelectTime(time);
    };

    const isTimeDisabled = (time) => {
        if (!selectedDate) return true;

        const now = moment();
        const [hours, minutes] = time.split(':').map(Number);
        const slotDateTime = moment(selectedDate).hour(hours).minute(minutes);
        
        if (moment(selectedDate).isSame(now, 'day') && slotDateTime.isBefore(now)) {
            return true;
        }

        
        return !availableTimes.includes(time);
    };

    if (loading) {
        return <div className="text-center text-muted py-4">Đang kiểm tra lịch...</div>;
    }

    return (
        <div className="time-slot-picker-container">
            {allTimeSlots.map((time, index) => {
                const isSelected = selectedTime === time;
                const isDisabled = isTimeDisabled(time);

                return (
                    <button
                        key={index}
                        type="button"
                        className={`time-slot-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && handleTimeSelect(time)}
                        disabled={isDisabled}
                        title={isDisabled ? "Giờ này đã qua hoặc đã có người đặt" : "Chọn giờ này"}
                    >
                        {time}
                    </button>
                );
            })}
            
            <div className="d-flex justify-content-center gap-3 mt-3 small text-muted">
                <div className="d-flex align-items-center">
                    <span className="d-inline-block border border-secondary bg-white rounded me-1" style={{width: 12, height: 12}}></span>
                    Trống
                </div>
                <div className="d-flex align-items-center">
                    <span className="d-inline-block bg-secondary opacity-25 rounded me-1" style={{width: 12, height: 12}}></span>
                    Đã đặt / Quá hạn
                </div>
                <div className="d-flex align-items-center">
                    <span className="d-inline-block bg-danger rounded me-1" style={{width: 12, height: 12}}></span>
                    Đang chọn
                </div>
            </div>
        </div>
    );
};

export default TimeSlotPicker;