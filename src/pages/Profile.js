import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/profile.css";

export default function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE = "http://localhost/globalgid/public";

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/backend/auth/check.php`, {
                credentials: "include",
            });
            
            const data = await response.json();
            
            if (data.success && data.logged_in && data.user) {
                setUser(data.user);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Ошибка загрузки профиля:", error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/backend/auth/logout.php`, {
                method: "POST",
                credentials: "include",
            });
            
            if (onLogout) {
                onLogout();
            }
            
            navigate('/');
        } catch (error) {
            console.error("Ошибка выхода:", error);
            navigate('/');
        }
    };

    const handleUpdateProfile = async (updatedData) => {
        try {
            const response = await fetch(`${API_BASE}/backend/auth/profile.php?action=update`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(updatedData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setUser(data.user);
                await fetch(`${API_BASE}/backend/auth/check.php`, { credentials: "include" });
            }
            
            return data;
        } catch (error) {
            console.error("Ошибка обновления:", error);
            return { success: false, message: 'Ошибка сети' };
        }
    };

    if (loading) {
        return (
            <div className="pg-loading">
                <div className="pg-spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="pg-container">
                <div className="pg-unauthorized">
                    <h2>Доступ запрещен</h2>
                    <p>Пожалуйста, войдите в систему</p>
                    <button 
                        className="pg-auth-btn"
                        onClick={() => navigate('/')}
                    >
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pg-container">
            {/* Боковая панель */}
            <aside className="pg-sidebar">
                <div className="pg-sidebar-header">
                    <div className="pg-avatar">
                        {user.firstname?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="pg-user-info">
                        <h3>{user.firstname} {user.lastname}</h3>
                        <p>{user.email}</p>
                        {user.role && user.role !== 'client' && (
                            <span className="pg-role-badge">
                                {user.role === 'admin' ? 'Администратор' : 'Гид'}
                            </span>
                        )}
                    </div>
                </div>

                <nav className="pg-menu">
                    <button 
                        className={`pg-menu-item ${activeTab === 'profile' ? 'pg-active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <span className="pg-menu-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
                            </svg>
                        </span>
                        <span className="pg-menu-label">Мой профиль</span>
                    </button>
                    
                    <button 
                        className={`pg-menu-item ${activeTab === 'favorites' ? 'pg-active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        <span className="pg-menu-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 14.27L13.15 9.12C13.91 8.36 14.3 7.31 14.3 6.22C14.3 4.05 12.55 2.3 10.38 2.3C9.29 2.3 8.24 2.69 7.48 3.45L8 4L8.52 3.45C7.76 2.69 6.71 2.3 5.62 2.3C3.45 2.3 1.7 4.05 1.7 6.22C1.7 7.31 2.09 8.36 2.85 9.12L8 14.27Z" fill="currentColor"/>
                            </svg>
                        </span>
                        <span className="pg-menu-label">Избранное</span>
                    </button>
                    
                    <button 
                        className={`pg-menu-item ${activeTab === 'bookings' ? 'pg-active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        <span className="pg-menu-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 0H2C0.89 0 0 0.89 0 2V14C0 15.11 0.89 16 2 16H14C15.11 16 16 15.11 16 14V2C16 0.89 15.11 0 14 0ZM14 14H2V2H14V14ZM4 12H12V10H4V12ZM4 9H12V7H4V9ZM4 6H12V4H4V6Z" fill="currentColor"/>
                            </svg>
                        </span>
                        <span className="pg-menu-label">Мои бронирования</span>
                    </button>
                    
                    {/*<button 
                        className={`pg-menu-item ${activeTab === 'settings' ? 'pg-active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <span className="pg-menu-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14.19 6.4L15.71 4.44C15.9 4.17 15.85 3.8 15.59 3.59L13.62 2.07C13.35 1.88 12.98 1.93 12.77 2.19L11.29 4.15C10.73 3.95 10.13 3.85 9.5 3.85C8.87 3.85 8.27 3.95 7.71 4.15L6.23 2.19C6.02 1.93 5.65 1.88 5.38 2.07L3.41 3.59C3.15 3.8 3.1 4.17 3.29 4.44L4.81 6.4C4.61 6.96 4.51 7.56 4.51 8.19C4.51 8.82 4.61 9.42 4.81 9.98L3.29 11.94C3.1 12.21 3.15 12.58 3.41 12.79L5.38 14.31C5.65 14.5 6.02 14.45 6.23 14.19L7.71 12.23C8.27 12.43 8.87 12.53 9.5 12.53C10.13 12.53 10.73 12.43 11.29 12.23L12.77 14.19C12.98 14.45 13.35 14.5 13.62 14.31L15.59 12.79C15.85 12.58 15.9 12.21 15.71 11.94L14.19 9.98C14.39 9.42 14.49 8.82 14.49 8.19C14.49 7.56 14.39 6.96 14.19 6.4ZM9.5 11.03C7.57 11.03 6 9.46 6 7.53C6 5.6 7.57 4.03 9.5 4.03C11.43 4.03 13 5.6 13 7.53C13 9.46 11.43 11.03 9.5 11.03Z" fill="currentColor"/>
                            </svg>
                        </span>
                        <span className="pg-menu-label">Настройки</span>
                    </button>*/}
                    
                    <div className="pg-menu-divider"></div>
                    
                    <button 
                        className="pg-menu-item pg-logout"
                        onClick={handleLogout}
                    >
                        <span className="pg-menu-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6 0H2C0.89 0 0 0.89 0 2V14C0 15.11 0.89 16 2 16H6V14H2V2H6V0ZM11 12L9.59 10.59L11.17 9H5V7H11.17L9.58 5.41L11 4L15 8L11 12Z" fill="currentColor"/>
                            </svg>
                        </span>
                        <span className="pg-menu-label">Выйти</span>
                    </button>
                </nav>
            </aside>

            {/* Основной контент */}
            <main className="pg-content">
                {activeTab === 'profile' && (
                    <ProfileTab user={user} onUpdate={handleUpdateProfile} />
                )}
                
                {activeTab === 'favorites' && (
                    <div className="pg-tab-content">
                        <h2>Избранное</h2>
                        <p>Здесь будут ваши сохраненные экскурсии.</p>
                    </div>
                )}
                
                {activeTab === 'bookings' && (
                    <div className="pg-tab-content">
                        <h2>Мои бронирования</h2>
                        <p>Здесь будет история ваших бронирований.</p>
                    </div>
                )}
                
                {activeTab === 'settings' && (
                    <div className="pg-tab-content">
                        <h2>Настройки</h2>
                        <p>Настройки вашего аккаунта.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// Компонент вкладки профиля
function ProfileTab({ user, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ 
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        const result = await onUpdate(formData);
        
        if (result.success) {
            setMessage('Профиль успешно обновлен!');
            setIsEditing(false);
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage(result.message || 'Ошибка обновления профиля');
        }
    };

    return (
        <div className="pg-tab">
            <div className="pg-tab-header">
                <h1>Мой профиль</h1>
                <p className="pg-welcome-text">Управляйте вашей личной информацией</p>
            </div>

            <div className="pg-info-card">
                <div className="pg-card-header">
                    <h2>Личная информация</h2>
                    <button 
                        className="pg-edit-btn"
                        onClick={() => setIsEditing(!isEditing)}
                        type="button"
                    >
                        {isEditing ? 'Отмена' : 'Редактировать'}
                    </button>
                </div>

                {message && (
                    <div className={`pg-message ${message.includes('успешно') ? 'pg-success' : 'pg-error'}`}>
                        {message}
                    </div>
                )}

                {isEditing ? (
                    <form className="pg-edit-form" onSubmit={handleSubmit}>
                        <div className="pg-form-group">
                            <label>Имя</label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="pg-form-group">
                            <label>Фамилия</label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="pg-form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <button type="submit" className="pg-save-btn">
                            Сохранить изменения
                        </button>
                    </form>
                ) : (
                    <div className="pg-info-display">
                        <div className="pg-info-row">
                            <span className="pg-label">Имя:</span>
                            <span className="pg-value">{user.firstname}</span>
                        </div>
                        <div className="pg-info-row">
                            <span className="pg-label">Фамилия:</span>
                            <span className="pg-value">{user.lastname}</span>
                        </div>
                        <div className="pg-info-row">
                            <span className="pg-label">Email:</span>
                            <span className="pg-value">{user.email}</span>
                        </div>
                        {user.role && user.role !== 'client' && (
                            <div className="pg-info-row">
                                <span className="pg-label">Роль:</span>
                                <span className="pg-value">
                                    {user.role === 'admin' ? 'Администратор' : 'Гид'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}