import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/adminExcursionForm.css";

const API_BASE = "http://localhost/globalgid2/public/backend/admin.php";
const CLIENT_API_BASE = "http://localhost/globalgid2/public/backend/api.php";

export default function AdminExcursionForm({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    guide_id: '',
    duration: '',
    price: '',
    type: '',
    transport_type: '',
    status: 'hidden',
    count_seats: '',
    children: false,
    activity: '',
    date_event: '',
    location_id: '',
    specialization_id: '',
    language_id: ''
  });

  const [guides, setGuides] = useState([]);
  const [locations, setLocations] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [excursionTypes, setExcursionTypes] = useState([]);
  const [transportTypes, setTransportTypes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Проверка прав администратора
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Загрузка данных для формы
  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      
      // Загружаем справочники
      const [guidesRes, locationsRes, specsRes, langsRes, typesRes, transportRes, activitiesRes] = 
        await Promise.all([
          fetch(`${API_BASE}?method=getAdminGuides`, { credentials: "include" }),
          fetch(`${API_BASE}?method=getAdminLocations`, { credentials: "include" }),
          fetch(`${CLIENT_API_BASE}?method=getSpecializations`),
          fetch(`${CLIENT_API_BASE}?method=getLanguages`),
          fetch(`${CLIENT_API_BASE}?method=getExcursionTypes`),
          fetch(`${CLIENT_API_BASE}?method=getTransportTypes`),
          fetch(`${CLIENT_API_BASE}?method=getActivities`)
        ]);

      const guidesData = await guidesRes.json();
      const locationsData = await locationsRes.json();
      const specsData = await specsRes.json();
      const langsData = await langsRes.json();
      const typesData = await typesRes.json();
      const transportData = await transportRes.json();
      const activitiesData = await activitiesRes.json();

      if (guidesData.success) setGuides(guidesData.data);
      if (locationsData.success) setLocations(locationsData.data);
      setSpecializations(specsData);
      setLanguages(langsData);
      setExcursionTypes(typesData);
      setTransportTypes(transportData);
      setActivities(activitiesData);

      // Если редактирование - загружаем данные экскурсии
      if (isEdit) {
        const excursionRes = await fetch(`${API_BASE}?method=getAdminExcursion&id=${id}`, {
          credentials: "include"
        });
        const excursionData = await excursionRes.json();
        
        if (excursionData.success) {
          const ex = excursionData.data;
          setFormData({
            title: ex.title || '',
            description: ex.description || '',
            guide_id: ex.guide_id || '',
            duration: ex.duration || '',
            price: ex.price || '',
            type: ex.type || '',
            transport_type: ex.transport_type || '',
            status: ex.status || 'hidden',
            count_seats: ex.count_seats || '',
            children: ex.children ? true : false,
            activity: ex.activity || '',
            date_event: ex.date_event || '',
            location_id: ex.location_id || '',
            specialization_id: ex.specialization_id || '',
            language_id: ex.language_id || ''
          });
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = isEdit ? 'updateAdminExcursion' : 'createAdminExcursion';
      const payload = {
        ...formData,
        excursion_id: isEdit ? parseInt(id) : undefined
      };

      if (!isEdit) {
        delete payload.excursion_id;
      }

      const response = await fetch(`${API_BASE}?method=${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        navigate('/admin/excursions');
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      setError("Ошибка сохранения данных");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-form-loading">Загрузка...</div>;
  }

  return (
    <div className="admin-excursion-form-page">
      <div className="admin-form-header">
        <h1>{isEdit ? 'Редактирование экскурсии' : 'Создание новой экскурсии'}</h1>
        <button onClick={() => navigate('/admin/excursions')} className="btn-back">
          ← Назад к списку
        </button>
      </div>

      {error && (
        <div className="form-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="admin-excursion-form">
        <div className="form-row">
          <div className="form-group">
            <label>Заголовок *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Гид *</label>
            <select
              name="guide_id"
              value={formData.guide_id}
              onChange={handleChange}
              required
            >
              <option value="">Выберите гида</option>
              {guides.map(guide => (
                <option key={guide.guide_id} value={guide.guide_id}>
                  {guide.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Локация</label>
            <select
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
            >
              <option value="">Выберите локацию</option>
              {locations.map(location => (
                <option key={location.location_id} value={location.location_id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Длительность (часов) *</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Цена (₽) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Количество мест *</label>
            <input
              type="number"
              name="count_seats"
              value={formData.count_seats}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Тип экскурсии *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Выберите тип</option>
              {excursionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Тип передвижения *</label>
            <select
              name="transport_type"
              value={formData.transport_type}
              onChange={handleChange}
              required
            >
              <option value="">Выберите тип</option>
              {transportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Активность *</label>
            <select
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              required
            >
              <option value="">Выберите уровень</option>
              {activities.map(activity => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата проведения *</label>
            <input
              type="date"
              name="date_event"
              value={formData.date_event}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Категория</label>
            <select
              name="specialization_id"
              value={formData.specialization_id}
              onChange={handleChange}
            >
              <option value="">Выберите категорию</option>
              {specializations.map(spec => (
                <option key={spec.specialization_id} value={spec.specialization_id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Язык</label>
            <select
              name="language_id"
              value={formData.language_id}
              onChange={handleChange}
            >
              <option value="">Выберите язык</option>
              {languages.map(lang => (
                <option key={lang.language_id} value={lang.language_id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Статус</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Активна</option>
              <option value="hidden">Скрыта</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="children"
                checked={formData.children}
                onChange={handleChange}
              />
              Можно с детьми
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/excursions')} className="btn-cancel">
            Отмена
          </button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать экскурсию')}
          </button>
        </div>
      </form>
    </div>
  );
}

