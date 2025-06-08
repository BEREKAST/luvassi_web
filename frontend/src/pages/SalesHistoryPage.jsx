// frontend/src/pages/SalesHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Importa componentes de Recharts
import './SalesHistoryPage.css'; // Importa el archivo CSS para esta página

// Definir la URL base del backend. Usará la variable de entorno en producción,
// o localhost en desarrollo.
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Componente para el modal de notificación/confirmación/input
const CustomModal = ({ message, type, onClose, onConfirm, showInput, inputPlaceholder, onInputChange, inputValue }) => {
  return (
    <div className="custom-modal-overlay">
      <div className={`custom-modal-content ${type}`}>
        <p>{message}</p>
        {showInput && (
          <input
            type="number"
            value={inputValue}
            onChange={onInputChange}
            placeholder={inputPlaceholder}
            className="modal-input"
            min="1"
          />
        )}
        <div className="modal-buttons">
          {/* Se pasa el 'inputValue' a la función 'onConfirm' */}
          {onConfirm && <button onClick={() => onConfirm(inputValue)} className="modal-confirm-btn">Aceptar</button>}
          <button onClick={onClose} className="modal-close-btn">Cerrar</button>
        </div>
      </div>
    </div>
  );
};


const SalesHistoryPage = () => {
  const [completedSales, setCompletedSales] = useState([]);
  const [cancelledSales, setCancelledSales] = useState([]);
  const [productStock, setProductStock] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]); // Datos para el gráfico
  const [registeredUsers, setRegisteredUsers] = useState([]); // Estado para usuarios registrados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el modal personalizado
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'success', 'error', 'confirm', 'input'
  const [modalOnConfirm, setModalOnConfirm] = useState(null); // Almacena la función de confirmación
  const [modalShowInput, setModalShowInput] = useState(false);
  const [modalInputPlaceholder, setModalInputPlaceholder] = useState('');
  const [modalInputValue, setModalInputValue] = useState('');

  // Estados específicos para gestión de stock
  const [selectedProductIdForStock, setSelectedProductIdForStock] = useState(null);

  // Estados específicos para gestión de usuarios
  const [selectedUserIdToDelete, setSelectedUserIdToDelete] = useState(null);


  // Función para mostrar el modal personalizado
  const showCustomModal = ({ message, type = 'info', onConfirm = null, showInput = false, inputPlaceholder = '', initialInputValue = '' }) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm); // Almacena la función de confirmación
    setModalShowInput(showInput);
    setModalInputPlaceholder(inputPlaceholder);
    setModalInputValue(initialInputValue);
    setShowModal(true);
  };

  // Función para cerrar el modal personalizado
  const closeCustomModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('info');
    setModalOnConfirm(null);
    setModalShowInput(false);
    setModalInputPlaceholder('');
    setModalInputValue('');
  };

  // Manejador para el cambio en el input del modal
  const handleModalInputChange = (e) => {
    setModalInputValue(e.target.value);
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ventas completadas
      const completedRes = await fetch(`${API_BASE_URL}/api/sales/completed`);
      const completedData = await completedRes.json();
      if (completedRes.ok) {
        setCompletedSales(completedData);
      } else {
        throw new Error(completedData.message || 'Error al cargar ventas completadas');
      }

      // Fetch ventas canceladas
      const cancelledRes = await fetch(`${API_BASE_URL}/api/sales/cancelled`);
      const cancelledData = await cancelledRes.json();
      if (cancelledRes.ok) {
        setCancelledSales(cancelledData);
      } else {
        throw new Error(cancelledData.message || 'Error al cargar ventas canceladas');
      }

      // Fetch stock de productos
      const stockRes = await fetch(`${API_BASE_URL}/api/products/stock`);
      const stockData = await stockRes.json();
      if (stockRes.ok) {
        setProductStock(stockData);
      } else {
        throw new Error(stockData.message || 'Error al cargar stock de productos');
      }

      // Fetch usuarios registrados
      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`);
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setRegisteredUsers(usersData);
      } else {
        throw new Error(usersData.message || 'Error al cargar usuarios registrados');
      }

      // Fetch resumen de ventas por fecha
      const summaryRes = await fetch(`${API_BASE_URL}/api/sales/summary-by-date`);
      const summaryData = await summaryRes.json();
      if (summaryRes.ok) {
        const formattedSummary = summaryData.map(item => ({
          ...item,
          // La fecha ya se formatea aquí para la visualización directa en el gráfico
          sale_date: new Date(item.sale_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          total_orders: Number(item.total_orders),
          total_revenue: Number(item.total_revenue)
        }));
        setSalesSummary(formattedSummary);
      } else {
        throw new Error(summaryData.message || 'Error al cargar resumen de ventas');
      }

    } catch (err) {
      console.error('Error fetching sales data:', err); // Solo para depuración interna
      setError(err.message || 'No se pudo cargar el historial de ventas.');
      showCustomModal({ message: `Error: ${err.message || 'No se pudo cargar el historial de ventas.'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Cargar datos al montar el componente

  // Función para agregar stock a un producto
  const handleAddStock = (productId) => {
    setSelectedProductIdForStock(productId);
    showCustomModal({
      message: 'Ingrese la cantidad a agregar al stock:',
      type: 'input',
      showInput: true,
      inputPlaceholder: 'Cantidad',
      initialInputValue: '',
      // Ahora, 'quantityInput' contendrá el valor actual del input del modal
      onConfirm: async (quantityInput) => {
        const quantity = parseInt(quantityInput, 10);
        if (isNaN(quantity) || quantity <= 0) {
          showCustomModal({ message: 'La cantidad debe ser un número positivo.', type: 'error' });
          return;
        }
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
          });
          const data = await res.json();
          if (res.ok) {
            showCustomModal({ message: `✅ Stock actualizado: ${data.message}`, type: 'success' });
            fetchData(); // Volver a cargar los datos para actualizar la UI
          } else {
            throw new Error(data.message || 'Error al actualizar stock');
          }
        } catch (err) {
          console.error('Error al actualizar stock:', err);
          showCustomModal({ message: `❌ Error al actualizar stock: ${err.message}`, type: 'error' });
        } finally {
          closeCustomModal();
        }
      }
    });
  };

  // Función para confirmar la eliminación de un usuario
  const confirmDeleteUser = (userId) => {
    setSelectedUserIdToDelete(userId);
    showCustomModal({
      message: '¿Estás seguro de que quieres eliminar a este usuario? Esto eliminará todos sus pedidos y datos relacionados.',
      type: 'confirm',
      // No se pasa ningún valor del input aquí, ya que no hay input en este modal de confirmación.
      // Se llama directamente a handleDeleteUser con el userId.
      onConfirm: () => handleDeleteUser(userId)
    });
  };

  // Función para eliminar un usuario
  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showCustomModal({ message: `✅ Usuario eliminado: ${data.message}`, type: 'success' });
        fetchData(); // Volver a cargar los datos para actualizar la UI
      } else {
        throw new Error(data.message || 'Error al eliminar usuario');
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showCustomModal({ message: `❌ Error al eliminar usuario: ${err.message}`, type: 'error' });
    } finally {
      closeCustomModal();
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <p className="text-center text-lg mt-8 text-gray-700">Cargando historial de ventas...</p>
        <div className="loading-spinner mx-auto mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="sales-history-container error-message bg-white p-8 rounded-xl shadow-lg mt-8">
          <h3>¡Ups! Algo salió mal.</h3>
          <p>Error: {error}</p>
          <p>Por favor, intenta recargar la página o contacta al soporte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sales-history-container">
        <h2 className="text-center text-4xl font-extrabold text-gray-800 mb-10 mt-5">Historial y Reportes de Ventas</h2>

        <div className="summary-cards grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Ventas Completadas</h3>
            <p className="big-number text-5xl font-bold text-green-600">{completedSales.length}</p>
            <p className="text-gray-600 mt-2">Total Ingresos: Bs {completedSales.reduce((sum, sale) => sum + Number(sale.total), 0).toFixed(2)}</p>
          </div>
          <div className="card bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Ventas Canceladas</h3>
            <p className="big-number text-5xl font-bold text-red-600">{cancelledSales.length}</p>
          </div>
          <div className="card bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Productos en Stock</h3>
            <p className="big-number text-5xl font-bold text-blue-600">{productStock.length}</p>
          </div>
        </div>

        <div className="chart-section bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Ventas Completadas por Fecha</h3>
          {salesSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={salesSummary}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                {/* La fecha ya viene preformateada del fetchData, no necesita un tickFormatter complejo aquí */}
                <XAxis dataKey="sale_date" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`Bs ${Number(value).toFixed(2)}`, name]} />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#4F46E5" strokeWidth={2} name="Total Ventas (Bs)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="total_orders" stroke="#10B981" strokeWidth={2} name="Cantidad Pedidos" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-600 text-lg">No hay datos de ventas para mostrar en el gráfico.</p>
          )}
        </div>

        <div className="details-section grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="sales-list-section bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Detalle de Ventas Completadas</h3>
            {completedSales.length === 0 ? (
              <p className="text-center text-gray-600">No hay ventas completadas.</p>
            ) : (
              <ul className="sales-list space-y-4">
                {completedSales.map(sale => (
                  <li key={sale.id_pedido} className="sale-item p-4 bg-green-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="font-bold text-green-700">Pedido #{sale.id_pedido}</div>
                    <div className="text-gray-700">Cliente: {sale.nombre_cliente || 'N/A'}</div>
                    <div className="text-gray-600 text-sm">Fecha: {new Date(sale.fecha_pedido).toLocaleDateString()}</div>
                    <div className="text-lg font-bold text-green-800">Total: Bs {Number(sale.total).toFixed(2)}</div>
                    <div className="text-gray-600 text-sm">Pago: {sale.metodo_pago || 'N/A'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sales-list-section bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Detalle de Ventas Canceladas</h3>
            {cancelledSales.length === 0 ? (
              <p className="text-center text-gray-600">No hay ventas canceladas.</p>
            ) : (
              <ul className="sales-list cancelled space-y-4">
                {cancelledSales.map(sale => (
                  <li key={sale.id_pedido} className="sale-item p-4 bg-red-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="font-bold text-red-700">Pedido #{sale.id_pedido}</div>
                    <div className="text-gray-700">Cliente: {sale.nombre_cliente || 'N/A'}</div>
                    <div className="text-gray-600 text-sm">Fecha: {new Date(sale.fecha_pedido).toLocaleDateString()}</div>
                    <div className="text-lg font-bold text-red-800">Total: Bs {Number(sale.total).toFixed(2)}</div>
                    <div className="text-gray-600 text-sm">Pago: {sale.metodo_pago || 'N/A'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="stock-section bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Stock de Productos</h3>
          {productStock.length === 0 ? (
            <p className="text-center text-gray-600">No hay productos en stock.</p>
          ) : (
            <ul className="stock-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productStock.map(product => (
                <li key={product.id_producto} className="stock-item flex items-center p-4 bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  {product.imagen && (
                    <img
                      src={`${API_BASE_URL}${product.imagen}`}
                      alt={product.nombre_producto}
                      className="w-16 h-16 object-cover rounded-md mr-4 border border-blue-200"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64/E0E7FF/4A90E2?text=No+Img'; }} // Fallback
                    />
                  )}
                  <div className="flex-1">
                    <span className="font-semibold text-blue-800 text-lg block">{product.nombre_producto}</span>
                    <span className={`stock-quantity text-md ${product.cantidad_en_inventario <= 5 ? 'text-orange-500 font-bold' : 'text-blue-600'}`}>
                      Stock: {product.cantidad_en_inventario}
                    </span>
                    {/* Botón para agregar stock si el inventario es 0 o bajo */}
                    {product.cantidad_en_inventario <= 5 && (
                      <button
                        onClick={() => handleAddStock(product.id_producto)}
                        className="add-stock-btn mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                      >
                        Añadir Stock
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sección de Usuarios Registrados */}
        <div className="users-section bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Usuarios Registrados</h3>
          {registeredUsers.length === 0 ? (
            <p className="text-center text-gray-600">No hay usuarios registrados.</p>
          ) : (
            <ul className="users-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredUsers.map(user => (
                <li key={user.id_usuario} className="user-item p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="font-semibold text-gray-800 text-lg">{user.nombre}</div>
                  <div className="text-gray-600 text-sm">Email: {user.correo_electronico}</div>
                  <div className="text-gray-500 text-xs mt-1">Rol: {user.rol}</div>
                  <div className="text-gray-500 text-xs">Dirección: {user.direccion || 'N/A'}</div>
                  {/* Botón para eliminar usuario */}
                  <button
                    onClick={() => confirmDeleteUser(user.id_usuario)}
                    className="delete-user-btn mt-3 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                  >
                    Eliminar Usuario
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
      {/* Renderiza el modal personalizado si showModal es true */}
      {showModal && (
        <CustomModal
          message={modalMessage}
          type={modalType}
          onClose={closeCustomModal}
          onConfirm={modalOnConfirm}
          showInput={modalShowInput}
          inputPlaceholder={modalInputPlaceholder}
          onInputChange={handleModalInputChange}
          inputValue={modalInputValue}
        />
      )}
    </div>
  );
};

export default SalesHistoryPage;
