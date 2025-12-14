import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminExcursions.css";

const API_BASE = "http://localhost/globalgid2/public/backend";

export default function AdminRequests({ user }) {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Проверка прав администратора
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Загрузка заявок
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/get_requests.php`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.pending || []);
        setProcessedRequests(data.processed || []);
      } else {
        console.error("Ошибка от сервера:", data.error);
      }
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    } finally {
      setLoading(false);
    }
  };

  // Обработка заявки
  const handleProcess = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/update_request_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          request_id: requestId,
          status: 'processed'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRequests(); // Перезагружаем список
      } else {
        alert(data.error || 'Ошибка при обработке заявки');
      }
    } catch (error) {
      console.error("Ошибка обработки заявки:", error);
      alert('Ошибка сети');
    }
  };


  if (loading) {
    return (
      <div className="admin-excursions-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-excursions-page">
      <div className="admin-excursions-header">
        <h1>Заявки</h1>
      </div>

      {/* Необработанные заявки */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '22px', 
          color: '#2c3e50', 
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #3E845C'
        }}>
          Необработанные заявки ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Нет необработанных заявок</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{request.request_id}</td>
                    <td>{request.name}</td>
                    <td>{request.phone_req}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleProcess(request.request_id)}
                        style={{
                          backgroundColor: '#3E845C',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Обработано
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Обработанные заявки */}
      <div>
        <h2 style={{ 
          fontSize: '22px', 
          color: '#2c3e50', 
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #999'
        }}>
          Обработанные заявки ({processedRequests.length})
        </h2>
        
        {processedRequests.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Нет обработанных заявок</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((request) => (
                  <tr key={request.request_id} style={{ opacity: 0.7 }}>
                    <td>{request.request_id}</td>
                    <td>{request.name}</td>
                    <td>{request.phone_req}</td>
                    <td>
                      <span style={{ 
                        color: '#3E845C', 
                        fontWeight: '500' 
                      }}>
                        Обработано
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

