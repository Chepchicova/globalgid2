import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminExcursions.css";

const API_BASE = "http://localhost/globalgid2/public/backend/admin/admin.php";

export default function AdminExcursions({ user }) {
  const navigate = useNavigate();
  const [excursions, setExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);

  // Проверка прав администратора
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Загрузка экскурсий
  useEffect(() => {
    loadExcursions();
  }, []);

  const loadExcursions = async (search = searchQuery) => {
    try {
      setLoading(true);
      console.log("Загрузка экскурсий, поиск:", search);
      
      const response = await fetch(`${API_BASE}?method=getAdminExcursions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ search: search || '' })
      });
      
      console.log("Статус ответа:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка HTTP:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Ответ сервера:", text.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        console.error("Полный ответ:", text);
        throw new Error("Сервер вернул некорректный JSON");
      }
      
      console.log("Данные:", data);
      
      if (data.success) {
        setExcursions(data.data || []);
        console.log("Загружено экскурсий:", data.data?.length || 0);
      } else {
        console.error("Ошибка от сервера:", data.error);
        setExcursions([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки экскурсий:", error);
      setExcursions([]);
    } finally {
      setLoading(false);
    }
  };

  // Поиск
  const handleSearch = () => {
    loadExcursions(searchQuery);
  };

  // Редактирование
  const handleEdit = (id) => {
    navigate(`/admin/excursions/edit/${id}`);
  };

  // Переключение статуса (скрыть/показать)
  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE}?method=toggleAdminExcursionStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ excursion_id: id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadExcursions();
      }
    } catch (error) {
      console.error("Ошибка изменения статуса:", error);
    }
  };

  // Удаление
  const handleDelete = async () => {
    if (!deleteModal) return;
    
    try {
      const response = await fetch(`${API_BASE}?method=deleteAdminExcursion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ excursion_id: deleteModal })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteModal(null);
        loadExcursions();
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  return (
    <div className="admin-excursions-page">
      <div className="admin-excursions-header">
        <h1>Управление экскурсиями</h1>
        <button 
          className="btn-add"
          onClick={() => navigate('/admin/excursions/create')}
        >
          + Добавить экскурсию
        </button>
      </div>

      {/* Поисковик */}
      <div className="admin-search">
        <input
          type="text"
          placeholder="Поиск по локации или гиду..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch}>Найти</button>
      </div>

      {/* Таблица */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Локация</th>
              <th>Дата проведения</th>
              <th>Гид</th>
              <th>Статус</th>
              <th>Дата добавления</th>
              <th>Дата изменения</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {excursions.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">Нет данных</td>
              </tr>
            ) : (
              excursions.map((excursion) => (
                <tr key={excursion.excursion_id}>
                  <td>{excursion.excursion_id}</td>
                  <td>{excursion.title}</td>
                  <td>{excursion.location_name || excursion.location_id || '-'}</td>
                  <td>{formatDateOnly(excursion.date_event)}</td>
                  <td>{excursion.guide_name || excursion.guide_id || '-'}</td>
                  <td>
                    <span className={`status-badge ${excursion.status}`}>
                      {excursion.status === 'active' ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td>
                    <div>{formatDateOnly(excursion.created_at)}</div>
                    <div style={{fontSize: '12px', color: '#999', marginTop: '4px'}}>{formatTimeOnly(excursion.created_at)}</div>
                  </td>
                  <td>
                    <div>{formatDateOnly(excursion.updated_at)}</div>
                    <div style={{fontSize: '12px', color: '#999', marginTop: '4px'}}>{formatTimeOnly(excursion.updated_at)}</div>
                  </td>

                  <td className="actions-cell">
  <div>
    <button
      className="action-btn edit-btn"
      onClick={() => handleEdit(excursion.excursion_id)}
      title="Редактировать"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M11.333 2.00001C11.5084 1.82475 11.7163 1.68607 11.9448 1.59231C12.1733 1.49854 12.4179 1.45166 12.6663 1.45166C12.9148 1.45166 13.1594 1.49854 13.3879 1.59231C13.6164 1.68607 13.8243 1.82475 13.9997 2.00001C14.175 2.17537 14.3136 2.3833 14.4074 2.6118C14.5012 2.8403 14.5481 3.08488 14.5481 3.33334C14.5481 3.5818 14.5012 3.82638 14.4074 4.05488C14.3136 4.28338 14.175 4.49131 13.9997 4.66668L5.33301 13.3333L1.33301 14.6667L2.66634 10.6667L11.333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
    <button
      className="action-btn eye-btn"
      onClick={() => handleToggleStatus(excursion.excursion_id)}
      title={excursion.status === 'active' ? 'Скрыть' : 'Показать'}
    >
      {excursion.status === 'active' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3.33334C3.33334 3.33334 1.33334 8 1.33334 8C1.33334 8 3.33334 12.6667 8 12.6667C12.6667 12.6667 14.6667 8 14.6667 8C14.6667 8 12.6667 3.33334 8 3.33334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 10.6667C9.47276 10.6667 10.6667 9.47276 10.6667 8C10.6667 6.52724 9.47276 5.33334 8 5.33334C6.52724 5.33334 5.33334 6.52724 5.33334 8C5.33334 9.47276 6.52724 10.6667 8 10.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.66667 2.66667L13.3333 13.3333M6.61333 6.61333C6.25267 6.97267 6.05333 7.46667 6.05333 8C6.05333 9.10667 6.94667 10 8.05333 10C8.58667 10 9.08067 9.80067 9.44 9.44M13.08 10.5867C13.5867 10.0267 14 9.33333 14.3333 8C13.3333 4.66667 10.6667 2.66667 8 2.66667C7.34667 2.66667 6.72 2.78667 6.13333 2.98667M2.66667 2.66667L1.33333 1.33333M13.3333 13.3333L14.6667 14.6667M13.3333 13.3333L10.6133 10.6133M2.66667 2.66667L5.38667 5.38667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
    <button
      className="action-btn delete-btn"
      onClick={() => setDeleteModal(excursion.excursion_id)}
      title="Удалить"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33334 6.66667 1.33334H9.33333C9.68696 1.33334 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  </div>
</td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить эту экскурсию?</p>
            <div className="modal-buttons">
              <button className="btn-yes" onClick={handleDelete}>Да</button>
              <button className="btn-no" onClick={() => setDeleteModal(null)}>Нет</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

