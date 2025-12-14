import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/guides.css";
import defaultGuideImg from '../components/images/card.jpg';

const API_BASE = "http://localhost/globalgid2/public/backend";

// ==================== КОМПОНЕНТ КАРТОЧКИ ГИДА ====================
const GuideCard = ({ guide }) => {
  // Формируем URL изображения
  const getImageUrl = () => {
    if (guide.image) {
      if (guide.image.startsWith('http')) {
        return guide.image;
      }
      return `http://localhost/globalgid2/public/${guide.image}`;
    }
    return defaultGuideImg;
  };

  // Обрезаем bio если нужно
  const getShortBio = () => {
    if (!guide.bio) return "";
    if (guide.bio.length <= 200) return guide.bio;
    return guide.bio.substring(0, 200) + "...";
  };

  return (
    <Link 
      to={`/guide/${guide.guide_id}`}
      className="guide-card-link"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="guide-card">
        <div className="guide-image-wrapper">
          <img 
            src={getImageUrl()} 
            alt={`${guide.firstname_guide} ${guide.lastname_guide}`} 
            className="guide-image" 
            onError={(e) => {
              e.target.src = defaultGuideImg;
            }}
          />
        </div>
        <div className="guide-info">
          <div className="guide-rating-location">
            <span className="guide-rating">
              ★ {parseFloat(guide.avg_rating || 0).toFixed(1)} ({guide.reviews_count || 0} отзывов)
            </span>
            {guide.country && (
              <span className="guide-location"> · {guide.country}</span>
            )}
          </div>
          <h2 className="guide-name">
            {guide.firstname_guide} {guide.lastname_guide}
          </h2>
          {guide.bio && (
            <p className="guide-bio">{getShortBio()}</p>
          )}
          <div className="guide-stats">
            <span className="guide-stat">{guide.excursions_count || 0} экскурсий</span>
            <span className="guide-stat">{guide.languages_count || 0} языка</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ==================== КОМПОНЕНТ БАННЕРА ====================
const Banner = ({ locationQuery, nameQuery, onLocationChange, onNameChange, onSearchSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit(e);
  };

  return (
    <section className="banner banner--guides">
      <h1>Каждое место — с историей, каждый гид — с душой</h1>
      <p>Найдите опытного гида для вашего путешествия</p>

      <form className="search-form" onSubmit={handleSubmit}>
        {/* Поле поиска локации */}
        <div className="search-bar-banner">
          <svg
            className="search-icons"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M11.7321 10.3182H10.9907L10.7279 10.065C11.8541 8.7518 12.436 6.96032 12.1169 5.05624C11.6758 2.44869 9.4984 0.366386 6.87055 0.0474864C2.90061 -0.440264 -0.440517 2.89891 0.0475131 6.86652C0.366613 9.4928 2.45012 11.6689 5.05921 12.1098C6.9644 12.4287 8.757 11.8471 10.0709 10.7216L10.3243 10.9842V11.7252L14.313 15.7116C14.6978 16.0961 15.3266 16.0961 15.7114 15.7116C16.0962 15.327 16.0962 14.6986 15.7114 14.314L11.7321 10.3182ZM6.10096 10.3182C3.76405 10.3182 1.87763 8.4329 1.87763 6.09739C1.87763 3.76184 3.76405 1.87653 6.10096 1.87653C8.4379 1.87653 10.3243 3.76184 10.3243 6.09739C10.3243 8.4329 8.4379 10.3182 6.10096 10.3182Z" fill="#202020"/>
          </svg>
          <input
            type="text"
            placeholder="Страна или город"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
          />
          {locationQuery && (
            <button
              type="button"
              className="clear-date-btn"
              onClick={() => onLocationChange("")}
            >
              ×
            </button>
          )}
        </div>

        {/* Поле поиска имени */}
        <div className="search-bar-banner">
          <svg
            className="search-icons"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M11.7321 10.3182H10.9907L10.7279 10.065C11.8541 8.7518 12.436 6.96032 12.1169 5.05624C11.6758 2.44869 9.4984 0.366386 6.87055 0.0474864C2.90061 -0.440264 -0.440517 2.89891 0.0475131 6.86652C0.366613 9.4928 2.45012 11.6689 5.05921 12.1098C6.9644 12.4287 8.757 11.8471 10.0709 10.7216L10.3243 10.9842V11.7252L14.313 15.7116C14.6978 16.0961 15.3266 16.0961 15.7114 15.7116C16.0962 15.327 16.0962 14.6986 15.7114 14.314L11.7321 10.3182ZM6.10096 10.3182C3.76405 10.3182 1.87763 8.4329 1.87763 6.09739C1.87763 3.76184 3.76405 1.87653 6.10096 1.87653C8.4379 1.87653 10.3243 3.76184 10.3243 6.09739C10.3243 8.4329 8.4379 10.3182 6.10096 10.3182Z" fill="#202020"/>
          </svg>
          <input
            type="text"
            placeholder="Имя гида"
            value={nameQuery}
            onChange={(e) => onNameChange(e.target.value)}
          />
          {nameQuery && (
            <button
              type="button"
              className="clear-date-btn"
              onClick={() => onNameChange("")}
            >
              ×
            </button>
          )}
        </div>

        <button type="submit">Найти</button>
      </form>
    </section>
  );
};

// ==================== КОМПОНЕНТ СПИСКА ГИДОВ ====================
const GuidesList = ({ guides }) => {
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 16;

  // Сбрасываем состояние при изменении списка гидов
  React.useEffect(() => {
    setShowAll(false);
  }, [guides.length]);

  // Определяем, какие карточки показывать
  const visibleGuides = showAll ? guides : guides.slice(0, MAX_VISIBLE);
  const hasMore = guides.length > MAX_VISIBLE;

  return (
    <section className="guides-results">
      <div className="results-header">
        <p>Найдено: {guides.length} гидов</p>
      </div>

      <div className="guides-list">
        {visibleGuides.map((guide) => (
          <GuideCard key={guide.guide_id} guide={guide} />
        ))}
      </div>

      {hasMore && !showAll && (
        <div className="show-all-wrapper">
          <button className="show-all-button" onClick={() => setShowAll(true)}>
            Показать всех гидов
          </button>
        </div>
      )}
    </section>
  );
};

// ==================== ГЛАВНЫЙ КОМПОНЕНТ ====================
const GuidesPage = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationQuery, setLocationQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  // Функция для загрузки всех гидов
  const loadAllGuides = useCallback(async () => {
    try {
      setLoading(true);
      const guidesRes = await fetch(`${API_BASE}/guides/list.php`);
      const guidesData = await guidesRes.json();
      setGuides(guidesData);
    } catch (err) {
      console.error("Ошибка загрузки гидов:", err);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Основная функция применения фильтров
  const applyFilters = useCallback(async () => {
    setLoading(true);
    const filters = {
      locationQuery: locationQuery.trim() !== "" ? locationQuery.trim() : null,
      nameQuery: nameQuery.trim() !== "" ? nameQuery.trim() : null,
    };

    try {
      const res = await fetch(`${API_BASE}/guides/filtered.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      const result = await res.json();

      if (result.success) {
        setGuides(result.data);
      } else {
        console.error("Ошибка сервера:", result.error);
        setGuides([]);
      }
    } catch (err) {
      console.error("Ошибка применения фильтров:", err);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [locationQuery, nameQuery]);

  // Загрузка всех гидов при монтировании
  useEffect(() => {
    loadAllGuides();
  }, [loadAllGuides]);


  // Обработчик поиска из баннера (только по кнопке)
  const handleBannerSearch = () => {
    const hasSearchParams = locationQuery.trim() !== "" || nameQuery.trim() !== "";
    
    if (hasSearchParams) {
      applyFilters();
    } else {
      loadAllGuides();
    }
  };

  if (loading) {
    return (
      <div className="guides-page">
        <div className="loading">Загрузка гидов...</div>
      </div>
    );
  }

  return (
    <div className="guides-page">
      <Banner
        locationQuery={locationQuery}
        nameQuery={nameQuery}
        onLocationChange={setLocationQuery}
        onNameChange={setNameQuery}
        onSearchSubmit={handleBannerSearch}
      />
      
      <section className="guides-content">
        <GuidesList guides={guides} />
      </section>
    </div>
  );
};

export default GuidesPage;

