import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/guideDetail.css";

const API_BASE = "http://localhost/globalgid2/public/backend";
const defaultGuideImg = require('../components/images/card.jpg').default;

const GuideDetail = () => {
  const { id } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchGuideDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/guides/detail.php?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.success || !data.data) {
          throw new Error('Гид не найден');
        }
        
        setGuide(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuideDetail();
  }, [id]);

  // Формируем URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultGuideImg;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost/globalgid2/public/${imagePath}`;
  };

  // Формируем URL изображения экскурсии
  const getExcursionImageUrl = (imagePath) => {
    if (!imagePath) return defaultGuideImg;
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost/globalgid2/public/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="guide-detail-container">
        <div className="loading">Загрузка данных гида...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guide-detail-container">
        <div className="error">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Link to="/guides" className="back-link">
            ← Вернуться к списку гидов
          </Link>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="guide-detail-container">
        <div className="not-found">
          <h2>Гид не найден</h2>
          <Link to="/guides" className="back-link">
            ← Вернуться к списку гидов
          </Link>
        </div>
      </div>
    );
  }

  const reviews = guide.reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="guide-detail-container">
      {/* Кнопка назад */}
      <div className="back-section">
        <Link to="/guides" className="back-link">
          ← Вернуться к списку гидов
        </Link>
      </div>

      <div className="guide-detail-content">
        {/* Левая колонка: основная информация */}
        <div className="guide-main-content">
          {/* Заголовок с фото и именем */}
          <div className="guide-header">
            <div className="guide-photo-wrapper">
              <img 
                src={getImageUrl(guide.image)} 
                alt={`${guide.firstname_guide} ${guide.lastname_guide}`}
                className="guide-photo"
                onError={(e) => {
                  e.target.src = defaultGuideImg;
                }}
              />
            </div>
            <div className="guide-header-info">
              <h1 className="guide-name">
                {guide.firstname_guide} {guide.lastname_guide}
              </h1>
              {guide.city && guide.country && (
                <p className="guide-location">
                   {guide.city}, {guide.country}
                </p>
              )}
              <div className="guide-rating">
                <span className="rating-stars">
                  ★ {parseFloat(guide.avg_rating || 0).toFixed(1)}
                </span>
                <span className="rating-count">
                  ({guide.reviews_count || 0} отзывов)
                </span>
              </div>
            </div>
          </div>

          {/* Специализации */}
          {guide.specializations && guide.specializations.length > 0 && (
            <section className="specializations-section content-section">
              <h2>Специализации</h2>
              <div className="specializations-list">
                {guide.specializations.map((spec) => (
                  <span key={spec.specialization_id} className="specialization-tag">
                    {spec.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Языки */}
          {guide.languages && guide.languages.length > 0 && (
            <section className="languages-section content-section">
              <h2>Языки</h2>
              <div className="languages-list">
                {guide.languages.map((lang) => (
                  <span key={lang.language_id} className="language-tag">
                    {lang.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Биография */}
          {guide.bio && (
            <section className="bio-section content-section">
              <h2>О гиде</h2>
              <p className="bio-text">{guide.bio}</p>
            </section>
          )}

          {/* Экскурсии гида */}
          {guide.excursions && guide.excursions.length > 0 && (
            <section className="excursions-section content-section">
              <h2>Экскурсии гида ({guide.excursions.length})</h2>
              <div className="guide-excursions-list">
                {guide.excursions.map((excursion) => (
                  <Link
                    key={excursion.excursion_id}
                    to={`/excursion/${excursion.excursion_id}`}
                    className="guide-excursion-card"
                  >
                    <div className="guide-excursion-image-wrapper">
                      <img
                        src={getExcursionImageUrl(excursion.image)}
                        alt={excursion.title}
                        className="guide-excursion-image"
                        onError={(e) => {
                          e.target.src = defaultGuideImg;
                        }}
                      />
                    </div>
                    <div className="guide-excursion-info">
                      <h3 className="guide-excursion-title">{excursion.title}</h3>
                      {excursion.description && (
                        <p className="guide-excursion-description">
                          {excursion.description.length > 150
                            ? excursion.description.substring(0, 150) + "..."
                            : excursion.description}
                        </p>
                      )}
                      <div className="guide-excursion-meta">
                        {excursion.city && excursion.country && (
                          <span className="guide-excursion-location">
                             {excursion.city}, {excursion.country}
                          </span>
                        )}
                        <span className="guide-excursion-duration">
                          / {excursion.duration} часов
                        </span>
                        <span className="guide-excursion-price">
                          ₽{parseInt(excursion.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Отзывы */}
          <section className="reviews-section content-section">
            <h2>Отзывы {reviews.length > 0 && `(${reviews.length})`}</h2>
            
            {reviews.length === 0 ? (
              <p className="no-reviews">Пока нет отзывов</p>
            ) : (
              <>
                <div className="reviews-list">
                  {visibleReviews.map((review) => (
                    <div key={review.review_id} className="review-card">
                      <div className="review-header">
                        <span className="review-author">{review.user_name}</span>
                        <span className="review-rating">★ {review.rating}/5</span>
                      </div>
                      {review.comment && (
                        <p className="review-comment">{review.comment}</p>
                      )}
                      <span className="review-date">
                        {new Date(review.create_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  ))}
                </div>
                
                {reviews.length > 3 && !showAllReviews && (
                  <button 
                    className="show-all-reviews"
                    onClick={() => setShowAllReviews(true)}
                  >
                    Показать все отзывы ({reviews.length})
                  </button>
                )}
                
                {showAllReviews && reviews.length > 3 && (
                  <button 
                    className="hide-reviews"
                    onClick={() => setShowAllReviews(false)}
                  >
                    Свернуть отзывы
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default GuideDetail;
