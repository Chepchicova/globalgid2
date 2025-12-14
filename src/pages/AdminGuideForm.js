import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/adminExcursionForm.css";

const API_BASE = "http://localhost/globalgid2/public/backend/admin.php";
const CLIENT_API_BASE = "http://localhost/globalgid2/public/backend/api.php";
const UPLOAD_IMAGE_URL = "http://localhost/globalgid2/public/backend/upload_guide_image.php";

export default function AdminGuideForm({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    firstname_guide: '',
    lastname_guide: '',
    emailG: '',
    bio: '',
    status: 'active',
    location_id: ''
  });

  const [locations, setLocations] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ city: '', country: '' });
  const [showNewSpecialization, setShowNewSpecialization] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState({ name: '' });
  const [showNewLanguage, setShowNewLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState({ name: '' });
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      const [locationsRes, specsRes, langsRes] = 
        await Promise.all([
          fetch(`${API_BASE}?method=getAdminLocations`, { credentials: "include" }),
          fetch(`${CLIENT_API_BASE}?method=getSpecializations`),
          fetch(`${CLIENT_API_BASE}?method=getLanguages`)
        ]);

      const locationsData = await locationsRes.json();
      const specsData = await specsRes.json();
      const langsData = await langsRes.json();

      if (locationsData.success) setLocations(locationsData.data);
      setSpecializations(specsData);
      setLanguages(langsData);

      // Если редактирование - загружаем данные гида
      if (isEdit) {
        const guideRes = await fetch(`${API_BASE}?method=getAdminGuide&id=${id}`, {
          credentials: "include"
        });
        const guideData = await guideRes.json();
        
        if (guideData.success) {
          const g = guideData.data;
          setFormData({
            firstname_guide: g.firstname_guide || '',
            lastname_guide: g.lastname_guide || '',
            emailG: g.emailG || '',
            bio: g.bio || '',
            status: g.status || 'active',
            location_id: g.location_id || ''
          });
          
          // Устанавливаем выбранные специализации и языки
          setSelectedSpecializations(g.specializations || []);
          setSelectedLanguages(g.languages || []);
          
          // Загружаем изображение гида
          if (g.image) {
            setImage(g.image);
          }
          
          // Очищаем выбранный файл при редактировании
          setSelectedFile(null);
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
    
    // Ограничение на двойные пробелы для текстовых полей
    let processedValue = value;
    if (type === 'text' || type === 'textarea') {
      processedValue = value.replace(/\s{2,}/g, ' ');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const handleSpecializationToggle = (specId) => {
    setSelectedSpecializations(prev => {
      if (prev.includes(specId)) {
        return prev.filter(id => id !== specId);
      } else {
        return [...prev, specId];
      }
    });
  };

  const handleLanguageToggle = (langId) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langId)) {
        return prev.filter(id => id !== langId);
      } else {
        return [...prev, langId];
      }
    });
  };

  const uploadImage = async (guideId, file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('guide_id', guideId);
      formData.append('image', file);
      
      const response = await fetch(UPLOAD_IMAGE_URL, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.uploaded && data.uploaded.length > 0) {
        setImage(data.uploaded[0]);
        setSelectedFile(null);
      } else {
        console.error('Ошибка загрузки изображения:', data.error || data.errors);
        setError('Ошибка загрузки изображения');
      }
    } catch (err) {
      console.error('Ошибка загрузки изображения:', err);
      setError('Ошибка загрузки изображения');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Удалить это изображение?')) return;
    
    try {
      // Удаляем изображение из состояния
      setImage(null);
      
      // Здесь можно добавить вызов API для удаления изображения из БД
      // Пока просто удаляем из состояния
    } catch (err) {
      console.error('Ошибка удаления изображения:', err);
    }
  };

  // Обработка выбора файла
  const handleFileSelect = (files) => {
    const file = files[0]; // Только один файл
    
    if (!file) return;
    
    // Проверка типа
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(`Файл ${file.name} имеет недопустимый тип. Разрешены только изображения.`);
      return;
    }
    
    // Проверка размера (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Файл ${file.name} слишком большой (максимум 5MB).`);
      return;
    }
    
    // Создаем preview URL
    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file)
    });
    
    setSelectedFile(fileWithPreview);
  };

  // Обработка drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Очистка URL объекта при размонтировании компонента
  useEffect(() => {
    return () => {
      if (selectedFile && selectedFile.preview) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Валидация на клиенте
    if (!formData.firstname_guide.trim()) {
      setError('Поле "Имя" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (!formData.lastname_guide.trim()) {
      setError('Поле "Фамилия" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (!formData.emailG.trim()) {
      setError('Поле "Email" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (!showNewLocation && !formData.location_id) {
      setError('Поле "Локация" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (showNewLocation) {
      if (!newLocation.city.trim()) {
        setError('Поле "Город" обязательно для заполнения');
        setSaving(false);
        return;
      }
      if (!newLocation.country.trim()) {
        setError('Поле "Страна" обязательно для заполнения');
        setSaving(false);
        return;
      }
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailG.trim())) {
      setError('Некорректный email');
      setSaving(false);
      return;
    }

    try {
      let guideId;
      let finalLocationId = formData.location_id;

      // Если выбрана новая локация, создаем её
      if (showNewLocation) {
        const locationRes = await fetch(`${API_BASE}?method=createLocation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            city: newLocation.city.trim(),
            country: newLocation.country.trim()
          })
        });

        const locationData = await locationRes.json();

        if (locationData.success) {
          finalLocationId = locationData.location_id;
          // Обновляем список локаций
          const locationsRes = await fetch(`${API_BASE}?method=getAdminLocations`, { credentials: "include" });
          const locationsData = await locationsRes.json();
          if (locationsData.success) setLocations(locationsData.data);
        } else {
          setError(locationData.error || 'Ошибка создания локации');
          setSaving(false);
          return;
        }
      }

      if (isEdit) {
        // Обновление гида
        const updateData = {
          guide_id: id,
          firstname_guide: formData.firstname_guide.trim(),
          lastname_guide: formData.lastname_guide.trim(),
          emailG: formData.emailG.trim(),
          bio: formData.bio || null,
          status: formData.status,
          location_id: finalLocationId,
          specializations: selectedSpecializations,
          languages: selectedLanguages
        };

        const response = await fetch(`${API_BASE}?method=updateAdminGuide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
          guideId = id;
        } else {
          setError(data.error || 'Ошибка обновления');
          setSaving(false);
          return;
        }
      } else {
        // Создание гида
        const createData = {
          firstname_guide: formData.firstname_guide.trim(),
          lastname_guide: formData.lastname_guide.trim(),
          emailG: formData.emailG.trim(),
          bio: formData.bio || null,
          status: formData.status,
          location_id: finalLocationId,
          specializations: selectedSpecializations,
          languages: selectedLanguages
        };

        const response = await fetch(`${API_BASE}?method=createAdminGuide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(createData)
        });

        const data = await response.json();

        if (data.success) {
          guideId = data.guide_id;
        } else {
          setError(data.error || 'Ошибка создания');
          setSaving(false);
          return;
        }
      }

      // Загружаем изображение, если выбран новый файл
      if (selectedFile) {
        await uploadImage(guideId, selectedFile);
      }

      // Перенаправляем на страницу списка гидов
      navigate('/admin/guides');
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
        <h1>{isEdit ? 'Редактирование гида' : 'Создание нового гида'}</h1>
        <button onClick={() => navigate('/admin/guides')} className="btn-back">
          ← Назад к списку
        </button>
      </div>

      {error && (
        <div className="form-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="admin-excursion-form">
        <div className="form-row">
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              name="firstname_guide"
              value={formData.firstname_guide}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Фамилия *</label>
            <input
              type="text"
              name="lastname_guide"
              value={formData.lastname_guide}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="emailG"
              value={formData.emailG}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label>Локация *</label>
            <select
              name="location_id"
              value={showNewLocation ? 'new' : formData.location_id}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setShowNewLocation(true);
                  setFormData(prev => ({ ...prev, location_id: '' }));
                } else {
                  setShowNewLocation(false);
                  setFormData(prev => ({ ...prev, location_id: e.target.value }));
                }
              }}
              required={!showNewLocation}
            >
              <option value="">Выберите локацию</option>
              {locations.map(location => (
                <option key={location.location_id} value={location.location_id}>
                  {location.name}
                </option>
              ))}
              <option value="new">+ Добавить новую локацию</option>
            </select>
            
            {showNewLocation && (
              <div style={{marginTop: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9'}}>
                <div style={{marginBottom: '10px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Город *</label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Введите город"
                    maxLength={100}
                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                    required
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Страна *</label>
                  <input
                    type="text"
                    value={newLocation.country}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Введите страну"
                    maxLength={100}
                    style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewLocation(false);
                    setNewLocation({ city: '', country: '' });
                    setFormData(prev => ({ ...prev, location_id: '' }));
                  }}
                  style={{marginTop: '10px', padding: '6px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Биография</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="6"
              maxLength={2000}
            />
            <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
              {formData.bio.length}/2000 символов
            </small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Специализации</label>
            <div className="checkbox-group" style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
              {specializations.map(spec => (
                <label key={spec.specialization_id} style={{display: 'flex', alignItems: 'center', marginBottom: '8px', width: '100%', textAlign: 'left'}}>
                  <input
                    type="checkbox"
                    checked={selectedSpecializations.includes(spec.specialization_id)}
                    onChange={() => handleSpecializationToggle(spec.specialization_id)}
                    style={{marginRight: '8px', flexShrink: 0}}
                  />
                  <span>{spec.name}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNewSpecialization(true)}
              style={{marginTop: '10px', padding: '6px 12px', background: '#44706d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}
            >
              + Добавить специализацию
            </button>
            
            {showNewSpecialization && (
              <div style={{marginTop: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Название специализации *</label>
                <input
                  type="text"
                  value={newSpecialization.name}
                  onChange={(e) => setNewSpecialization({ name: e.target.value })}
                  placeholder="Введите название специализации"
                  maxLength={100}
                  style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px'}}
                />
                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newSpecialization.name.trim()) {
                        setError('Поле "Название" обязательно для заполнения');
                        return;
                      }
                      try {
                        const res = await fetch(`${API_BASE}?method=createSpecialization`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ name: newSpecialization.name.trim() })
                        });
                        const data = await res.json();
                        if (data.success) {
                          // Обновляем список специализаций
                          const specsRes = await fetch(`${CLIENT_API_BASE}?method=getSpecializations`);
                          const specsData = await specsRes.json();
                          setSpecializations(specsData);
                          // Автоматически выбираем новую специализацию
                          handleSpecializationToggle(data.specialization_id);
                          setShowNewSpecialization(false);
                          setNewSpecialization({ name: '' });
                        } else {
                          setError(data.error || 'Ошибка создания специализации');
                        }
                      } catch (err) {
                        setError('Ошибка создания специализации');
                      }
                    }}
                    style={{padding: '6px 12px', background: '#44706d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px'}}
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSpecialization(false);
                      setNewSpecialization({ name: '' });
                    }}
                    style={{padding: '6px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Языки</label>
            <div className="checkbox-group" style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
              {languages.map(lang => (
                <label key={lang.language_id} style={{display: 'flex', alignItems: 'center', marginBottom: '8px', width: '100%', textAlign: 'left'}}>
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.language_id)}
                    onChange={() => handleLanguageToggle(lang.language_id)}
                    style={{marginRight: '8px', flexShrink: 0}}
                  />
                  <span>{lang.name}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNewLanguage(true)}
              style={{marginTop: '10px', padding: '6px 12px', background: '#44706d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}
            >
              + Добавить язык
            </button>
            
            {showNewLanguage && (
              <div style={{marginTop: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Название языка *</label>
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ name: e.target.value })}
                  placeholder="Введите название языка"
                  maxLength={100}
                  style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px'}}
                />
                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newLanguage.name.trim()) {
                        setError('Поле "Название" обязательно для заполнения');
                        return;
                      }
                      try {
                        const res = await fetch(`${API_BASE}?method=createLanguage`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ name: newLanguage.name.trim() })
                        });
                        const data = await res.json();
                        if (data.success) {
                          // Обновляем список языков
                          const langsRes = await fetch(`${CLIENT_API_BASE}?method=getLanguages`);
                          const langsData = await langsRes.json();
                          setLanguages(langsData);
                          // Автоматически выбираем новый язык
                          handleLanguageToggle(data.language_id);
                          setShowNewLanguage(false);
                          setNewLanguage({ name: '' });
                        } else {
                          setError(data.error || 'Ошибка создания языка');
                        }
                      } catch (err) {
                        setError('Ошибка создания языка');
                      }
                    }}
                    style={{padding: '6px 12px', background: '#44706d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px'}}
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewLanguage(false);
                      setNewLanguage({ name: '' });
                    }}
                    style={{padding: '6px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{maxWidth: '200px'}}>
            <label>Статус</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Активен</option>
              <option value="inactive">Неактивен</option>
            </select>
          </div>
        </div>

        {/* Загрузка изображения */}
        <div className="form-row">
          <div className="form-group full-width">
            <label>Фото гида (только одно)</label>
            
            {/* Существующее изображение */}
            {image && !selectedFile && (
              <div className="image-preview-item" style={{marginBottom: '10px', width: '200px', height: '200px', display: 'inline-block', position: 'relative', cursor: 'pointer'}}>
                <img 
                  src={`http://localhost/globalgid2/public/${image.image_path}`}
                  alt="Guide"
                  style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}}
                  onClick={() => document.getElementById('guide-image-input').click()}
                />
                <input
                  id="guide-image-input"
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.image_id);
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Предварительный просмотр выбранного файла */}
            {selectedFile && (
              <div className="image-preview-item" style={{marginBottom: '10px', width: '200px', height: '200px', display: 'inline-block', position: 'relative', cursor: 'pointer'}}>
                <img 
                  src={selectedFile.preview}
                  alt="Preview"
                  style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}}
                  onClick={() => document.getElementById('guide-image-input').click()}
                />
                <input
                  id="guide-image-input"
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    URL.revokeObjectURL(selectedFile.preview);
                    setSelectedFile(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Зона загрузки */}
            {!image && !selectedFile && (
              <div
                className={`image-upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('guide-image-input').click()}
                style={{padding: '20px', marginTop: '10px'}}
              >
                <input
                  id="guide-image-input"
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="upload-zone-content">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className="upload-zone-text" style={{margin: '5px 0'}}>Перетащите изображение сюда или</p>
                  <label className="upload-zone-button" style={{margin: '5px 0'}}>
                    Выбрать файл
                  </label>
                  <small className="upload-zone-hint" style={{marginTop: '5px', fontSize: '12px'}}>
                    Только одно изображение (JPG, PNG, GIF, WEBP, максимум 5MB)
                  </small>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/guides')} className="btn-cancel">
            Отмена
          </button>
          <button type="submit" className="btn-save" disabled={saving || uploadingImage}>
            {saving || uploadingImage ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать гида')}
          </button>
        </div>
      </form>
    </div>
  );
}

