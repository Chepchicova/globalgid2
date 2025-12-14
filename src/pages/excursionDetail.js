import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/excursionDetail.css";
import AuthModal from "../components/AuthModal";

const API_BASE = "http://localhost/globalgid2/public/backend";

const ExcursionDetail = ({ user, onLoginSuccess }) => {
  const { id } = useParams();
  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  // Закрытие модального окна по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setSelectedImage(null);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Блокируем скролл
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Обновляем максимальное значение при изменении доступных мест
  useEffect(() => {
    if (excursion?.data?.count_seats && participants > excursion.data.count_seats) {
      setParticipants(excursion.data.count_seats || 1);
    }
  }, [excursion?.data?.count_seats]);

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
  const images = excursion.images || [];
  const defaultImage = "http://localhost/globalgid2/public/uploads/excursions/default.png";

  // Функция для получения URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultImage;
    return `http://localhost/globalgid2/public/${imagePath}`;
  };

  // Функция для открытия модального окна с изображением
  const openImageModal = (imagePath, index) => {
    setSelectedImage({ url: getImageUrl(imagePath), index });
    setIsModalOpen(true);
  };

  // Функция для закрытия модального окна
  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  // Функция для переключения изображений в модальном окне
  const navigateImage = (direction) => {
    if (!selectedImage || displayImages.length === 0) return;
    
    let newIndex = selectedImage.index + direction;
    
    if (newIndex < 0) {
      newIndex = displayImages.length - 1;
    } else if (newIndex >= displayImages.length) {
      newIndex = 0;
    }
    
    setSelectedImage({
      url: getImageUrl(displayImages[newIndex].image_path),
      index: newIndex
    });
  };

  // Определяем количество изображений (максимум 5)
  const displayImages = images.slice(0, 5);
  const imageCount = displayImages.length;

  // Функции для управления счетчиком
  const increaseParticipants = () => {
    if (excursion && participants < excursion.data.count_seats) {
      setParticipants(prev => prev + 1);
    }
  };

  const decreaseParticipants = () => {
    if (participants > 1) {
      setParticipants(prev => prev - 1);
    }
  };

  // Функция для бронирования экскурсии
  const handleBooking = async () => {
    // Проверка авторизации
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!excursion || !excursion.data) {
      setBookingError('Ошибка: данные экскурсии не загружены');
      return;
    }

    // Проверка доступности мест
    if (participants > excursion.data.count_seats) {
      setBookingError(`Недостаточно мест. Доступно: ${excursion.data.count_seats}`);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/booking.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          excursion_id: parseInt(id),
          seats: participants
        })
      });

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        // Обновляем количество доступных мест
        setExcursion(prev => ({
          ...prev,
          data: {
            ...prev.data,
            count_seats: data.remaining_seats
          }
        }));
        // Сбрасываем счетчик участников
        setParticipants(1);
        // Скрываем сообщение об успехе через 3 секунды
        setTimeout(() => {
          setBookingSuccess(false);
        }, 3000);
      } else {
        setBookingError(data.error || 'Ошибка при бронировании');
      }
    } catch (err) {
      console.error('Ошибка бронирования:', err);
      setBookingError('Ошибка сети. Попробуйте позже.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Обработчик успешного входа
  const handleAuthSuccess = (userData) => {
    setIsAuthModalOpen(false);
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

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
        <div className="title-wrapper">
          <h1 className="excursion-title">{excursionData.title}</h1>
        </div>
        <button className="favorite-button">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.9849 5C16.2412 5 14.2021 6.97669 13.1099 8.25C12.0176 6.97669 9.97844 5 8.23486 5C5.14845 5 3.35986 7.40736 3.35986 10.4712C3.35986 13.8654 6.60986 17.4584 13.1099 21.25C19.6099 17.4584 22.8599 13.9375 22.8599 10.6875C22.8599 7.62359 21.0712 5 17.9849 5Z" stroke="#242A37" strokeWidth="1.48571" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Сохранить
        </button>
      </header>

      <div className="excursion-content">
        {/* Левая колонка: основное содержание */}
        <div className="excursion-main">
          {/* Галерея изображений */}
          <div className={`image-gallery image-gallery-${imageCount || 1}`}>
            {imageCount === 0 ? (
              // Если нет изображений, показываем default.png
              <div className="main-image" onClick={() => openImageModal(null, 0)}>
                <img 
                  src={defaultImage} 
                  alt={excursionData.title} 
                />
              </div>
            ) : imageCount === 1 ? (
              // Одно изображение - на всю ширину
              <div className="main-image" onClick={() => openImageModal(displayImages[0].image_path, 0)}>
                <img 
                  src={getImageUrl(displayImages[0].image_path)} 
                  alt={excursionData.title} 
                />
              </div>
            ) : imageCount === 2 ? (
              // Два изображения - рядом
              <>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[0].image_path, 0)}>
                  <img 
                    src={getImageUrl(displayImages[0].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[1].image_path, 1)}>
                  <img 
                    src={getImageUrl(displayImages[1].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
              </>
            ) : imageCount === 3 ? (
              // Три изображения - одно большое слева, два справа
              <>
                <div className="gallery-item gallery-item-large" onClick={() => openImageModal(displayImages[0].image_path, 0)}>
                  <img 
                    src={getImageUrl(displayImages[0].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item-column">
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[1].image_path, 1)}>
                    <img 
                      src={getImageUrl(displayImages[1].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[2].image_path, 2)}>
                    <img 
                      src={getImageUrl(displayImages[2].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                </div>
              </>
            ) : imageCount === 4 ? (
              // Четыре изображения - сетка 2x2
              <>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[0].image_path, 0)}>
                  <img 
                    src={getImageUrl(displayImages[0].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[1].image_path, 1)}>
                  <img 
                    src={getImageUrl(displayImages[1].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[2].image_path, 2)}>
                  <img 
                    src={getImageUrl(displayImages[2].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item" onClick={() => openImageModal(displayImages[3].image_path, 3)}>
                  <img 
                    src={getImageUrl(displayImages[3].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
              </>
            ) : (
              // Пять изображений - одно большое слева, четыре справа (2x2)
              <>
                <div className="gallery-item gallery-item-large" onClick={() => openImageModal(displayImages[0].image_path, 0)}>
                  <img 
                    src={getImageUrl(displayImages[0].image_path)} 
                    alt={excursionData.title} 
                  />
                </div>
                <div className="gallery-item-grid">
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[1].image_path, 1)}>
                    <img 
                      src={getImageUrl(displayImages[1].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[2].image_path, 2)}>
                    <img 
                      src={getImageUrl(displayImages[2].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[3].image_path, 3)}>
                    <img 
                      src={getImageUrl(displayImages[3].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                  <div className="gallery-item" onClick={() => openImageModal(displayImages[4].image_path, 4)}>
                    <img 
                      src={getImageUrl(displayImages[4].image_path)} 
                      alt={excursionData.title} 
                    />
                  </div>
                </div>
              </>
            )}
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
          <section className="description-section content-section">
            <h2>Описание</h2>
            <p className="description-text">{excursionData.description}</p>
          </section>

          {/* Организатор */}
          <section className="organizer-section content-section">
            <h2>Организатор туров</h2>
            <div className="organizer-card">
              <h3>{excursionData.guide_name}</h3>
              <p>{excursionData.guide_bio || "Опытный гид с многолетним стажем"}</p>
            </div>
          </section>

          {/* Программа */}
          <section className="program-section content-section">
            <h2>Программа</h2>
            
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
            {/* Цена и предоплата */}
            <div className="price-header">
              <h3 className="total-price">от ₽{parseInt(excursionData.price).toLocaleString()}</h3>
              <p className="prepayment">Предоплата – ₽{Math.round(excursionData.price * 0.2).toLocaleString()}</p>
            </div>

            {/* Участники */}
            <div className="participants-section">
              <h4>Участников</h4>
              <div className="participants-counter">
                <button 
                  className="counter-btn" 
                  onClick={decreaseParticipants}
                  disabled={participants <= 1}
                >
                  -
                </button>
                <span className="participants-count">{participants}</span>
                <button 
                  className="counter-btn" 
                  onClick={increaseParticipants}
                  disabled={excursion && participants >= excursion.data.count_seats}
                >
                  +
                </button>
              </div>
            </div>

            {/* Информация об экскурсии */}
            <div className="excursion-info">
              <div className="info-item">
                <span className="info-label">Длительность:</span>
                <span className="info-value">{excursionData.duration} часов</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Место:</span>
                <span className="info-value">
                  {excursionData.city}, {excursionData.country}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Язык:</span>
                <span className="info-value">{excursionData.language_name}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Доступно мест:</span>
                <span className="info-value">{excursionData.count_seats}</span>
              </div>
            </div>

            {/* Сообщения об ошибке и успехе */}
            {bookingError && (
              <div className="booking-error" style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div className="booking-success" style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#efe',
                color: '#3c3',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Экскурсия успешно забронирована!
              </div>
            )}

            {/* Кнопка бронирования */}
            <button 
              className="book-button" 
              onClick={handleBooking}
              disabled={bookingLoading || bookingSuccess || (excursion && excursion.data.count_seats === 0)}
            >
              {bookingLoading ? 'Бронирование...' : (excursion && excursion.data.count_seats === 0 ? 'Мест нет' : 'Забронировать')}
            </button>

            {/* Информация об отмене */}
            <div className="cancellation-info">
              <p>Полная отмена в течение 24 часов</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Модальное окно для просмотра изображений */}
      {isModalOpen && selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              ×
            </button>
            {displayImages.length > 1 && (
              <>
                <button 
                  className="image-modal-nav image-modal-prev" 
                  onClick={() => navigateImage(-1)}
                  aria-label="Предыдущее изображение"
                >
                  ‹
                </button>
                <button 
                  className="image-modal-nav image-modal-next" 
                  onClick={() => navigateImage(1)}
                  aria-label="Следующее изображение"
                >
                  ›
                </button>
              </>
            )}
            <img 
              src={selectedImage.url} 
              alt={excursionData.title} 
              className="image-modal-image"
            />
            {displayImages.length > 1 && (
              <div className="image-modal-counter">
                {selectedImage.index + 1} / {displayImages.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно авторизации */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default ExcursionDetail;