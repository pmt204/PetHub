import React, { useState, useEffect } from 'react';

const NewsManagement = () => {
  const topics = ['Sức khỏe', 'Góc nhìn chuyên gia', 'Chăm sóc thú cưng', 'Câu chuyện'];

  const [news, setNews] = useState([]);
  const [newNews, setNewNews] = useState({ title: '', content: '', fullContent: '', image: '', date: '', topic: topics[0] });
  const [editNews, setEditNews] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');
      const response = await fetch('http://localhost:5000/api/news', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Fetch news response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi lấy danh sách tin tức');
      }
      const data = await response.json();
      setNews(data);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching news:', error);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');
      console.log('Token:', token); 

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/api/news/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi upload ảnh');
      }

      const data = await response.json();
      return data.image; 
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = newNews.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const response = await fetch('http://localhost:5000/api/news', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNews.title,
          content: newNews.content,
          fullContent: newNews.fullContent,
          image: imageName,
          date: newNews.date || undefined,
          topic: newNews.topic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Add news response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi thêm tin tức');
      }

      const data = await response.json();
      setSuccess('Thêm tin tức thành công!');
      setShowAddModal(false);
      setNewNews({ title: '', content: '', fullContent: '', image: '', date: '', topic: topics[0] });
      setImageFile(null);
      fetchNews();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error adding news:', error);
    }
  };

  const handleUpdateNews = async (e) => {
    e.preventDefault();
    if (!editNews?._id) throw new Error('ID tin tức không hợp lệ');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');

      let imageName = editNews.image;
      if (imageFile) {
        imageName = await handleImageUpload(imageFile);
      }

      const response = await fetch(`http://localhost:5000/api/news/${editNews._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editNews.title,
          content: editNews.content,
          fullContent: editNews.fullContent,
          image: imageName,
          date: editNews.date || undefined,
          topic: editNews.topic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update news response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi cập nhật tin tức');
      }

      setSuccess('Cập nhật tin tức thành công!');
      setShowEditModal(false);
      setEditNews(null);
      setImageFile(null);
      fetchNews();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error updating news:', error);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin tức này?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập');
      const response = await fetch(`http://localhost:5000/api/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete news response:', errorData);
        throw new Error(errorData.message || 'Lỗi khi xóa tin tức');
      }
      setSuccess('Xóa tin tức thành công!');
      fetchNews();
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
      console.error('Error deleting news:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewNews({ ...newNews, image: URL.createObjectURL(file) });
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setEditNews({ ...editNews, image: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Quản Lý Tin Tức</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <button className="btn btn-primary mb-3" style={{ backgroundColor: 'var(--bs-primary) !important'}} onClick={() => setShowAddModal(true)}>
        Thêm Tin Tức
      </button>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tiêu Đề</th>
            <th>Ngày Đăng</th>
            <th>Nội Dung</th>
            <th>Nội Dung Đầy Đủ</th>
            <th>Chủ Đề</th>
            <th>Ảnh</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {news.map((item, index) => (
            <tr key={item._id}>
              <td>{index + 1}</td>
              <td>{item.title}</td>
              <td>
                {item.date
                  ? new Date(item.date).toLocaleDateString('vi-VN')
                  : 'Chưa có ngày đăng'}
              </td>
              <td>{item.content.substring(0, 50)}...</td>
              <td>{item.fullContent ? item.fullContent.substring(0, 50) + '...' : 'Chưa có'}</td>
              <td>{item.topic}</td>
              <td>
                {item.image && (
                  <img
                    src={`http://localhost:5000/api/images/${item.image}`}
                    alt={item.title || 'News image'}
                    style={{ maxWidth: '100px', height: 'auto' }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${item.image}`);
                      e.target.src = '/images/default_news.jpg';
                    }}
                  />
                )}
              </td>
              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => {
                    setEditNews(item);
                    setImageFile(null);
                    setShowEditModal(true);
                  }}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteNews(item._id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`modal fade ${showAddModal ? 'show' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white" >
              <h5 className="modal-title" >Thêm Tin Tức</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowAddModal(false);
                  setNewNews({ title: '', content: '', fullContent: '', image: '', date: '', topic: topics[0] });
                  setImageFile(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddNews}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Tiêu Đề</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={newNews.title}
                    onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                    required
                    placeholder="Nhập tiêu đề tin tức"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="topic" className="form-label">Chủ Đề</label>
                  <select
                    className="form-control"
                    id="topic"
                    value={newNews.topic}
                    onChange={(e) => setNewNews({ ...newNews, topic: e.target.value })}
                    required
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="content" className="form-label">Nội Dung</label>
                  <textarea
                    className="form-control"
                    id="content"
                    value={newNews.content}
                    onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                    required
                    placeholder="Nhập nội dung tin tức"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="fullContent" className="form-label">Nội Dung Đầy Đủ</label>
                  <textarea
                    className="form-control"
                    id="fullContent"
                    value={newNews.fullContent}
                    onChange={(e) => setNewNews({ ...newNews, fullContent: e.target.value })}
                    placeholder="Nhập nội dung đầy đủ (tùy chọn)"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Ảnh</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    required
                  />
                  {newNews.image && (
                    <img
                      src={newNews.image}
                      alt="Preview"
                      style={{ maxWidth: '100px', marginTop: '10px' }}
                      onError={(e) => {
                        console.error('Failed to load preview image:', newNews.image);
                        e.target.src = '/images/default_news.jpg';
                      }}
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={!newNews.title || !newNews.content || !newNews.topic}
                >
                  Thêm
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showAddModal && <div className="modal-backdrop fade show" />}

      <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Sửa Tin Tức</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowEditModal(false);
                  setEditNews(null);
                  setImageFile(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateNews}>
                <div className="mb-3">
                  <label htmlFor="edit-title" className="form-label">Tiêu Đề</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-title"
                    value={editNews?.title || ''}
                    onChange={(e) => setEditNews({ ...editNews, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-topic" className="form-label">Chủ Đề</label>
                  <select
                    className="form-control"
                    id="edit-topic"
                    value={editNews?.topic || topics[0]}
                    onChange={(e) => setEditNews({ ...editNews, topic: e.target.value })}
                    required
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-date" className="form-label">Ngày Đăng (Tùy chọn)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="edit-date"
                    value={editNews?.date ? editNews.date.split('T')[0] : ''}
                    onChange={(e) => setEditNews({ ...editNews, date: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-content" className="form-label">Nội Dung</label>
                  <textarea
                    className="form-control"
                    id="edit-content"
                    value={editNews?.content || ''}
                    onChange={(e) => setEditNews({ ...editNews, content: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-fullContent" className="form-label">Nội Dung Đầy Đủ</label>
                  <textarea
                    className="form-control"
                    id="edit-fullContent"
                    value={editNews?.fullContent || ''}
                    onChange={(e) => setEditNews({ ...editNews, fullContent: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="edit-image" className="form-label">Ảnh</label>
                  <input
                    type="file"
                    className="form-control"
                    id="edit-image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleEditImageChange}
                  />
                  {editNews?.image && (
                    <img
                      src={editNews.image.startsWith('blob:') ? editNews.image : `http://localhost:5000/api/images/${editNews.image}`}
                      alt="Preview"
                      style={{ maxWidth: '100px', marginTop: '10px' }}
                      onError={(e) => {
                        console.error('Failed to load preview image:', editNews.image);
                        e.target.src = '/images/default_news.jpg';
                      }}
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={!editNews?.title || !editNews?.content || !editNews?.topic}
                >
                  Cập Nhật
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showEditModal && <div className="modal-backdrop fade show" />}
    </div>
  );
};

export default NewsManagement;