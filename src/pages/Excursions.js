import React, { useState, useEffect } from "react";
import cardImg from '../components/images/card.jpg';
import { DateRange } from "react-date-range";
import { useLocation } from "react-router-dom";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { ru } from "date-fns/locale";
import "../styles/excursions.css";

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
const Banner = ({ searchQuery, onSearchChange, dateRange, setDateRange, onSearchSubmit }) => {
  const [openCalendar, setOpenCalendar] = useState(false);
  

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit();
  };

  const formatRange = () => {
    const start = dateRange[0].startDate;
    const end = dateRange[0].endDate;
    

    if (!start || !end) return "Когда? (необязательно)";

    return `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;
  };

  return (
  <section className="banner banner--excursions">
      <h1>Поиск экскурсий и приключений</h1>
      <p>Найдите уникальные туры от местных гидов по всему миру</p>

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
            placeholder="Куда вы хотите поехать?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
            {searchQuery && (
    <button
      type="button"
      className="clear-date-btn"
      onClick={() => onSearchChange("")}
    >
      ×
    </button>
  )}
        </div>

        {/* Поле выбора даты */}
        <div className="date-input-wrapper">
<input
  type="text"
  className={`date-input ${!dateRange[0].startDate ? "placeholder-style" : ""}`}
  readOnly
  value={formatRange()}
  onClick={() => setOpenCalendar(!openCalendar)}
/>

  {/* Кнопка очистки дат */}
  {dateRange[0].startDate && (
    <button
      type="button"
      className="clear-date-btn"
      onClick={(e) => {
        e.stopPropagation(); // чтобы не открывался календарь
        setDateRange([
          {
            startDate: null,
            endDate: null,
            key: "selection"
          }
        ]);
      }}
    >
      ×
    </button>
  )}

          {openCalendar && (
            <div className="calendar-popup">
              <DateRange
                locale={ru}
                editableDateInputs={true}
                onChange={(item) => setDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
              />
            </div>
          )}
        </div>

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
  durationRange, //
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
  changePrice,
  changeDuration, //
  withChildren,
  setWithChildren //дети
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
  <InlineField
    label="От (часов)"
    typeV="min_duration"
    placeholder="1"
    min="1"
    max="24"
    fun={changeDuration}
  />
  <InlineField
    label="До (часов)"
    typeV="max_duration"
    placeholder="24"
    min="1"
    max="24"
    fun={changeDuration}
  />
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
    <input
      type="checkbox"
      checked={withChildren}
      onChange={(e) => setWithChildren(e.target.checked)}
    />
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

    // ✅ создаём отсортированную копию массива
const sortedCards = React.useMemo(() => {
  return [...excursionCards].sort((a, b) => {
    if (sort === "price_desc") return b.price - a.price;     // дороже → дешевле
    if (sort === "price_asc") return a.price - b.price;      // дешевле → дороже
    if (sort === "duration") return a.duration - b.duration; // короче → длиннее
    return 0;
  });
}, [excursionCards, sort]);

  return (
    <section className="excursion-results">
      <div className="results-header">
        <p>Найдено: {excursionCards.length} экскурсии</p>
<select value={sort} onChange={(e) => onSortChange(e.target.value)}>
  <option value="price_asc">Сначала дешевле</option>
  <option value="price_desc">Сначала дороже</option>
  <option value="duration">По длительности</option>
</select>

      </div>

      <div className="excursion-list">
        {sortedCards.map((ex) => (
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
  const [withChildren, setWithChildren] = useState(false);//дети

  // Выбранные значения фильтров
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Данные для фильтров
  const [excursionCards, setExcursionCards] = useState([]);

  //const [excursionCards, setExcursionCards] = useState([1,2,3,4]);
const [priceRange, setPriceRange] = useState({ min_price: null, max_price: null });
const [durationRange, setDurationRange] = useState({ min_duration: null,max_duration: null });//
  const [languages, setLanguages] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [excursionTypes, setExcursionTypes] = useState([]);
  const [transportTypes, setTransportTypes] = useState([]);
  const [activities, setActivities] = useState([]);

  //поисковик
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");// мб не надо
const [dateRange, setDateRange] = useState([
  {
    startDate: null,
    endDate: null,
    key: 'selection'
  }
]);

const parseLocalDate = (str) => {
  if (!str) return null;
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
};

  // ✅ импортируем параметры из URL
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const initialLocation = params.get("location") || "";
  const initialStart = params.get("start") || null;
  const initialEnd = params.get("end") || null;

    //читаем параме и применяем фильтры
useEffect(() => {
  if (initialLocation) setSearchQuery(initialLocation);

  if (initialStart || initialEnd) {
    setDateRange([
      {
        startDate: initialStart ? parseLocalDate(initialStart) : null,
        endDate: initialEnd ? parseLocalDate(initialEnd) : null,
        key: "selection"
      }
    ]); 
  }
}, []); 

useEffect(() => {
  const hasLocation = searchQuery.trim() !== "";
  const hasStart = !!dateRange[0].startDate;
  const hasEnd = !!dateRange[0].endDate;

  if (hasLocation || hasStart || hasEnd) {
    applyFilters();
  }
}, [searchQuery, dateRange]);

  console.log("URL params:", { initialLocation, initialStart, initialEnd });


    const formatLocalDate = (d) =>
        d
            ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                  .toISOString()
                  .split("T")[0]
            : null;

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
  const start = dateRange[0].startDate;
  const end = dateRange[0].endDate;

  const filters = {
    types: selectedTypes,
    transport: selectedTransport,
    specializations: selectedSpecializations,
    activities: selectedActivities,
    languages: selectedLanguages,
    minPrice: priceRange.min_price,
    maxPrice: priceRange.max_price,
    minDuration: durationRange.min_duration,
    maxDuration: durationRange.max_duration,
    withChildren: withChildren ? 1 : null,

    // ✅ Поиск по локации
    locationQuery: searchQuery.trim() !== "" ? searchQuery.trim() : null,

    // ❌ УДАЛЕНО: dateQuery (его больше нет)
    // dateQuery: searchDate.trim() !== "" ? searchDate.trim() : null,

    // ✅ Даты из календаря
    dateStart: formatLocalDate(start),
    dateEnd: formatLocalDate(end),
  };

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
//по аналогии для длительности
function changeDuration(type, value) {
  setDurationRange(prev => ({
    ...prev,
    [type]: value
  }));
}


useEffect(()=>{
  console.log(priceRange.max_price,'asfgdsdhjf3465678')
},[priceRange.max_price])
  return (
    <div className="excursions-page">
<Banner
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  dateRange={dateRange}
  setDateRange={setDateRange}
  onSearchSubmit={applyFilters}
/>

      
      <section className="excursions-content">
        <FiltersPanel
          excursionTypes={excursionTypes}
          transportTypes={transportTypes}
          specializations={specializations}
          activities={activities}
          languages={languages}
          priceRange={priceRange}
          durationRange={durationRange} //
          withChildren={withChildren} //дети
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
          changeDuration={changeDuration} //
          setWithChildren={setWithChildren} // дети
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