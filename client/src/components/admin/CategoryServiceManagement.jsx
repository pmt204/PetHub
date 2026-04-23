import React, { useState, useEffect } from 'react';

const CategoryServiceManagement = () => {
  const [categoryServices, setCategoryServices] = useState([]);
  const [newCategory, setNewCategory] = useState({ _id: '', name: '', description: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategoryServices();
  }, []);

  const fetchCategoryServices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const response = await fetch('http://localhost:5000/api/categoryservices', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Lỗi khi lấy danh sách danh mục');

      const data = await response.json();
      const cleanedData = data.map(category => ({
        ...category,
        image: category.image || '',
        description: category.description || '',
      }));
      setCategoryServices(cleanedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching category services:', error);
      setError(error.message);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/api/categoryservices/upload', {
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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = newCategory.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const response = await fetch('http://localhost:5000/api/categoryservices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: parseInt(newCategory._id),
          name: newCategory.name,
          description: newCategory.description || '',
          image: imageName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Add category response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi thêm danh mục');
      }

      const data = await response.json();
      setSuccess('Thêm danh mục thành công!');
      setShowModal(false);
      setNewCategory({ _id: '', name: '', description: '', image: '' });
      setImageFile(null);
      fetchCategoryServices();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error adding category:', error);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory?._id) throw new Error('ID danh mục không hợp lệ');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = editingCategory.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const response = await fetch(`http://localhost:5000/api/categoryservices/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description || '',
          image: imageName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update category response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi cập nhật danh mục');
      }

      const data = await response.json();
      setSuccess('Cập nhật danh mục thành công!');
      setShowModal(false);
      setNewCategory({ _id: '', name: '', description: '', image: '' });
      setImageFile(null);
      setEditingCategory(null);
      fetchCategoryServices();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');
      const response = await fetch(`http://localhost:5000/api/categoryservices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete category response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi xóa danh mục');
      }
      setSuccess('Xóa danh mục thành công!');
      fetchCategoryServices();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error deleting category:', error);
    }
  };

  const handleEditCategory = (category) => {
    setNewCategory({
      _id: category._id.toString(),
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    setImageFile(null);
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewCategory({ ...newCategory, image: URL.createObjectURL(file) });
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewCategory({ ...newCategory, image: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Quản Lý Danh Mục Dịch Vụ</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <button
        className="btn btn-primary mb-3"
        style={{ backgroundColor: 'var(--bs-primary) !important' }}
        onClick={() => {
          setNewCategory({ _id: '', name: '', description: '', image: '' });
          setImageFile(null);
          setEditingCategory(null);
          setShowModal(true);
        }}
      >
        Thêm Danh Mục
      </button>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tên Danh Mục</th>
            <th>Mô Tả</th>
            <th>Ảnh</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {categoryServices.map((category, index) => (
            <tr key={category._id}>
              <td>{index + 1}</td>
              <td>{category.name}</td>
              <td>{category.description || 'Không có mô tả'}</td>
              <td>
                {category.image && (
                  <img
                    src={`http://localhost:5000/api/images/${category.image}`}
                    alt={category.name || 'Category image'}
                    style={{ maxWidth: '100px', height: 'auto' }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${category.image}`);
                      e.target.src = 'http://localhost:5000/public/images/default_category.jpg';
                    }}
                  />
                )}
              </td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditCategory(category)}>
                  Sửa
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(category._id)}>
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
              <h5 className="modal-title">{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowModal(false);
                  setNewCategory({ _id: '', name: '', description: '', image: '' });
                  setImageFile(null);
                  setEditingCategory(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
                {!editingCategory && (
                  <div className="mb-3">
                    <label htmlFor="_id" className="form-label">ID Danh Mục</label>
                    <input
                      type="number"
                      className="form-control"
                      id="_id"
                      value={newCategory._id}
                      onChange={(e) => setNewCategory({ ...newCategory, _id: e.target.value })}
                      required
                      placeholder="Nhập ID danh mục"
                      min="1"
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên Danh Mục</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    required
                    placeholder="Nhập tên danh mục"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Mô Tả</label>
                  <textarea
                    className="form-control"
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Nhập mô tả danh mục"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Ảnh</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={editingCategory ? handleEditImageChange : handleImageChange}
                  />
                  {newCategory.image && (
                    <img
                      src={newCategory.image.startsWith('blob:') ? newCategory.image : `http://localhost:5000/api/images/${newCategory.image}`}
                      alt="Preview"
                      style={{ maxWidth: '100px', marginTop: '10px' }}
                      onError={(e) => {
                        console.error('Failed to load preview image:', newCategory.image);
                        e.target.src = 'http://localhost:5000/public/images/default_category.jpg';
                      }}
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={!newCategory.name || (!editingCategory && !newCategory._id)}
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm'}
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

export default CategoryServiceManagement;