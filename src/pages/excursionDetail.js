import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/excursionDetail.css";

const API_BASE = "http://localhost/globalgid2/public/backend";

const ExcursionDetail = () => {
  const { id } = useParams();
  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchExcursionDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/excursions/detail.php?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setExcursion(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExcursionDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="excursion-detail-container">
        <div className="loading">Загрузка экскурсии...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="excursion-detail-container">
        <div className="error">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Link to="/excursions" className="back-link">
            ← Вернуться к списку экскурсий
          </Link>
        </div>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="excursion-detail-container">
        <div className="not-found">
          <h2>Экскурсия не найдена</h2>
          <Link to="/excursions" className="back-link">
            ← Вернуться к списку экскурсий
          </Link>
        </div>
      </div>
    );
  }

  const excursionData = excursion.data;
  const reviews = excursion.reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="excursion-detail-container">
      {/* Кнопка назад */}
      <div className="back-section">
        <Link to="/excursions" className="back-link">
          ← Вернуться к списку экскурсий
        </Link>
      </div>

      {/* Заголовок и кнопка избранного */}
      <header className="excursion-header">
        <h1 className="excursion-title">{excursionData.title}</h1>
        <button className="favorite-button">❤️ Добавить в избранное</button>
      </header>

      <div className="excursion-content">
        {/* Левая колонка: основное содержание */}
        <div className="excursion-main">
          {/* Галерея изображений */}
          <div className="image-gallery">
            <div className="main-image">
              <img 
                src={excursionData.image || "placeholder.jpg"} 
                alt={excursionData.title} 
              />
            </div>
            {/* Здесь можно добавить миниатюры */}
          </div>

          {/* Теги */}
          <div className="excursion-tags">
            {excursionData.type && (
              <span className="tag tag-type">{excursionData.type}</span>
            )}
            {excursionData.specialization_name && (
              <span className="tag tag-specialization">
                {excursionData.specialization_name}
              </span>
            )}
            {excursionData.transport_type && (
              <span className="tag tag-transport">{excursionData.transport_type}</span>
            )}
          </div>

          {/* Описание */}
          <section className="description-section">
            <h2>Описание</h2>
            <p className="description-text">{excursionData.description}</p>
          </section>

          {/* Организатор */}
          <section className="organizer-section">
            <h2>Организатор туров</h2>
            <div className="organizer-card">
              <h3>{excursionData.guide_name}</h3>
              <p>{excursionData.guide_bio || "Опытный гид с многолетним стажем"}</p>
            </div>
          </section>

{/* Программа */}
<section className="program-section">
  <h2>Программа</h2>
  
  {/* Добавьте эти console.log для отладки */}
  {console.log('=== ДАННЫЕ ЭКСКУРСИИ ===')}
  {console.log('excursionData:', excursionData)}
  {console.log('program поле:', excursionData.program)}
  {console.log('тип program:', typeof excursionData.program)}
  {console.log('длина program:', excursionData.program?.length)}
  
  {excursionData.program && excursionData.program.trim() !== '' ? (
    <div className="program-content">
      <pre className="program-text">
        {excursionData.program}
      </pre>
    </div>
  ) : (
    <div className="no-program">
      <p><strong>Информация о программе:</strong></p>
      <p>Детали программы будут уточнены гидом после бронирования.</p>
    </div>
  )}
</section>

          {/* Отзывы */}
          <section className="reviews-section">
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
                        <span className="review-rating">⭐ {review.rating}/5</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <span className="review-date">
                        {new Date(review.create_at).toLocaleDateString()}
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

        {/* Правая колонка: карточка бронирования */}
        <aside className="booking-sidebar">
          <div className="booking-card">
            <h3>Забронировать экскурсию</h3>
            
            <div className="price-info">
              <span className="price">₽{excursionData.price}</span>
              <span className="per-person">за человека</span>
            </div>
            
            <div className="excursion-meta">
              <div className="meta-item">
                <span className="meta-label">Длительность:</span>
                <span className="meta-value">{excursionData.duration} часов</span>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Место:</span>
                <span className="meta-value">
                  {excursionData.city}, {excursionData.country}
                </span>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Язык:</span>
                <span className="meta-value">{excursionData.language_name}</span>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Доступно мест:</span>
                <span className="meta-value">{excursionData.count_seats}</span>
              </div>
            </div>
            
            <button className="book-button">Забронировать</button>
            
            <div className="rating-info">
              <span className="rating-stars">⭐ {parseFloat(excursionData.avg_rating || 0).toFixed(1)}</span>
              <span className="reviews-count">
                ({excursionData.reviews_count || 0} отзывов)
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExcursionDetail;