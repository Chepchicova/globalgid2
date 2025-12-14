import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/header.css";
import AuthModal from "./AuthModal";

export default function Header({ user, onLogout, onLoginSuccess }) {
  const location = useLocation();
  const isExcursionsPage = location.pathname === "/excursions";
  const [headerSearch, setHeaderSearch] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-profile-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleHeaderSearch = () => {
    const query = headerSearch.trim();
    if (query === "") return;
    navigate(`/excursions?location=${encodeURIComponent(query)}`);
  };

const handleLoginSuccess = (userData) => {
  console.log("Login success in Header:", userData);
  if (onLoginSuccess) {
    onLoginSuccess(userData);
  }
  // НЕ закрываем модалку здесь - пользователь сам закроет
  // setIsAuthModalOpen(false); // ← УБЕРИТЕ ЭТУ СТРОКУ
};

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="header">
        <input type="checkbox" id="burger-checkbox" className="burger-checkbox" />
        <label htmlFor="burger-checkbox" className="burger"></label>

        <div className="logo">
          <a href="/" className="logo-link">
            <div className="logo-content">
              <svg width="38" height="41" viewBox="0 0 38 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_19_3599)">
                  <path d="M10.9035 4.36522V26.5861C10.9035 27.7747 11.8112 28.7382 12.9319 28.7382H33.7458C34.7062 28.7382 35.4847 27.9118 35.4847 26.8923V18.1166C35.4847 17.2684 34.8373 16.5822 34.0392 16.5822C33.6325 16.5822 33.2442 16.7638 32.9696 17.0835L25.7225 25.5377C25.5012 25.7966 25.1877 25.9434 24.8579 25.9434H21.3972C20.7516 25.9434 20.2283 25.3878 20.2283 24.7025V15.61C20.2283 14.9247 20.7516 14.3691 21.3972 14.3691H36.124C36.9223 14.3691 37.5695 15.0561 37.5695 15.9036V27.3747C37.5695 28.2478 37.2428 29.0851 36.6612 29.7024L27.5652 39.357C26.9888 39.9688 26.2071 40.3125 25.3921 40.3125H1.44553C0.647469 40.3125 0 39.6263 0 38.778V12.9256C0 12.0604 0.323806 11.2305 0.900184 10.6187L9.99526 0.964094C10.5768 0.346795 11.3655 0 12.1879 0H36.3996C37.046 0 37.5695 0.555717 37.5695 1.24084V10.3334C37.5695 11.0185 37.046 11.5743 36.3996 11.5743H32.9389C32.6101 11.5743 32.2966 11.4274 32.0743 11.1686L24.8271 2.7144C24.5536 2.39467 24.1653 2.21306 23.7586 2.21306H12.9319C11.8112 2.21306 10.9035 3.17659 10.9035 4.36522Z" fill="url(#paint0_linear_19_3599)"/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_19_3599" x1="18.7848" y1="0" x2="18.7848" y2="40.3125" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0E1E15"/>
                    <stop offset="1" stopColor="#3E845C"/>
                  </linearGradient>
                  <clipPath id="clip0_19_3599">
                    <rect width="37.5695" height="40.3125" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="logo-text">GlobalGid</span>
            </div>
          </a>
        </div>

        {!isExcursionsPage && (
          <div className="search-bar">
            <svg
              className="search-icon"
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
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleHeaderSearch();
                }
              }}
            />
          </div>
        )}

        <div className="nav-button">
          <nav className="nav">
            <ul className="nav-links">
              <li><Link to="/" className="menu-item">Главная</Link></li>
              {user?.role !== 'admin' && (
                <>
                  <li><Link to="/about" className="menu-item">О проекте</Link></li>
                  <li><Link to="/help" className="menu-item">Помощь</Link></li>
                  <li><Link to="/contacts" className="menu-item">Контакты</Link></li>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <li><Link to="/admin/excursions" className="menu-item">Экскурсии</Link></li>
                  <li><Link to="/admin/guides" className="menu-item">Гиды</Link></li>
                  <li><Link to="/admin/requests" className="menu-item">Заявки</Link></li>
                </>
              )}
            </ul> 
            
           {/* <a href="/favorites" className="nav-icon-link" aria-label="Избранное">
              <svg
                className="nav-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12.058 19.0796L12.064 19.074L12.1574 18.9883L12.1607 18.9852C14.8238 16.5163 16.8665 14.6192 18.2522 12.8655C19.6103 11.1469 20.1447 9.79936 20.0971 8.45345L20.097 8.45199C20.0567 7.28634 19.4656 6.19115 18.5727 5.57086L18.5676 5.56732C16.8694 4.37928 14.6931 4.87531 13.4565 6.35223L11.9997 8.09211L10.5429 6.35223C9.31035 4.8801 7.13185 4.38457 5.42777 5.57014L5.42673 5.57086C4.53432 6.19086 3.94331 7.2853 3.90249 8.45033C3.85868 9.79905 4.3952 11.1482 5.75066 12.8626C7.13479 14.6133 9.176 16.5065 11.8391 18.9652L11.8424 18.9683L11.9615 19.0787C11.9728 19.0893 11.9812 19.0936 11.9868 19.0958C11.9934 19.0984 12.0011 19.1 12.0097 19.1C12.0184 19.1 12.0264 19.0984 12.0334 19.0958C12.0394 19.0934 12.0475 19.0893 12.058 19.0796ZM2.00357 8.38631C1.87362 12.3439 5.3023 15.5162 10.5503 20.3612L10.6602 20.4632C11.4199 21.1772 12.5895 21.1772 13.3492 20.4734L13.4492 20.3816L13.5095 20.3256C18.7235 15.4918 22.1353 12.3287 21.9959 8.38631C21.9359 6.6523 21.0662 4.98968 19.6568 4.01047C17.629 2.59183 15.2352 2.77521 13.437 3.88956C12.8951 4.22542 12.4072 4.64585 11.9997 5.13248C11.5921 4.64564 11.104 4.22561 10.5617 3.89039C8.7636 2.77879 6.37022 2.59985 4.34267 4.01047C2.93321 4.98968 2.06355 6.6523 2.00357 8.38631Z" fill="#202020"/>
              </svg>
            </a>*/}
          </nav>
          
          {/* Если пользователь авторизован - показываем профиль */}
          {user ? (
            <div className="user-profile-container">
              <button 
                className="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.firstname.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">
                  {user.firstname}
                </span>
<svg 
  className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} 
  width="12" 
  height="12"  /* Увеличил высоту для лучшего вида */
  viewBox="0 0 12 12"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path 
    d="M2 4.5L6 8.5L10 4.5" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  />
</svg>
              </button>
              
              {showUserMenu && (
                <div className="user-menu">
                  
                  <div className="user-menu-items">
                    <a href="/profile" className="user-menu-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
                      </svg>
                      Мой профиль
                    </a>
                    
                    <a 
                      href="/profile" 
                      className="user-menu-item"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/profile', { state: { activeTab: 'favorites' } });
                        setShowUserMenu(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 14.27L13.15 9.12C13.91 8.36 14.3 7.31 14.3 6.22C14.3 4.05 12.55 2.3 10.38 2.3C9.29 2.3 8.24 2.69 7.48 3.45L8 4L8.52 3.45C7.76 2.69 6.71 2.3 5.62 2.3C3.45 2.3 1.7 4.05 1.7 6.22C1.7 7.31 2.09 8.36 2.85 9.12L8 14.27Z" fill="currentColor"/>
                      </svg>
                      Избранное
                    </a>
                    
                    <a 
                      href="/profile" 
                      className="user-menu-item"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/profile', { state: { activeTab: 'bookings' } });
                        setShowUserMenu(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 0H2C0.89 0 0 0.89 0 2V14C0 15.11 0.89 16 2 16H14C15.11 16 16 15.11 16 14V2C16 0.89 15.11 0 14 0ZM14 14H2V2H14V14ZM4 12H12V10H4V12ZM4 9H12V7H4V9ZM4 6H12V4H4V6Z" fill="currentColor"/>
                      </svg>
                      Мои бронирования
                    </a>
                    
                    <div className="user-menu-divider"></div>
                    
                    <button className="user-menu-item logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 0H2C0.89 0 0 0.89 0 2V14C0 15.11 0.89 16 2 16H6V14H2V2H6V0ZM11 12L9.59 10.59L11.17 9H5V7H11.17L9.58 5.41L11 4L15 8L11 12Z" fill="currentColor"/>
                      </svg>
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Если не авторизован - показываем кнопку Войти
            <button 
              className="login-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}