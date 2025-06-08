// frontend/src/pages/AdminOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css'; // Crea este archivo CSS para estilos

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminOrdersPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Estados para el modal de confirmación personalizado
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(() => () => {}); // Función a ejecutar al confirmar

  // Obtener usuario del localStorage para verificar el rol
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
      console.error("Error al parsear usuario de localStorage:", e);
      return null;
    }
  });

  useEffect(() => {
    // Redirigir si no es admin
    if (!usuario || usuario.rol !== 'admin') {
      console.warn("Acceso denegado: Solo administradores pueden ver esta página.");
      navigate('/'); // Redirige a la página principal o a una página de acceso denegado
      return;
    }

    const fetchAllOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/admin/pedidos`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al obtener todos los pedidos.');
        }

        const data = await res.json();
        setPedidos(data);
      } catch (err) {
        console.error('Error al cargar pedidos del administrador:', err);
        setError(err.message || 'No se pudieron cargar los pedidos del administrador.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [usuario, navigate]); // Dependencia en 'usuario' y 'navigate'

  // Nueva función para manejar el cambio de estado con confirmación vía modal
  const handleChangeEstadoWithConfirmation = (id_pedido, nuevo_estado) => {
    const pedidoActual = pedidos.find(p => p.id_pedido === id_pedido);

    // Si el estado ya es final, no permitir cambio y mostrar mensaje
    if (pedidoActual && (pedidoActual.estado_pedido === 'completado' || pedidoActual.estado_pedido === 'cancelado')) {
      setModalMessage(`El estado del pedido #${id_pedido} ya está en "${pedidoActual.estado_pedido}" y no puede ser modificado.`);
      setConfirmAction(() => () => setShowConfirmModal(false)); // Solo cerrar el modal
      setShowConfirmModal(true);
      return;
    }

    // Si el estado no es final, pedir confirmación para el cambio
    setModalMessage(`¿Estás seguro de cambiar el estado del pedido #${id_pedido} a "${nuevo_estado}"?`);
    setConfirmAction(() => () => { // Usamos una función que retorna una función para el closure correcto
      handleEstadoChange(id_pedido, nuevo_estado);
      setShowConfirmModal(false); // Cierra el modal después de la acción
    });
    setShowConfirmModal(true);
  };

  const handleEstadoChange = async (id_pedido, nuevo_estado) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pedidos/${id_pedido}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Aquí podrías añadir el token de autorización si lo usas
        },
        body: JSON.stringify({ nuevo_estado }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar el estado del pedido.');
      }

      // Actualizar el estado en el frontend
      setPedidos(pedidos.map(pedido =>
        pedido.id_pedido === id_pedido ? { ...pedido, estado_pedido: nuevo_estado } : pedido
      ));
      // Mostrar notificación de éxito, también con el modal
      setModalMessage(`Pedido #${id_pedido} actualizado a "${nuevo_estado}" con éxito.`);
      setConfirmAction(() => () => setShowConfirmModal(false)); // Solo cerrar
      setShowConfirmModal(true);

    } catch (err) {
      console.error('Error al actualizar estado del pedido:', err);
      // Mostrar notificación de error con el modal
      setModalMessage(`Error: ${err.message || 'No se pudo actualizar el estado del pedido.'}`);
      setConfirmAction(() => () => setShowConfirmModal(false)); // Solo cerrar
      setShowConfirmModal(true);
    }
  };

  if (loading) {
    return <div className="admin-orders-container"><p>Cargando pedidos para el administrador...</p></div>;
  }

  if (error) {
    return <div className="admin-orders-container error-message"><h3>Error: {error}</h3></div>;
  }

  return (
    <div className="admin-orders-container">
      <h2>Gestión de Pedidos</h2>
      {pedidos.length === 0 ? (
        <p>No hay pedidos para mostrar.</p>
      ) : (
        <div className="pedidos-admin-list">
          {pedidos.map((pedido) => (
            <div key={pedido.id_pedido} className="pedido-admin-card">
              <h3>Pedido #{pedido.id_pedido}</h3>
              <p>Cliente: {pedido.nombre_cliente} ({pedido.correo_cliente})</p>
              <p>
                Estado Actual:{' '}
                <strong
                  className={`
                    ${pedido.estado_pedido === 'completado' ? 'estado-pedido-completado' : ''}
                    ${pedido.estado_pedido === 'cancelado' ? 'estado-pedido-cancelado' : ''}
                    ${pedido.estado_pedido === 'pendiente' ? 'estado-pedido-pendiente' : ''}
                  `}
                >
                  {pedido.estado_pedido}
                </strong>
              </p>
              <p>Fecha: {new Date(pedido.fecha_pedido).toLocaleDateString()}</p>
              <p>Total: Bs {Number(pedido.total).toFixed(2)}</p>

              <h4>Productos:</h4>
              <ul className="productos-admin-detalle-list">
                {pedido.productos && pedido.productos.map((prod, index) => (
                  <li key={index} className="producto-admin-item">
                    {prod.imagen && (
                      <img
                        src={`http://localhost:5000${prod.imagen}`}
                        alt={prod.nombre_producto}
                        className="producto-admin-imagen"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50?text=No+Img" }}
                      />
                    )}
                    <span>{prod.nombre_producto} (x{prod.cantidad}) - Bs {Number(prod.precio_unitario).toFixed(2)} c/u</span>
                  </li>
                ))}
              </ul>

              <div className="admin-actions">
                <label htmlFor={`estado-${pedido.id_pedido}`}>Cambiar Estado:</label>
                <select
                  id={`estado-${pedido.id_pedido}`}
                  value={pedido.estado_pedido}
                  onChange={(e) => handleChangeEstadoWithConfirmation(pedido.id_pedido, e.target.value)}
                  className="form-select"
                  // Deshabilitar si el estado es 'completado' o 'cancelado'
                  disabled={pedido.estado_pedido === 'completado' || pedido.estado_pedido === 'cancelado'}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación/notificación personalizado */}
      {showConfirmModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <p>{modalMessage}</p>
            <div className="modal-actions">
              {/* Si el mensaje es una pregunta de confirmación, mostrar Aceptar/Cancelar */}
              {modalMessage.startsWith('¿Estás seguro') ? (
                <>
                  <button onClick={confirmAction} className="modal-btn-confirm">Aceptar</button>
                  <button onClick={() => setShowConfirmModal(false)} className="modal-btn-cancel">Cancelar</button>
                </>
              ) : (
                // Si es solo un mensaje informativo, mostrar solo Aceptar
                <button onClick={() => setShowConfirmModal(false)} className="modal-btn-accept">Aceptar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
