import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Excursions from "./pages/Excursions";
import ExcursionDetail from "./pages/excursionDetail"; // ИМПОРТ ДЕТАЛЬНОЙ СТРАНИЦЫ
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import AdminExcursions from "./pages/AdminExcursions";
import AdminExcursionForm from "./pages/AdminExcursionForm";
import AdminGuides from "./pages/AdminGuides";
import AdminGuideForm from "./pages/AdminGuideForm";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Базовый URL для API
  const API_BASE = "http://localhost/globalgid2/public";

  useEffect(() => {
    console.log("App component mounted, checking auth...");
    checkAuth();
  }, []);

const checkAuth = async () => {
  try {
    console.log("Making auth check request...");
    
    const response = await fetch(`${API_BASE}/backend/auth/check.php`, {
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log("Auth check response status:", response.status, response.statusText);
    
    // Получаем текст ответа
    const responseText = await response.text();
    console.log("Raw response (first 500 chars):", responseText.substring(0, 500));
    
    // Проверяем, начинается ли ответ с <?php (значит PHP не выполнился)
    if (responseText.trim().startsWith('<?php')) {
      console.error("PHP file not executed! Raw PHP code returned.");
      throw new Error("PHP файл не выполнился, проверьте настройки сервера");
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON. Response was:", responseText);
      throw new Error("Сервер вернул некорректный ответ (не JSON)");
    }
    
    console.log("Parsed auth data:", data);
    
    if (data.success && data.logged_in && data.user) {
      setUser(data.user);
      console.log("User authenticated:", data.user);
    } else {
      setUser(null);
      console.log("User not authenticated");
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const handleLoginSuccess = (userData) => {
    console.log("Login successful, setting user:", userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      const response = await fetch(`${API_BASE}/backend/auth/logout.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log("Logout response:", data);
      
      if (data.success) {
        setUser(null);
        console.log("Logged out successfully");
      } else {
        console.error("Logout failed:", data.message);
      }
    } catch (error) {
      console.error(" Logout request failed:", error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

return (
    <Router>
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onLoginSuccess={handleLoginSuccess} 
      />
      <main>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/excursions" element={<Excursions user={user} />} />
          <Route path="/guides" element={<Guides user={user} />} />
          <Route 
            path="/profile" 
            element={
              <Profile 
                onLogout={handleLogout} // Передаем функцию выхода
              />
            } 
          />
          {/* НОВЫЙ МАРШРУТ ДЛЯ ДЕТАЛЬНОЙ СТРАНИЦЫ ЭКСКУРСИИ */}
          <Route path="/excursion/:id" element={<ExcursionDetail user={user} />} />
          {/* МАРШРУТ ДЛЯ ДЕТАЛЬНОЙ СТРАНИЦЫ ГИДА */}
          <Route path="/guide/:id" element={<GuideDetail user={user} />} />
          
          {/* Администраторские маршруты */}
          <Route path="/admin/excursions" element={<AdminExcursions user={user} />} />
          <Route path="/admin/excursions/create" element={<AdminExcursionForm user={user} />} />
          <Route path="/admin/excursions/edit/:id" element={<AdminExcursionForm user={user} />} />
          <Route path="/admin/guides" element={<AdminGuides user={user} />} />
          <Route path="/admin/guides/create" element={<AdminGuideForm user={user} />} />
          <Route path="/admin/guides/edit/:id" element={<AdminGuideForm user={user} />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;