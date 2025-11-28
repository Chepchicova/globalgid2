import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Excursions from "./pages/Excursions";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/excursions" element={<Excursions />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
