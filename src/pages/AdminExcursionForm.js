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
    program: '',
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
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
            program: ex.program || '',
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
          
          // Загружаем изображения экскурсии
          const detailRes = await fetch(`http://localhost/globalgid2/public/backend/excursions/detail.php?id=${id}`);
          const detailData = await detailRes.json();
          if (detailData.success && detailData.images) {
            setImages(detailData.images);
          }
          
          // Очищаем выбранные файлы при редактировании
          setSelectedFiles([]);
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
      // Заменяем множественные пробелы на один
      processedValue = value.replace(/\s{2,}/g, ' ');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const uploadImages = async (excursionId, files) => {
    setUploadingImages(true);
    try {
      const formData = new FormData();
      formData.append('excursion_id', excursionId);
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images[]', files[i]);
      }
      
      const response = await fetch('http://localhost/globalgid2/public/backend/upload_excursion_images.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Обновляем список изображений
        setImages(prev => [...prev, ...data.uploaded]);
      } else {
        console.error('Ошибка загрузки изображений:', data.error);
      }
    } catch (err) {
      console.error('Ошибка загрузки изображений:', err);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Удалить это изображение?')) return;
    
    try {
      const response = await fetch('http://localhost/globalgid2/public/backend/delete_excursion_image.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image_id: imageId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImages(prev => prev.filter(img => img.image_id !== imageId));
      } else {
        alert('Ошибка удаления изображения: ' + data.error);
      }
    } catch (err) {
      console.error('Ошибка удаления изображения:', err);
    }
  };

  // Обработка выбора файлов
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Проверка типа
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`Файл ${file.name} имеет недопустимый тип. Разрешены только изображения.`);
        return false;
      }
      
      // Проверка размера (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`Файл ${file.name} слишком большой (максимум 5MB).`);
        return false;
      }
      
      return true;
    });
    
    // Создаем preview URL для каждого файла
    const filesWithPreview = validFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file)
      });
      return fileWithPreview;
    });
    
    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
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

  // Удаление файла из предварительного списка
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => {
      // Освобождаем URL объект для удаляемого файла
      const fileToRemove = prev[index];
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Очистка URL объектов при размонтировании компонента
  useEffect(() => {
    return () => {
      // Освобождаем все URL объекты при размонтировании
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Валидация на клиенте
    const title = formData.title.trim();
    if (title.length < 2) {
      setError('Заголовок должен содержать минимум 2 символа');
      setSaving(false);
      return;
    }

      // Проверка длительности (не более 24 часов)
  if (parseInt(formData.duration) > 24) {
    setError('Длительность не может быть больше 24 часов');
    setSaving(false);
    return;
  }

    // Проверка обязательных полей
    if (!formData.location_id) {
      setError('Поле "Локация" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (!formData.specialization_id) {
      setError('Поле "Категория" обязательно для заполнения');
      setSaving(false);
      return;
    }

    if (!formData.language_id) {
      setError('Поле "Язык" обязательно для заполнения');
      setSaving(false);
      return;
    }

    // Проверка даты (не должна быть в прошлом)
    if (formData.date_event) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(formData.date_event);
      if (eventDate < today) {
        setError('Дата проведения не может быть в прошлом');
        setSaving(false);
        return;
      }
    }

    // Проверка на наличие хотя бы одного изображения при создании
    if (!isEdit && selectedFiles.length === 0 && images.length === 0) {
      setError('Необходимо добавить хотя бы одно изображение');
      setSaving(false);
      return;
    }

    try {
      const method = isEdit ? 'updateAdminExcursion' : 'createAdminExcursion';
      const payload = {
        ...formData,
        title: title,
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
        const excursionId = isEdit ? parseInt(id) : data.excursion_id;
        
        // Загружаем изображения, если они были выбраны
        if (selectedFiles.length > 0) {
          await uploadImages(excursionId, selectedFiles);
        }
        
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
              minLength={2}
              maxLength={60}
            />
            <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
              {formData.title.length}/60 символов
            </small>
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
              maxLength={3000}
            />
            <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
              {formData.description.length}/3000 символов
            </small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Программа</label>
            <textarea
              name="program"
              value={formData.program}
              onChange={handleChange}
              rows="8"
              maxLength={2000}
            />
            <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
              {formData.program.length}/2000 символов
            </small>
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
            <label>Локация *</label>
            <select
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              required
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
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Категория *</label>
            <select
              name="specialization_id"
              value={formData.specialization_id}
              onChange={handleChange}
              required
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
            <label>Язык *</label>
            <select
              name="language_id"
              value={formData.language_id}
              onChange={handleChange}
              required
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

        {/* Загрузка изображений */}
        <div className="form-row">
          <div className="form-group full-width">
            <label>Изображения экскурсии</label>
            
            {/* Drag & Drop зона */}
            <div
              className={`image-upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p className="upload-zone-text">
                  Перетащите изображения сюда или
                </p>
                <label className="upload-zone-button">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files);
                        e.target.value = ''; // Сбрасываем input для возможности повторного выбора того же файла
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  Выбрать файлы
                </label>
                <small className="upload-zone-hint">
                  JPG, PNG, GIF, WebP (максимум 5MB каждое)
                </small>
              </div>
            </div>

            {/* Предпросмотр выбранных файлов */}
            {selectedFiles.length > 0 && (
              <div className="selected-files-preview">
                <p className="selected-files-count">Выбрано изображений: {selectedFiles.length}</p>
                <div className="selected-files-grid">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="selected-file-item">
                      <img 
                        src={file.preview || URL.createObjectURL(file)} 
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeSelectedFile(index)}
                        title="Удалить"
                      >
                        ×
                      </button>
                      <div className="file-name">{file.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Отображение загруженных изображений (при редактировании) */}
        {isEdit && images.length > 0 && (
          <div className="form-row">
            <div className="form-group full-width">
              <label>Загруженные изображения</label>
              <div className="images-preview">
                {images.map((img) => (
                  <div key={img.image_id} className="image-preview-item">
                    <img 
                      src={`http://localhost/globalgid2/public/${img.image_path}`} 
                      alt="Preview"
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() => handleDeleteImage(img.image_id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

