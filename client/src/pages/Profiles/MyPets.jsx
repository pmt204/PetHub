import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MyPets.css'; // Import file CSS

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [newPet, setNewPet] = useState({ name: '', type: 'cat', ageRange: 'under_2_months' });
  const [editPet, setEditPet] = useState(null);
  const [showAddForm, setAddForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/pets', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setPets(res.data))
      .catch(err => console.error('Lỗi tải danh sách thú cưng:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editPet) {
      setEditPet(prev => ({ ...prev, [name]: value }));
    } else {
      setNewPet(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddPet = () => {
    if (!newPet.name.trim()) return alert("Vui lòng nhập tên thú cưng");
    
    const token = localStorage.getItem('token');
    axios.post('http://localhost:5000/api/pets', newPet, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setPets([...pets, res.data]);
        setNewPet({ name: '', type: 'cat', ageRange: 'under_2_months' });
        setAddForm(false);
        alert('Đã thêm thú cưng thành công!');
      })
      .catch(err => console.error(err));
  };

  const handleSaveEdit = () => {
    const token = localStorage.getItem('token');
    axios.put(`http://localhost:5000/api/pets/${editPet._id}`, editPet, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setPets(pets.map(p => p._id === editPet._id ? res.data : p));
        setEditPet(null);
        alert('Cập nhật thành công!');
      })
      .catch(err => console.error(err));
  };

  const handleDeletePet = (petId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bé này không?')) return;
    const token = localStorage.getItem('token');
    axios.delete(`http://localhost:5000/api/pets/${petId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setPets(pets.filter(p => p._id !== petId));
      })
      .catch(err => console.error(err));
  };

  const formatAgeRange = (ageRange) => {
    const map = {
      under_2_months: 'Dưới 2 tháng',
      '2_to_6_months': '2-6 tháng',
      '6_to_12_months': '6-12 tháng',
      '1_to_7_years': '1-7 tuổi',
      over_7_years: 'Trên 7 tuổi'
    };
    return map[ageRange] || ageRange;
  };

  const getPetIcon = (type) => {
    switch (type) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      default: return '🐾';
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF7F1', minHeight: '100vh', paddingBottom: '60px' }}>
        <div className="container py-5" style={{ maxWidth: '1000px' }}>
        
        {/* --- HEADER --- */}
        <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
            <div>
            <h2 className="fw-bold mb-0" style={{ fontFamily: 'Quicksand, sans-serif', color: '#333' }}>
                Thú Cưng Của Tôi
            </h2>
            <p className="text-muted mb-0">Quản lý hồ sơ các bé yêu của bạn</p>
            </div>
            
            {/* Nút Thêm Mới: Màu ĐỎ ĐÔ (btn-red-primary) */}
            <button
            className={`btn btn-rounded px-4 py-2 ${showAddForm ? 'btn-secondary' : 'btn-red-primary'}`}
            onClick={() => setAddForm(!showAddForm)}
            >
            <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
            {showAddForm ? 'Đóng' : 'Thêm Thú Cưng Mới'}
            </button>
        </div>

        {/* --- FORM THÊM THÚ CƯNG --- */}
        {showAddForm && (
            <div className="card shadow border-0 mb-5 form-card animate__animated animate__fadeIn">
            <div className="card-body p-4">
                <h5 className="card-title mb-4 fw-bold" style={{ color: '#8B0000' }}>Thông tin thú cưng mới</h5>
                <div className="row g-3">
                <div className="col-md-4">
                    <div className="form-floating">
                    <input
                        type="text"
                        className="form-control"
                        id="petName"
                        placeholder="Tên thú cưng"
                        name="name"
                        value={newPet.name}
                        onChange={handleChange}
                    />
                    <label htmlFor="petName">Tên thú cưng</label>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-floating">
                    <select className="form-select" id="petType" name="type" value={newPet.type} onChange={handleChange}>
                        <option value="cat">Mèo 🐱</option>
                        <option value="dog">Chó 🐶</option>
                        <option value="other">Khác 🐾</option>
                    </select>
                    <label htmlFor="petType">Loại</label>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-floating">
                    <select className="form-select" id="petAge" name="ageRange" value={newPet.ageRange} onChange={handleChange}>
                        <option value="under_2_months">Dưới 2 tháng</option>
                        <option value="2_to_6_months">2-6 tháng</option>
                        <option value="6_to_12_months">6-12 tháng</option>
                        <option value="1_to_7_years">1-7 tuổi</option>
                        <option value="over_7_years">Trên 7 tuổi</option>
                    </select>
                    <label htmlFor="petAge">Độ tuổi</label>
                    </div>
                </div>
                <div className="col-12 text-end mt-3">
                    {/* Nút Lưu: Màu ĐỎ ĐÔ (btn-red-primary) */}
                    <button 
                        className="btn px-5 py-2 btn-rounded btn-red-primary" 
                        onClick={handleAddPet}
                    >
                    Lưu Hồ Sơ
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}

        {/* --- DANH SÁCH THÚ CƯNG --- */}
        <div className="row g-4">
            {pets.length === 0 ? (
            <div className="col-12">
                <div className="text-center py-5 bg-white rounded shadow-sm">
                <div style={{ fontSize: '4rem' }}>🏡</div>
                <h5 className="mt-3 text-muted">Bạn chưa thêm thú cưng nào</h5>
                <p className="text-muted">Hãy nhấn nút "Thêm Thú Cưng Mới" để bắt đầu nhé!</p>
                </div>
            </div>
            ) : (
            pets.map(pet => (
                <div key={pet._id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm pet-card position-relative">
                    <div className="card-body p-4 text-center">
                    
                    {/* Icon đại diện */}
                    <div className="pet-icon-wrapper shadow-sm">
                        {getPetIcon(pet.type)}
                    </div>

                    {/* Chế độ Sửa */}
                    {editPet?._id === pet._id ? (
                        <div className="mt-3 text-start">
                        <div className="mb-2">
                            <label className="form-label small text-muted">Tên</label>
                            <input className="form-control form-control-sm" name="name" value={editPet.name} onChange={handleChange} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small text-muted">Loại</label>
                            <select className="form-select form-select-sm" name="type" value={editPet.type} onChange={handleChange}>
                            <option value="cat">Mèo</option>
                            <option value="dog">Chó</option>
                            <option value="other">Khác</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Tuổi</label>
                            <select className="form-select form-select-sm" name="ageRange" value={editPet.ageRange} onChange={handleChange}>
                            <option value="under_2_months">Dưới 2 tháng</option>
                            <option value="2_to_6_months">2-6 tháng</option>
                            <option value="6_to_12_months">6-12 tháng</option>
                            <option value="1_to_7_years">1-7 tuổi</option>
                            <option value="over_7_years">Trên 7 tuổi</option>
                            </select>
                        </div>
                        <div className="d-flex gap-2 justify-content-center">
                            {/* Nút Lưu khi sửa: Giữ màu xanh lá (Success) để phân biệt */}
                            <button className="btn btn-success btn-sm flex-grow-1" onClick={handleSaveEdit}>Lưu</button>
                            <button className="btn btn-secondary btn-sm flex-grow-1" onClick={() => setEditPet(null)}>Hủy</button>
                        </div>
                        </div>
                    ) : (
                        /* Chế độ Xem */
                        <>
                        <h4 className="card-title fw-bold mb-1" style={{ color: '#333' }}>{pet.name}</h4>
                        <p className="text-muted mb-1 small text-uppercase fw-bold" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>
                            {pet.type === 'cat' ? 'Mèo' : pet.type === 'dog' ? 'Chó' : 'Khác'}
                        </p>
                        <span className="badge bg-light text-dark border mb-4 px-3 py-2 rounded-pill">
                            {formatAgeRange(pet.ageRange)}
                        </span>

                        <div className="d-grid gap-2">
                            {/* Nút Xem hồ sơ: OUTLINE ĐỎ ĐÔ (btn-outline-red) */}
                            <Link
                            to={`/pet-profile/${pet._id}`}
                            className="btn btn-outline-red btn-rounded"
                            >
                            Xem hồ sơ sức khỏe
                            </Link>
                            
                            <div className="d-flex gap-2">
                            {/* Nút Sửa: Giữ nguyên màu Vàng (Warning) */}
                            <button
                                className="btn btn-white text-black flex-grow-1 btn-sm btn-rounded"
                                onClick={() => setEditPet(pet)}
                                title="Chỉnh sửa thông tin"
                            >
                                <i className="bi bi-pencil-square me-1"></i> Sửa
                            </button>
                            {/* Nút Xóa: Giữ nguyên màu Đỏ tươi (Danger) */}
                            <button
                                className="btn btn-white text-black flex-grow-1 btn-sm btn-rounded"
                                onClick={() => handleDeletePet(pet._id)}
                                title="Xóa thú cưng"
                            >
                                <i className="bi bi-trash me-1"></i> Xóa
                            </button>
                            </div>
                        </div>
                        </>
                    )}
                    </div>
                </div>
                </div>
            ))
            )}
        </div>
        </div>
    </div>
  );
};

export default MyPets;