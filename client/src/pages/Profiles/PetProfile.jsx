import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PetServiceHistory from '../../components/PetProfile/PetServiceHistory';
import './PetProfile.css'; // Import file CSS

const PetProfile = () => {
  const { petId } = useParams();
  const [petInfo, setPetInfo] = useState(null);

  useEffect(() => {
    const fetchPetInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/pets/${petId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPetInfo(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin pet:", err);
      }
    };
    fetchPetInfo();
  }, [petId]);

  return (
    <div className="pet-profile-container">
      {/* HEADER: Tên Pet & Nút Quay lại */}
      <div className="profile-header">
        <div className="profile-title">
          <h1>{petInfo ? `Hồ sơ: ${petInfo.name}` : 'Đang tải...'}</h1>
          <div className="profile-subtitle">
            {petInfo ? `${petInfo.type} • ID: ${petInfo._id}` : '...'}
          </div>
        </div>

        <Link to="/mypets" className="btn-back">
          Quay lại danh sách
        </Link>
      </div>

      {/* COMPONENT LỊCH SỬ */}
      <PetServiceHistory petId={petId} />
    </div>
  );
};

export default PetProfile;