// src/router/AppRouter.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import InformativaPage from '../pages/InformativaPage';
import ProductsPage from '../pages/ProductsPage';
import OrdersPage from '../pages/OrdersPage'; // ✅ Importamos OrdersPage

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InformativaPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/perfil" element={<OrdersPage />} /> {/* ✅ Ruta corregida a /perfil */}
      </Routes>
    </Router>
  );
};

export default AppRouter;
