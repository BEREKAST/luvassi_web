import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import InformativaPage from '../pages/InformativaPage'; // ✅ Correcto
import ProductsPage from '../pages/ProductsPage'; // ✅ Correcto

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InformativaPage />} /> {/* Nueva ruta */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/productos" element={<ProductsPage />} />

      </Routes>
    </Router>
  );
};

export default AppRouter; // ✅ Esta es la clave
