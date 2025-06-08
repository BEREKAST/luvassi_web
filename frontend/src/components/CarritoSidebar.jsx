// frontend/src/components/CarritoSidebar.jsx
import React, { useState, useEffect } from 'react';
import './CarritoSidebar.css';
import { useNavigate } from 'react-router-dom';

// Define la URL base de tu API usando la variable de entorno
// El fallback 'http://localhost:5000' es para que funcione en desarrollo local
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CarritoSidebar = ({ carrito: carritoProp, mostrar, onClose }) => {
  const [carrito, setCarrito] = useState([]);
  const [mensajeNotificacion, setMensajeNotificacion] = useState('');
  const [mostrarNotificacionModal, setMostrarNotificacionModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Tarjeta de Crédito');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    setCarrito(carritoProp);
  }, [carritoProp]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('usuario'));
    setUsuario(storedUser);
    // console.log("CarritoSidebar: Usuario cargado desde localStorage:", storedUser); // Eliminado
  }, [mostrar]);

  const total = carrito.reduce((sum, item) => sum + Number(item.precio), 0);

  if (!mostrar) return null;

  const mostrarMensaje = (msg, qrUrl = null) => {
    setMensajeNotificacion(msg);
    setQrCodeUrl(qrUrl);
    setMostrarNotificacionModal(true);
  };

  const cerrarMensaje = () => {
    setMostrarNotificacionModal(false);
    setMensajeNotificacion('');
    setQrCodeUrl(null);
    if (mensajeNotificacion.includes("Compra realizada con éxito")) {
      setCarrito([]); // Limpiar el carrito en el estado local
      // Aquí también deberías llamar a una función para limpiar el carrito en el componente padre
      // onClose(); // Podrías llamar a onClose aquí si quieres que cierre el sidebar después de la compra
    }
  };

  const finalizarCompra = async () => {
    // console.log("finalizarCompra: Iniciando proceso de compra."); // Eliminado
    // console.log("finalizarCompra: Usuario actual:", usuario); // Eliminado
    // console.log("finalizarCompra: id_cliente del usuario:", usuario ? usuario.id_cliente : 'N/A'); // Eliminado
    // console.log("finalizarCompra: Método de pago seleccionado:", metodoPago); // Eliminado

    if (!usuario || !usuario.id_cliente) {
      mostrarMensaje("Debes iniciar sesión para finalizar la compra.");
      // console.log("finalizarCompra: Usuario no logueado o sin id_cliente. Deteniendo compra."); // Eliminado
      return;
    }
    if (carrito.length === 0) {
      mostrarMensaje("Tu carrito está vacío.");
      // console.log("finalizarCompra: Carrito vacío. Deteniendo compra."); // Eliminado
      return;
    }

    try {
      const productosParaPedido = carrito.map((prod) => ({
        id_producto: prod.id_producto,
        cantidad: 1 // Asumiendo cantidad 1 por ahora, ajusta si manejas cantidades en el carrito
      }));

      // console.log("🛒 Enviando pedido con datos:", { // Eliminado
      //   id_cliente: usuario.id_cliente,
      //   productos: productosParaPedido,
      //   metodo_pago: metodoPago
      // });

      // Usar API_BASE_URL para la llamada fetch
      const res = await fetch(`${API_BASE_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: usuario.id_cliente,
          productos: productosParaPedido,
          metodo_pago: metodoPago
        })
      });

      if (res.ok) {
        const data = await res.json();
        let successMessage = `✅ Compra realizada con éxito. Factura #${data.id_factura}`;
        let qrUrlToDisplay = null;

        if (data.qr_code_url) {
          successMessage += "\nEscanea el QR para finalizar el pago:";
          qrUrlToDisplay = data.qr_code_url;
        }
        
        mostrarMensaje(successMessage, qrUrlToDisplay);
        onClose(); // Cierra el sidebar
        // console.log("finalizarCompra: Compra exitosa. Mensaje:", successMessage); // Eliminado
        // console.log("finalizarCompra: URL del QR recibida:", qrUrlToDisplay); // Eliminado
      } else {
        const error = await res.json();
        mostrarMensaje(`❌ Error del servidor: ${error.message}`);
        console.error("finalizarCompra: Respuesta con error del servidor:", error); // Mantenido para depuración
      }
    } catch (err) {
      console.error("finalizarCompra: Error en la conexión al servidor:", err); // Mantenido para depuración
      mostrarMensaje("❌ Error en la conexión al servidor. Inténtalo de nuevo más tarde.");
    }
  };

  const eliminarProducto = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  return (
    <div className="carrito-sidebar">
      <button className="close-btn" onClick={onClose}>✖</button>
      <h3>🛒 Tu carrito</h3>

      {carrito.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <>
          <ul>
            {carrito.map((prod, index) => (
              <li key={index}>
                <strong>{prod.nombre_producto}</strong> - Bs {Number(prod.precio).toFixed(2)}
                <button className="btn-eliminar" onClick={() => eliminarProducto(index)}>Eliminar</button>
              </li>
            ))}
          </ul>
          <div className="total-carrito">
            <p><strong>Total:</strong> Bs {total.toFixed(2)}</p>

            <div className="payment-method-selection">
              <label htmlFor="metodoPago">Forma de Pago:</label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Pago QR">Pago QR</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <button className="btn-comprar" onClick={finalizarCompra}>
              Finalizar Compra
            </button>
          </div>
        </>
      )}

      {mostrarNotificacionModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <p>{mensajeNotificacion}</p>
            {qrCodeUrl && (
              <div className="qr-code-container">
                <img src={qrCodeUrl} alt="Código QR de Pago" className="qr-code-image" />
                <p>Escanea este código para proceder con el pago.</p>
              </div>
            )}
            <button onClick={cerrarMensaje}>Aceptar</button>
            {qrCodeUrl && <button onClick={() => navigate('/perfil')}>Ver mis pedidos</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoSidebar;
