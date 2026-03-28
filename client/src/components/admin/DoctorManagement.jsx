import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DoctorManagement.css";

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [servicesList, setServicesList] = useState([]); // [MỚI] Danh sách tất cả dịch vụ để chọn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null); 
  
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    experienceYears: 0,
    image: "",
    description: "",
    fullDescription: "",
    status: "active", // [MỚI] Mặc định là active
    services: [],     // [MỚI] Mảng chứa ID các dịch vụ được chọn
  });

  const getToken = () => {
    const userInfo = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (userInfo && userInfo.role === 'admin' && token) return token;
    return null;
  };
  
  // 1. Fetch Bác sĩ & Dịch vụ
  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API để lấy data
      const [doctorsRes, servicesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/doctors"),
        axios.get("http://localhost:5000/api/services") // Giả định bạn có API này lấy all services
      ]);

      setDoctors(doctorsRes.data);
      setServicesList(servicesRes.data);
      setError(null);
    } catch (err) {
      setError("Lỗi khi tải dữ liệu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý thay đổi Input thường
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // [MỚI] Xử lý chọn Dịch vụ (Checkbox)
  const handleServiceChange = (serviceId) => {
    setFormData((prev) => {
      const isSelected = prev.services.includes(serviceId);
      if (isSelected) {
        // Nếu đã chọn -> Bỏ chọn
        return { ...prev, services: prev.services.filter(id => id !== serviceId) };
      } else {
        // Nếu chưa chọn -> Thêm vào
        return { ...prev, services: [...prev.services, serviceId] };
      }
    });
  };

  // Mở modal (Thêm mới)
  const handleAdd = () => {
    setCurrentDoctor(null);
    setFormData({
      name: "",
      specialty: "",
      experienceYears: 0,
      image: "",
      description: "",
      fullDescription: "",
      status: "active",
      services: [],
    });
    setIsModalOpen(true);
  };

  // Mở modal (Chỉnh sửa)
  const handleEdit = (doctor) => {
    setCurrentDoctor(doctor);
    setFormData({
      ...doctor,
      // services trong doctor là mảng ID (do backend trả về), giữ nguyên để map vào checkbox
      services: doctor.services || [], 
      status: doctor.status || "active"
    });
    setIsModalOpen(true);
  };

  // Xử lý lưu
  const handleSave = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return alert("Không có quyền Admin!");
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    // Chuẩn hóa dữ liệu trước khi gửi
    const dataToSave = {
      ...formData,
      experienceYears: Number(formData.experienceYears),
      // services đã là mảng ID, không cần split nữa
    };

    try {
      if (currentDoctor) {
        await axios.put(`http://localhost:5000/api/admin/doctors/${currentDoctor._id}`, dataToSave, config);
      } else {
        await axios.post("http://localhost:5000/api/admin/doctors", dataToSave, config);
      }
      fetchData(); // Tải lại danh sách
      setIsModalOpen(false);
    } catch (err) {
      alert("Lỗi khi lưu: " + (err.response?.data?.message || err.message));
    }
  };

  // Xử lý xóa (Giữ nguyên)
  const handleDelete = (doctor) => {
    setCurrentDoctor(doctor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const token = getToken();
    if (!token) return alert("Không có quyền Admin!");
    try {
      await axios.delete(`http://localhost:5000/api/admin/doctors/${currentDoctor._id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      setIsDeleteModalOpen(false);
      setCurrentDoctor(null);
    } catch (err) {
      alert("Lỗi xóa: " + err.message);
    }
  };

  if (loading) return <div className="dm-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="dm-error">{error}</div>;

  return (
    <div className="doctor-management">
      <div className="dm-header">
        <h1>Quản lý Bác sĩ</h1>
        <button onClick={handleAdd} className="dm-btn-add">
          + Thêm Bác sĩ
        </button>
      </div>

      <div className="dm-table-wrapper">
        <table className="dm-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Chuyên khoa</th>
              <th>Trạng thái</th> {/* [MỚI] Cột trạng thái */}
              <th>Dịch vụ</th>    {/* [MỚI] Cột dịch vụ */}
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc._id}>
                <td>
                  <img
                    src={`http://localhost:5000/api/images/${doc.image}`}
                    alt={doc.name}
                    className="doctor-image"
                    onError={(e) => { e.target.src = 'https://placehold.co/40x40?text=Img'; }}
                  />
                </td>
                <td>
                    <div className="fw-bold">{doc.name}</div>
                    <small className="text-muted">{doc.experienceYears} năm KN</small>
                </td>
                <td>{doc.specialty}</td>
                
                {/* [MỚI] Hiển thị Status */}
                <td>
                    <span className={`status-badge ${doc.status === 'busy' ? 'status-busy' : 'status-active'}`}>
                        {doc.status === 'busy' ? 'Bận' : 'Hoạt động'}
                    </span>
                </td>

                {/* [MỚI] Hiển thị số lượng dịch vụ */}
                <td>
                    <span className="service-count badge bg-info">
                        {doc.services?.length || 0} dịch vụ
                    </span>
                </td>

                <td className="dm-actions">
                  <button onClick={() => handleEdit(doc)} className="dm-btn-edit">Sửa</button>
                  <button onClick={() => handleDelete(doc)} className="dm-btn-delete">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="dm-modal-overlay">
          <div className="dm-modal-content" style={{maxWidth: '800px'}}>
            <div className="dm-modal-header">
              <h2>{currentDoctor ? "Chỉnh sửa Hồ sơ" : "Thêm Bác sĩ mới"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="dm-modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="dm-form-grid">
              {/* Cột Trái: Thông tin cơ bản */}
              <div className="dm-col">
                  <div className="dm-form-group">
                    <label>Tên Bác sĩ</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="dm-form-group">
                    <label>Chuyên khoa</label>
                    <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} required />
                  </div>
                  
                  {/* [MỚI] Chọn Trạng thái */}
                  <div className="dm-form-group">
                    <label>Trạng thái làm việc</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="dm-select">
                        <option value="active">🟢 Hoạt động (Active)</option>
                        <option value="busy">🔴 Bận (Busy)</option>
                    </select>
                  </div>

                  <div className="dm-form-group">
                    <label>Kinh nghiệm (năm)</label>
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} required min="0" />
                  </div>
                  <div className="dm-form-group">
                    <label>Ảnh đại diện (URL)</label>
                    <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="/images/..." required />
                  </div>
              </div>

              {/* Cột Phải: Dịch vụ & Mô tả */}
              <div className="dm-col">
                  {/* [MỚI] Chọn Dịch vụ bằng Checkbox */}
                  <div className="dm-form-group">
                    <label>Dịch vụ đảm nhận</label>
                    <div className="services-checkbox-list">
                        {servicesList.length > 0 ? (
                            servicesList.map(service => (
                                <label key={service._id} className="service-item">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.services.includes(service._id)}
                                        onChange={() => handleServiceChange(service._id)}
                                    />
                                    <span className="service-name">{service.name}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-muted small">Không có dịch vụ nào.</p>
                        )}
                    </div>
                    <small className="text-muted">Đã chọn: {formData.services.length}</small>
                  </div>

                  <div className="dm-form-group">
                    <label>Mô tả ngắn</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="2"></textarea>
                  </div>
                  <div className="dm-form-group">
                    <label>Chi tiết</label>
                    <textarea name="fullDescription" value={formData.fullDescription} onChange={handleChange} rows="3"></textarea>
                  </div>
              </div>

              <div className="dm-form-actions full-width">
                <button type="button" onClick={() => setIsModalOpen(false)} className="dm-btn-cancel">Hủy</button>
                <button type="submit" className="dm-btn-save">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa (Giữ nguyên) */}
      {isDeleteModalOpen && (
        <div className="dm-modal-overlay">
          <div className="dm-modal-content dm-delete-confirm">
            <h2>Xác nhận Xóa</h2>
            <p>Bạn có chắc muốn xóa bác sĩ <strong>{currentDoctor?.name}</strong>?</p>
            <div className="dm-form-actions">
              <button onClick={() => setIsDeleteModalOpen(false)} className="dm-btn-cancel">Hủy</button>
              <button onClick={confirmDelete} className="dm-btn-delete">Xóa luôn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;