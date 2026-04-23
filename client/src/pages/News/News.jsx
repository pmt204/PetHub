import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HeroBlog from '../../components/Hero/HeroBlog';
import '../../pages/News/news.css';

const News = () => {
  const [news, setNews] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Tất cả');

  const [displayLimit, setDisplayLimit] = useState(6);
  const newsPerPage = 8;

  useEffect(() => {
    axios.get('http://localhost:5000/api/news')
      .then((response) => {
        const sortedNews = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNews(sortedNews);
        const extractedTopics = ['Tất cả', ...new Set(sortedNews.map(item => item.topic))];
        setTopics(extractedTopics);
      })
      .catch((error) => console.error('Error fetching news:', error));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setDisplayLimit(7); 
  }, [selectedTopic]);

  const filteredNews = selectedTopic === 'Tất cả' ? news : news.filter(item => item.topic === selectedTopic);

  const latestNews = filteredNews[0];

  const remainingNews = filteredNews.slice(1);

  const currentNews = remainingNews.slice(0, displayLimit - 1); 

  const totalAvailableNews = filteredNews.length;

  const loadMore = () => {
    setDisplayLimit(prevLimit => prevLimit + newsPerPage);
  };

  const hasMore = displayLimit < totalAvailableNews;

  const TextTruncate = ({ children, maxLines, className }) => (
    <p className={className} style={{
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: maxLines,
      WebkitBoxOrient: 'vertical',
      marginBottom: '0.5rem',
    }}>
      {children}
    </p>
  );


  return (
    <section className="news-section pb-5" style={{ backgroundColor: '#fffaf4' }}>
      <HeroBlog />
      <div className="container mt-5 pt-5">
        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="bg-white rounded shadow-sm p-3">
              <h5 className="fw-bold mb-3" style={{ fontFamily: 'Quicksand, sans-serif', color: '#0d2554', fontSize: '1.25rem' }}>Topic</h5>
              <ul className="list-unstyled">
                {topics.map((topic, index) => (
                  <li
                    key={index}
                    onClick={() => setSelectedTopic(topic)}
                    style={{
                      cursor: 'pointer',
                      fontWeight: selectedTopic === topic ? 'bold' : 'normal',
                      borderLeft: selectedTopic === topic ? '4px solid #8B0000' : '4px solid transparent',
                      paddingLeft: '0.75rem',
                      marginBottom: '0.75rem',
                      fontSize: '1.2rem',
                      fontFamily: 'Quicksand, sans-serif',
                      color: selectedTopic === topic ? '#8B0000' : '#333'
                    }}
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-md-9">
            <h2 className="text-start mb-4" style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 700, color: '#0d2554' }}>{selectedTopic}</h2>

            {latestNews && (
              <div className="row mb-5">
                <div className="col-md-6">
                  <Link to={`/news/${latestNews._id}`} className="text-decoration-none">
                    <img
                      src={`http://localhost:5000/api/images/${latestNews.image}`}
                      alt={latestNews.title}
                      className="img-fluid rounded w-100 hover-zoom"
                      style={{ objectFit: 'cover', maxHeight: '300px', transition: 'transform 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onError={(e) => (e.target.src = '/images/default_news.jpg')}
                    />
                  </Link>
                </div>
                <div className="col-md-6">
                  <h4 className="fw-bold" style={{ fontFamily: 'Quicksand, sans-serif', color: '#0d2554' }}>
                    <Link to={`/news/${latestNews._id}`} className="text-decoration-none " style={{ fontFamily: 'Quicksand, sans-serif', color: '#0d2554' }}>
                      {latestNews.title}
                    </Link>
                  </h4>
                  <p className="text-muted">{latestNews.content}</p>
                  <Link
                    to={`/news/${latestNews._id}`}
                    className="text-decoration-none"
                    style={{ color: '#8B0000', fontWeight: 'bold' }}
                    onMouseEnter={(e) => {
                      const span = e.currentTarget.querySelector('span');
                      if (span) span.style.marginLeft = '4px';
                    }}
                    onMouseLeave={(e) => {
                      const span = e.currentTarget.querySelector('span');
                      if (span) span.style.marginLeft = '0';
                    }}
                  >
                    Đọc thêm <span className="arrow-hover">→</span>
                  </Link>
                </div>
              </div>
            )}

            <div className="row g-4 d-flex align-items-stretch">
              {currentNews.length > 0 ? (
                currentNews.map((item) => (
                  <div className="col-12 col-md-6 col-lg-4" key={item._id}>
                    <div
                      style={{ fontFamily: 'Quicksand, sans-serif', color: '#0d2554', backgroundColor: '#fffaf4', transition: 'transform 0.3s ease, box-shadow 0.3s ease', height: '100%' }}
                      className="p-2 rounded hover-highlight d-flex flex-column"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Link to={`/news/${item._id}`} className="text-decoration-none ">
                        <img
                          src={`http://localhost:5000/api/images/${item.image}`}
                          alt={item.title}
                          className="img-fluid rounded mb-3 hover-zoom"
                          onError={(e) => (e.target.src = '/images/default_news.jpg')}
                          style={{ objectFit: 'cover', height: '200px', width: '100%', transition: 'transform 0.3s ease' }}
                        />
                      </Link>

                      <div className="card-body-content flex-grow-1">
                        <h5 style={{ color: '#0d2554' }}>
                          <Link to={`/news/${item._id}`} className="text-decoration-none " style={{ fontWeight: 700, color: '#0d2554' }}>
                            {item.title}
                          </Link>
                        </h5>

                        <TextTruncate maxLines={3} className="text-muted">
                          {item.content}
                        </TextTruncate>
                      </div>

                      <Link
                        to={`/news/${item._id}`}
                        className="text-decoration-none mt-2"
                        style={{ color: '#8B0000', fontWeight: 'bold' }}
                        onMouseEnter={(e) => {
                          const span = e.currentTarget.querySelector('span');
                          if (span) span.style.marginLeft = '4px';
                        }}
                        onMouseLeave={(e) => {
                          const span = e.currentTarget.querySelector('span');
                          if (span) span.style.marginLeft = '0';
                        }}
                      >
                        Đọc thêm <span className="arrow-hover">→</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center">
                  <p className="text-muted">Không tìm thấy tin tức.</p>
                </div>
              )}
            </div>

            {hasMore && (
              <div className="row mt-4">
                <div className="col-12 text-center">
                  <button
                    onClick={loadMore}
                    className="btn"
                    style={{ backgroundColor: '#8B0000', color: 'white', fontWeight: 'bold', padding: '0.5rem 1.5rem' }}
                  >
                    Tải thêm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default News;