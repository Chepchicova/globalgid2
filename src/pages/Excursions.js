import React, { useState, useEffect } from "react";
import "../styles/excursions.css";
import cardImg from '../components/images/card.jpg';

const API_BASE = "http://localhost/globalgid/public/backend/api.php";

// ==================== КОМПОНЕНТ КНОПКИ-ПЕРЕКЛЮЧАТЕЛЯ ====================
const FilterToggle = ({ title, isOpen, onClick }) => {
  return (
    <div className="filter-toggle" onClick={onClick}>
      <span>{title}</span>
      <span className={`arrow ${isOpen ? "open" : ""}`}>
        <svg
          width="25"
          height="25"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.8335 7.5L9.41091 11.0774C9.68866 11.3552 9.82758 11.4941 10.0002 11.4941C10.1727 11.4941 10.3117 11.3552 10.5894 11.0774L14.1668 7.5"
            stroke="#d4d7e2ff"
            strokeWidth="1.16667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
};

// ==================== КОМПОНЕНТ ГРУППЫ ЧЕКБОКСОВ ====================
const CheckboxFilterGroup = ({ 
  title, 
  items, 
  selectedItems, 
  onToggle, 
  getItemKey,
  getItemLabel,
  isOpen,
  onToggleOpen 
}) => {
  return (
    <div className="filter-group">
      <FilterToggle 
        title={title} 
        isOpen={isOpen} 
        onClick={onToggleOpen} 
      />
      {isOpen && (
        <div className="checkbox-list">
          {items.map((item, index) => (
            <label key={getItemKey(item, index)} className="checkbox-option">
              <input
                type="checkbox"
                checked={selectedItems.includes(getItemLabel(item))}
                onChange={() => onToggle(getItemLabel(item))}
              />
              <span>{getItemLabel(item)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== КОМПОНЕНТ ИНЛАЙНОВОГО ПОЛЯ ====================
const InlineField = ({ label, placeholder, type = "number", min, max,fun,typeV}) => {
 
  return (
    <div className="inline-field">
      <span className="inline-label">{label}</span>
      <input 
        type={type} 
        min={min} 
        max={max} 
        onChange={(e) => fun(typeV,e.target.value)}// вызов
        placeholder={placeholder} 
        className="input" 
      />
    </div>
  );
};

// ==================== КОМПОНЕНТ КАРТОЧКИ ЭКСКУРСИИ ====================
const ExcursionCard = ({ excursion }) => {
  console.log(excursion,"asf23454")
  return (
    <div 
      className="excursion-card" 
      onClick={() => window.location.href = `/excursion/${excursion.excursion_id}`}
    >
      <img 
        src={excursion.image || cardImg} 
        alt={excursion.title} 
        className="excursion-image" 
      />
      <div className="excursion-info">
        <h2 className="excursion-title">{excursion.title}</h2>
        <p className="excursion-description">{excursion.short_description}</p>
        <div className="excursion-meta">
          <span className="rating">
            ⭐ {Number(excursion.avg_rating).toFixed(1)} ({excursion.reviews_count} отзывов)
          </span>
          <span className="guide">{excursion.guide_name}</span>
        </div>
        <div className="excursion-details">
          <span className="duration">{excursion.duration} часов</span>
          <span className="price">
            <span className="current">₽{excursion.price}</span>
            <span className="old">₽{excursion.old_price}</span>
          </span>
        </div>
        <button className="details-button">Подробнее</button>
      </div>
    </div>
  );
};

// ==================== КОМПОНЕНТ БАННЕРА ====================
const Banner = () => {
  return (
    <section className="banner banner--excursions">
      <h1>Поиск экскурсий и приключений</h1>
      <p>Найдите уникальные туры от местных гидов по всему миру</p>
      <form className="search-form">
        <div className="search-bar-banner">
          <input type="text" placeholder="Куда вы хотите поехать?" />
        </div>
        <input 
          type="text" 
          className="date-input" 
          placeholder="Когда? (необязательно)" 
        />
        <button type="submit">Найти</button>
      </form>
    </section>
  );
};

// ==================== КОМПОНЕНТ ПАНЕЛИ ФИЛЬТРОВ ====================
const FiltersPanel = ({
  excursionTypes,
  transportTypes,
  specializations,
  activities,
  languages,
  priceRange,
  selectedTypes,
  selectedTransport,
  selectedSpecializations,
  //selectedCategories,
  selectedActivities,
  selectedLanguages,
  onToggleType,
  onToggleTransport,
  onToggleSpecializations,
  //onToggleCategory,
  onToggleActivity,
  onToggleLanguage,
  showTypeList,
  showTransportList,
  showSpecializationsList,
  //showCategoryList,
  showActivityList,
  showLanguageList,
  onToggleTypeList,
  onToggleTransportList,
  onToggleSpecializationsList,
  //onToggleCategoryList,
  onToggleActivityList,
  onToggleLanguageList,
  onApplyFilters,
  changePrice
}) => {

  return (
    <aside className="filters-panel">
      {/* Тип экскурсии */}
      <CheckboxFilterGroup
        title="Тип тура"
        items={excursionTypes}
        selectedItems={selectedTypes}
        onToggle={onToggleType}
        getItemKey={(type, i) => i}
        getItemLabel={(type) => type}
        isOpen={showTypeList}
        onToggleOpen={onToggleTypeList}
      />

      {/* Длительность */}
      <label>Длительность</label>
      <div className="inline-group">
        <InlineField label="От (часов)" placeholder="1" min="1" max="24" />
        <InlineField label="До (часов)" placeholder="24" min="1" max="24" />
      </div>

      {/* Цена */}
      <label>Цена</label>
      <div className="inline-group">
        <InlineField 
          label="От (₽)" 
          placeholder={priceRange.min_price} 
          min={priceRange.min_price} 
          typeV="min_price"
          fun={changePrice}
        />
        <InlineField 
          label="До (₽)" 
          typeV="max_price"
          placeholder={priceRange.max_price} 
          max={priceRange.max_price} 
          fun={changePrice}
        />
      </div>

      {/* Тип передвижения */}
      <CheckboxFilterGroup
        title="Тип передвижения"
        items={transportTypes}
        selectedItems={selectedTransport}
        onToggle={onToggleTransport}
        getItemKey={(t, i) => i}
        getItemLabel={(t) => t}
        isOpen={showTransportList}
        onToggleOpen={onToggleTransportList}
      />

      {/* Категория */}
      <CheckboxFilterGroup
        title="Категория"
        items={specializations}
        selectedItems={selectedSpecializations}
        onToggle={onToggleSpecializations}
        getItemKey={(spec) => spec.specialization_id}//
        getItemLabel={(spec) => spec.name}
        isOpen={showSpecializationsList}
        onToggleOpen={onToggleSpecializationsList}
      />

      {/* Можно с детьми */}
      <div className="toggle-row">
        <span>Можно с детьми</span>
        <label className="switch">
          <input type="checkbox" />
          <span className="slider"></span>
        </label>
      </div>

      {/* Активность */}
      <CheckboxFilterGroup
        title="Активность"
        items={activities}
        selectedItems={selectedActivities}
        onToggle={onToggleActivity}
        getItemKey={(a, i) => i}
        getItemLabel={(a) => a}
        isOpen={showActivityList}
        onToggleOpen={onToggleActivityList}
      />

      {/* Язык тура */}
      <CheckboxFilterGroup
        title="Язык тура"
        items={languages}
        selectedItems={selectedLanguages}
        onToggle={onToggleLanguage}
        getItemKey={(lang) => lang.name}
        getItemLabel={(lang) => lang.name}
        isOpen={showLanguageList}
        onToggleOpen={onToggleLanguageList}
      />

      {/* Кнопки фильтров */}
      <div className="filter-buttons">
        <button className="filter-button" onClick={onApplyFilters}>
          Показать
        </button>
      </div>
    </aside>
  );
};

// ==================== КОМПОНЕНТ СПИСКА ЭКСКУРСИЙ ====================
const ExcursionList = ({ excursionCards, sort, onSortChange }) => {
  console.log(excursionCards,"afdsgfdgfjhgkj")
  return (
    <section className="excursion-results">
      <div className="results-header">
        <p>Найдено: {excursionCards.length} экскурсии</p>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
          <option value="date">По дате</option>
          <option value="price">По цене</option>
          <option value="duration">По длительности</option>
        </select>
      </div>

      <div className="excursion-list">
        {excursionCards.map((ex) => (
          
          <ExcursionCard key={ex.excursion_id} excursion={ex} />
        ))}
      </div>
    </section>
  );
};

// ==================== ГЛАВНЫЙ КОМПОНЕНТ ====================
const ExcursionsPage = () => {
  // Состояния для фильтров
  const [sort, setSort] = useState("date");
  const [showTypeList, setShowTypeList] = useState(false);
  const [showTransportList, setShowTransportList] = useState(false);
  const [showSpecializationsList, setShowSpecializationsList] = useState(false);
  const [showActivityList, setShowActivityList] = useState(false);
  const [showLanguageList, setShowLanguageList] = useState(false);

  // Выбранные значения фильтров
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Данные для фильтров
  const [excursionCards, setExcursionCards] = useState([1,2,3,4]);
const [priceRange, setPriceRange] = useState({ min_price: null, max_price: null });//
  const [languages, setLanguages] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [excursionTypes, setExcursionTypes] = useState([]);
  const [transportTypes, setTransportTypes] = useState([]);
  const [activities, setActivities] = useState([]);

  // Вспомогательная функция для переключения выбора
  const toggleSelection = (setter, selected, value) => {
    setter(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  // Загрузка карточек экскурсий
  useEffect(() => {
    const loadExcursionCards = async () => {
      try {
        const res = await fetch(`${API_BASE}?method=getExcursionCards`);
        const data = await res.json();
        setExcursionCards(data);
        console.log(data,'afsdg')
        console.log(excursionTypes,'afsdg')
      } catch (err) {
        console.error("Ошибка загрузки карточек:", err);
      }
    };
    loadExcursionCards();
  }, []);

  // Загрузка данных для фильтров
  useEffect(() => {
    const loadData = async (method, setter) => {
      try {
        const res = await fetch(`${API_BASE}?method=${method}${method === "getExcursions" ? `&sort=${sort}` : ""}`);
        const data = await res.json();
        setter(data);
          console.log(data)
      } catch (err) {
        console.error(`Ошибка загрузки ${method}:`, err);
      }
    };

    loadData("getPriceRange", setPriceRange);
    loadData("getLanguages", setLanguages);
    loadData("getSpecializations", setSpecializations);
    loadData("getExcursionTypes", setExcursionTypes);
    loadData("getTransportTypes", setTransportTypes);
    loadData("getActivities", setActivities);
  
  }, [sort]);

  // Применение фильтров
const applyFilters = async () => {
  const filters = {
    types: selectedTypes,
    transport: selectedTransport,
    specializations: selectedSpecializations,
    activities: selectedActivities,
    languages: selectedLanguages,
    minPrice: priceRange.min_price,
    maxPrice: priceRange.max_price,   
  };
  console.log(filters.specializations)
  try {
    const res = await fetch(`${API_BASE}?method=getExcursionsFiltered`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    const result = await res.json();
    
    if (result.success) {
      setExcursionCards(result.data);
      console.log("Успешно загружено:", result.total, "экскурсий");
      console.log("Полученные фильтры сервером:", result.filters_received);
    } else {
      console.error("Ошибка сервера:", result.error);
    }
    
  } catch (err) {
    console.error("Ошибка применения фильтров:", err);
  }
};
function changePrice(type,value){
  setPriceRange(prev => ({
  ...prev, // Копируем все предыдущие значения
  [type]: value // Динамически обновляем нужное поле
}));

}

useEffect(()=>{
  console.log(priceRange.max_price,'asfgdsdhjf3465678')
},[priceRange.max_price])
  return (
    <div className="excursions-page">
      <Banner />
      
      <section className="excursions-content">
        <FiltersPanel
          excursionTypes={excursionTypes}
          transportTypes={transportTypes}
          specializations={specializations}
          activities={activities}
          languages={languages}
          priceRange={priceRange}
          selectedTypes={selectedTypes}
          selectedTransport={selectedTransport}
          selectedSpecializations={selectedSpecializations}
          selectedActivities={selectedActivities}
          selectedLanguages={selectedLanguages}
          onToggleType={(value) => toggleSelection(setSelectedTypes, selectedTypes, value)}
          onToggleTransport={(value) => toggleSelection(setSelectedTransport, selectedTransport, value)}
          onToggleSpecializations={(value) => toggleSelection(setSelectedSpecializations, selectedSpecializations, value)} //хз
          onToggleActivity={(value) => toggleSelection(setSelectedActivities, selectedActivities, value)}
          onToggleLanguage={(value) => toggleSelection(setSelectedLanguages, selectedLanguages, value)}
          showTypeList={showTypeList}
          showTransportList={showTransportList}
          showSpecializationsList={showSpecializationsList}
          showActivityList={showActivityList}
          showLanguageList={showLanguageList}
          onToggleTypeList={() => setShowTypeList(!showTypeList)}
          onToggleTransportList={() => setShowTransportList(!showTransportList)}
          onToggleSpecializationsList={() => setShowSpecializationsList(!showSpecializationsList)}
          onToggleActivityList={() => setShowActivityList(!showActivityList)}
          onToggleLanguageList={() => setShowLanguageList(!showLanguageList)}
          onApplyFilters={applyFilters}
          changePrice={changePrice}
        />
        
        <ExcursionList
          excursionCards={excursionCards}
          sort={sort}
          onSortChange={setSort}
        />
      </section>
    </div>
  );
};

export default ExcursionsPage;