import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./DoctorDetail.css";

const DoctorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [userInfo, setUserInfo] = useState(null);
    const [refetch, setRefetch] = useState(false);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://placehold.co/300x300?text=No+Image';
        if (imagePath.startsWith('http') || imagePath.includes('/api/images/')) {
            return imagePath;
        }
        return `http://localhost:5000/api/images/${imagePath}`;
    };
    // ===================================


    useEffect(() => {
        const checkUserInfo = () => {
            try {
                const storedUserJSON = localStorage.getItem("user");
                const storedToken = localStorage.getItem("token");

                if (storedUserJSON && storedToken) {
                    const storedUser = JSON.parse(storedUserJSON);
                    setUserInfo({
                        ...storedUser,
                        token: storedToken,
                    });
                }
            } catch (e) {
                console.error("Lỗi khi đọc localStorage:", e);
                setUserInfo(null);
            }
        };

        const fetchDoctorById = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`http://localhost:5000/api/doctors/${id}`);
                setDoctor(data);
                setError(null);
                setSubmitSuccess(false);
                setRating(0);
                setComment("");
                setSubmitError(null);
            } catch (err) {
                setError(
                    err.response?.data?.message || err.message || "Lỗi khi tải dữ liệu"
                );
            } finally {
                setLoading(false);
            }
        };

        checkUserInfo();
        fetchDoctorById();
    }, [id, refetch]);

    const handleBooking = () => {
        navigate('/categoryservices/1');
    };

    if (loading) {
        return <div className="detail-container"><p>Đang tải thông tin bác sĩ...</p></div>;
    }

    if (error || !doctor) {
        return (
            <div className="detail-container">
                <p style={{ color: "red" }}>{error || "Bác sĩ không tồn tại"}</p>
                <button onClick={() => navigate("/")} className="back-button">
                    ← Quay lại
                </button>
            </div>
        );
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        if (rating === 0 || comment.trim() === "") {
            setSubmitError("Vui lòng chọn sao và viết bình luận.");
            return;
        }
        setSubmitLoading(true);
        setSubmitError(null);

        try {
            if (!userInfo || !userInfo.token) {
                setSubmitError("Bạn cần đăng nhập để thực hiện việc này.");
                setSubmitLoading(false);
                return;
            }

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(
                `http://localhost:5000/api/doctors/${id}/reviews`,
                { rating, comment },
                config
            );

            setSubmitLoading(false);
            setSubmitSuccess(true);
            setRefetch(!refetch);
        } catch (err) {
            setSubmitLoading(false);
            setSubmitError(
                err.response?.data?.message || err.message || "Gửi đánh giá thất bại"
            );
        }
    };

    const hasReviewed = doctor && userInfo && userInfo.customerId
        ? doctor.reviews.some(
            (review) => review.user.toString() === userInfo.customerId.toString()
        )
        : false;


    return (
        <div className="detail-container">
            <div className="detail-card">

                {/* Phần hiển thị header bác sĩ */}
                <div className="detail-header">
                    <img
                        src={getImageUrl(doctor.image)}
                        alt={doctor.name}
                        className="detail-image"
                        onError={(e) => { e.target.src = 'https://placehold.co/300x300?text=Error' }}
                    />
                    <div className="detail-info">
                        <h1>{doctor.name}</h1>
                        <p className="specialty-badge">💼 {doctor.specialty}</p>
                        {/* <div className="rating-badge">
                            ⭐ {doctor.rating.toFixed(1)} / 5.0 ({doctor.numReviews} đánh giá)
                        </div> */}
                    </div>
                </div>

                {/* Phần body chi tiết */}
                <div className="detail-body">
                    <div className="info-section">
                        <h2>Thông tin chuyên môn</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Chuyên khoa:</span>
                                <span className="value">{doctor.specialty}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Kinh nghiệm:</span>
                                <span className="value">
                                    {doctor.experienceYears} năm kinh nghiệm
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Đánh giá:</span>
                                <span className="value">
                                    ⭐ {doctor.rating.toFixed(1)}/5 ({doctor.numReviews} lượt)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="info-section">
                        <h2> Giới thiệu</h2>
                        <p className="description-text">{doctor.fullDescription}</p>
                    </div>

                    <div className="info-section">
                        <h2>Lĩnh vực chuyên sâu</h2>
                        <ul className="services-list">
                            {doctor.services.map((service, index) => (
                                <li key={index}>{service.name || service}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="info-section">
                        <h2> Liên hệ</h2>
                        <div className="contact-info">
                            <p>57 Đường Số 31, Linh Đông, Thủ Đức, Thành phố Hồ Chí Minh</p>
                            <p>Hotline: 0923 456 897</p>
                            <p>Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Chủ nhật)</p>
                        </div>
                    </div>

                    <button
                        onClick={handleBooking}
                        className="appointment-button"
                    >
                        Đặt lịch
                    </button>

                    {/* === PHẦN REVIEW === */}
                    <div className="info-section reviews-section">
                        <h2> Đánh giá ({doctor.numReviews})</h2>
                        <div className="reviews-list">
                            {doctor.reviews.length === 0 && <p className="no-review">Chưa có đánh giá nào.</p>}
                            {doctor.reviews.map((review) => (
                                <div key={review._id} className="review-item">
                                    <strong>{review.name}</strong>
                                    <span className="review-rating"> - {review.rating} ⭐</span>
                                    <p className="review-comment">{review.comment}</p>
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Form viết review */}
                    <div className="info-section review-form-section">
                        <h2>Viết đánh giá của bạn</h2>

                        {submitSuccess && (
                            <p className="success-message">Gửi đánh giá thành công! Đánh giá sẽ hiển thị sau khi trang tải lại.</p>
                        )}
                        {submitError && <p className="error-message">{submitError}</p>}

                        {userInfo ? (
                            hasReviewed ? (
                                <p className="already-reviewed">Bạn đã đánh giá bác sĩ này.</p>
                            ) : (
                                <form onSubmit={submitHandler} className="review-form">
                                    <div className="form-group">
                                        <label htmlFor="rating">Đánh giá (sao)</label>
                                        <select
                                            id="rating"
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                        >
                                            <option value={0}>Chọn số sao...</option>
                                            <option value={1}>1 - Rất tệ</option>
                                            <option value={2}>2 - Tệ</option>
                                            <option value={3}>3 - Ổn</option>
                                            <option value={4}>4 - Tốt</option>
                                            <option value={5}>5 - Rất tốt</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="comment">Bình luận</label>
                                        <textarea
                                            id="comment"
                                            rows="4"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="submit-review-button"
                                        disabled={submitLoading}
                                    >
                                        {submitLoading ? "Đang gửi..." : "Gửi đánh giá"}
                                    </button>
                                </form>
                            )
                        ) : (
                            <p className="login-prompt">
                                Vui lòng <Link to="/login">đăng nhập</Link> để để lại đánh giá.
                            </p>
                        )}
                    </div>
                    <button onClick={() => navigate("/doctors")} className="back-button">
                        ← Quay lại danh sách
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetail;