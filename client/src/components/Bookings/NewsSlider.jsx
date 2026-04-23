import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const NewsSlider = ({ featuredNews = [] }) => {
    const sliderRef = useRef(null);

    const scrollLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollLeft -= 320;
        }
    };

    const scrollRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollLeft += 320;
        }
    };

    const validNews = Array.isArray(featuredNews) 
        ? featuredNews.filter(item => item && item._id && item.title) 
        : [];

    return (
        <section className="news-slider-section py-5" style={{ backgroundColor: '#FAF7F1' }}>
            <div className="container position-relative">
                <h2 className="news-slider-title text-center mb-4" style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: '700', color: '#0d2554' }}>
                    Cập nhật thông tin mới nhất!
                </h2>

                <div className="news-slider-container" ref={sliderRef}>
                    {validNews.length > 0 ? (
                        validNews.map((item) => {
                            const imageUrl = item.image 
                                ? `http://localhost:5000/api/images/${item.image}` 
                                : '/images/default_news.jpg';

                            return (
                                <div key={item._id} className="news-slider-card">
                                    <Link to={`/news/${item._id}`} className="text-decoration-none text-dark">
                                        <img
                                            src={imageUrl}
                                            alt={item.title}
                                            className="img-fluid rounded mb-3"
                                            onError={(e) => (e.target.src = '/images/default_news.jpg')}
                                        />
                                        <h5 className="news-slider-title-text">
                                            {item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title}
                                        </h5>
                                        <p className="news-slider-content">
                                            {item.content ? (item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content) : ''}
                                        </p>
                                        <p className="news-slider-date">
                                            {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : ''}
                                        </p>
                                    </Link>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center w-100 py-4">
                            <p className="text-muted">Chưa có tin tức nào nổi bật.</p>
                        </div>
                    )}
                </div>

                {validNews.length > 0 && (
                    <>
                        <button onClick={scrollLeft} className="news-slider-nav-btn news-slider-btn-left">
                            &#8249;
                        </button>
                        <button onClick={scrollRight} className="news-slider-nav-btn news-slider-btn-right">
                            &#8250;
                        </button>
                    </>
                )}

                <div className="text-center mt-4">
                    <Link to="/news" className="btn px-4 py-2 news-slider-more-btn">
                        Tìm hiểu thêm
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default NewsSlider;