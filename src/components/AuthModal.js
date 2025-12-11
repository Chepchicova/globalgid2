import React, { useState, useEffect } from "react";
import "../styles/auth.css";

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Базовый URL для API
  const API_BASE = "http://localhost/globalgid2/public";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    console.log("Отправка данных:", { isLogin, formData });

    try {
      const endpoint = isLogin 
        ? `${API_BASE}/backend/auth/login.php`
        : `${API_BASE}/backend/auth/register.php`;
      
      let requestData;
      if (isLogin) {
        requestData = {
          email: formData.email,
          password: formData.password
        };
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Пароли не совпадают");
        }
        requestData = {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password
        };
      }

      console.log("Отправляю запрос на:", endpoint);
      console.log("Данные:", requestData);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ВАЖНО ДЛЯ СЕССИЙ!
        body: JSON.stringify(requestData)
      });

      console.log("Статус ответа:", response.status);
      
      // Проверяем content-type
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      const text = await response.text();
      console.log("Текст ответа:", text.substring(0, 200) + "...");

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        console.error("Полный ответ:", text);
        throw new Error("Сервер вернул некорректный ответ");
      }

      if (data.success) {
        console.log("Успех:", data);
        
        // ЕСЛИ ЕСТЬ USER В ОТВЕТЕ (и при входе, и при регистрации)
        if (data.user && onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        
        // сообщение об успехе
        setSuccess(data.message || (isLogin ? "Вход выполнен успешно!" : "Регистрация успешна!"));
        
        // Очищаем форму
        setFormData({
          firstname: "",
          lastname: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        
        // НЕ закрываем модалку автоматически
        
      } else {
        console.log("Ошибка от сервера:", data);
        setError(data.message || "Что-то пошло не так");
      }
    } catch (err) {
      console.error("Ошибка запроса:", err);
      setError(err.message || "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>{isLogin ? "Вход" : "Регистрация"}</h2>
        </div>

        <div className="auth-tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setError("");
              setSuccess("");
            }}
          >
            Вход
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setError("");
              setSuccess("");
            }}
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  name="firstname"
                  placeholder="Имя"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="lastname"
                  placeholder="Фамилия"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Загрузка...
              </>
            ) : (
              isLogin ? "Войти" : "Зарегистрироваться"
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Нет аккаунта?{" "}
              <button 
                className="link-btn" 
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                  setSuccess("");
                }}
                disabled={loading}
              >
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <button 
                className="link-btn" 
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                  setSuccess("");
                }}
                disabled={loading}
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;