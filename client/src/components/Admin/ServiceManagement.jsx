import React, { useState, useEffect } from 'react';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', price: '', description: '', image: '', category: '', totalRooms: '' });
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [categoryServices, setCategoryServices] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchCategoryServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const response = await fetch('http://localhost:5000/api/services', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Lỗi khi lấy danh sách dịch vụ');

      const data = await response.json();
      setServices(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message);
    }
  };

  const fetchCategoryServices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const response = await fetch('http://localhost:5000/api/categoryservices', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Lỗi khi lấy danh sách danh mục');

      const data = await response.json();
      setCategoryServices(data);
    } catch (error) {
      console.error('Error fetching category services:', error);
      setError(error.message);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categoryServices.find(cat => cat._id === parseInt(categoryId));
    return category ? category.name : 'Không xác định';
  };

  const handleImageUpload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/api/services/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi upload ảnh');
      }

      const data = await response.json();
      return data.image; 
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = newService.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const serviceData = {
        name: newService.name,
        description: newService.description,
        image: imageName,
        price: parseFloat(newService.price),
        category: parseInt(newService.category),
      };
      if (newService.category === '3') {
        serviceData.totalRooms = parseInt(newService.totalRooms) || 0;
      }

      const response = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Add service response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi thêm dịch vụ');
      }

      const data = await response.json();
      setSuccess('Thêm dịch vụ thành công!');
      setShowModal(false);
      setNewService({ name: '', price: '', description: '', image: '', category: '', totalRooms: '' });
      setImageFile(null);
      fetchServices();
      setError(null);
    } catch (error) {
      console.error('Error adding service:', error);
      setError(error.message);
      setSuccess(null);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService?._id) throw new Error('ID dịch vụ không hợp lệ');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = editingService.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const serviceData = {
        name: newService.name,
        description: newService.description,
        image: imageName,
        price: parseFloat(newService.price),
        category: parseInt(newService.category),
      };
      if (newService.category === '3') {
        serviceData.totalRooms = parseInt(newService.totalRooms) || 0;
      }

      const response = await fetch(`http://localhost:5000/api/services/${editingService._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update service response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi cập nhật dịch vụ');
      }

      const data = await response.json();
      setSuccess('Cập nhật dịch vụ thành công!');
      setShowModal(false);
      setNewService({ name: '', price: '', description: '', image: '', category: '', totalRooms: '' });
      setImageFile(null);
      setEditingService(null);
      fetchServices();
      setError(null);
    } catch (error) {
      console.error('Error updating service:', error);
      setError(error.message);
      setSuccess(null);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');
      const response = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete service response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi xóa dịch vụ');
      }
      setSuccess('Xóa dịch vụ thành công!');
      fetchServices();
      setError(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      setError(error.message);
      setSuccess(null);
    }
  };

  const handleEditService = (service) => {
    setNewService({
      name: service.name,
      price: service.price.toString(),
      description: service.description || '',
      image: service.image || '',
      category: service.category.toString(),
      totalRooms: service.totalRooms ? service.totalRooms.toString() : '',
    });
    setImageFile(null);
    setEditingService(service);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewService({ ...newService, image: URL.createObjectURL(file) });
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewService({ ...newService, image: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Quản Lý Dịch Vụ</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <button
        className="btn btn-primary mb-3"
        style={{ backgroundColor: 'var(--bs-primary) !important'}}
        onClick={() => {
          setNewService({ name: '', price: '', description: '', image: '', category: '', totalRooms: '' });
          setImageFile(null);
          setEditingService(null);
          setShowModal(true);
        }}
      >
        Thêm Dịch Vụ
      </button>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tên Dịch Vụ</th>
            <th>Giá</th>
            <th>Mô Tả</th>
            <th>Danh Mục</th>
            <th>Số Phòng</th>
            <th>Ảnh</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={service._id}>
              <td>{index + 1}</td>
              <td>{service.name}</td>
              <td>{service.price.toLocaleString()} VNĐ</td>
              <td>{service.description}</td>
              <td>{getCategoryName(service.category)}</td>
              <td>{service.totalRooms || 'N/A'}</td>
              <td>
                {service.image && (
                  <img
                    src={`http://localhost:5000/api/images/${service.image}`}
                    alt={service.name || 'Service image'}
                    style={{ maxWidth: '100px', height: 'auto' }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${service.image}`);
                      e.target.src = '/images/default_service.jpg';
                    }}
                  />
                )}
              </td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditService(service)}>
                  Sửa
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteService(service._id)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{editingService ? 'Sửa Dịch Vụ' : 'Thêm Dịch Vụ'}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowModal(false);
                  setNewService({ name: '', price: '', description: '', image: '', category: '', totalRooms: '' });
                  setImageFile(null);
                  setEditingService(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={editingService ? handleUpdateService : handleAddService}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên Dịch Vụ</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                    placeholder="Nhập tên dịch vụ"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Giá</label>
                  <input
                    type="number"
                    className="form-control"
                    id="price"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    required
                    min="0"
                    placeholder="Nhập giá dịch vụ"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Mô Tả</label>
                  <textarea
                    className="form-control"
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    required
                    placeholder="Nhập mô tả dịch vụ"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="category" className="form-label">Danh Mục</label>
                  <select
                    className="form-control"
                    id="category"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categoryServices.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {newService.category === '3' && (
                  <div className="mb-3">
                    <label htmlFor="totalRooms" className="form-label">Số Lượng Phòng</label>
                    <input
                      type="number"
                      className="form-control"
                      id="totalRooms"
                      value={newService.totalRooms}
                      onChange={(e) => setNewService({ ...newService, totalRooms: e.target.value })}
                      required
                      min="0"
                      placeholder="Nhập số lượng phòng"
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Ảnh</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={editingService ? handleEditImageChange : handleImageChange}
                  />
                  {newService.image && (
                    <img
                      src={newService.image.startsWith('blob:') ? newService.image : `http://localhost:5000/api/images/${newService.image}`}
                      alt="Preview"
                      style={{ maxWidth: '100px', marginTop: '10px' }}
                      onError={(e) => {
                        console.error('Failed to load preview image:', newService.image);
                        e.target.src = '/images/default_service.jpg';
                      }}
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={
                    !newService.name ||
                    !newService.price ||
                    !newService.description ||
                    !newService.category ||
                    (newService.category === '3' && !newService.totalRooms)
                  }
                >
                  {editingService ? 'Cập nhật' : 'Thêm'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showModal && <div className="modal-backdrop fade show" />}
    </div>
  );
};

export default ServiceManagement;