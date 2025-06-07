// frontend/src/pages/ProductsPage.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import CarritoSidebar from '../components/CarritoSidebar';
import './ProductsPage.css'; // Asegúrate de que este archivo existe y tiene los estilos del buscador

// Define la URL base de tu API usando la variable de entorno
// El fallback 'http://localhost:5000' es para que funcione en desarrollo local
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductsPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Nuevo estado para manejar errores de carga
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: '',
    descripcion: '',
    precio: '',
    cantidad_en_inventario: ''
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const esAdmin = usuario && (usuario.rol === 'admin' || usuario.rol === 'empleado');

  // useEffect para obtener productos, ahora depende de searchTerm
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar errores previos

        // Construir la URL con el parámetro de búsqueda si existe
        const url = `${API_BASE_URL}/api/productos${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        console.log(`Fetching products from: ${url}`);
        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || res.statusText);
        }
        const data = await res.json();
        setProductos(data);
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setError(err.message || 'No se pudieron cargar los productos.'); // Establecer el mensaje de error
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [searchTerm]); // El efecto se vuelve a ejecutar cuando searchTerm cambia

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImagenFile(e.target.files[0]);
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nombre_producto', nuevoProducto.nombre_producto);
      formData.append('descripcion', nuevoProducto.descripcion);
      formData.append('precio', nuevoProducto.precio);
      formData.append('cantidad_en_inventario', nuevoProducto.cantidad_en_inventario);
      formData.append('imagen', imagenFile);

      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setNuevoProducto({
          nombre_producto: '',
          descripcion: '',
          precio: '',
          cantidad_en_inventario: ''
        });
        setImagenFile(null);
        // Volver a cargar los productos (refresca la lista, incluyendo el nuevo y el filtrado)
        setSearchTerm(''); // Opcional: Limpiar el término de búsqueda después de agregar
        // No llamamos a obtenerProductos directamente, el useEffect se encargará.
      } else {
        const errorData = await res.json();
        alert(`❌ Error al agregar producto: ${errorData.message || res.statusText}`);
        console.error('Error response from server:', errorData);
      }
    } catch (err) {
      console.error('Error al agregar producto:', err);
      alert('❌ Error de conexión al agregar producto.');
    }
  };

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Volver a cargar los productos (refresca la lista)
        setSearchTerm(searchTerm); // Forzar que el useEffect se dispare con el término actual
        alert('🗑️ Producto eliminado');
      } else {
        const errorData = await res.json();
        alert(`❌ Error al eliminar producto: ${errorData.message || res.statusText}`);
        console.error('Error response from server:', errorData);
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('❌ Error de conexión al eliminar producto.');
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
    setMostrarCarrito(true);
  };

  return (
    <>
      <Navbar
        mostrarCarrito={mostrarCarrito}
        setMostrarCarrito={setMostrarCarrito}
        carrito={carrito}
      />
      <CarritoSidebar
        carrito={carrito}
        mostrar={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
      />
      <div className="productos-container">
        <h2 className="productos-title">Productos Disponibles</h2>

        {/* BARRA DE BÚSQUEDA - NUEVO */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {/* FIN BARRA DE BÚSQUEDA */}

        {esAdmin && (
          <form className="form-admin" onSubmit={agregarProducto} encType="multipart/form-data">
            <h3>Agregar nuevo producto</h3>
            <input type="text" name="nombre_producto" placeholder="Nombre" value={nuevoProducto.nombre_producto} onChange={handleChange} required />
            <input type="text" name="descripcion" placeholder="Descripción" value={nuevoProducto.descripcion} onChange={handleChange} required />
            <input type="number" name="precio" placeholder="Precio" value={nuevoProducto.precio} onChange={handleChange} required />
            <input type="number" name="cantidad_en_inventario" placeholder="Inventario" value={nuevoProducto.cantidad_en_inventario} onChange={handleChange} required />
            <input type="file" name="imagen" accept="image/*" onChange={handleFileChange} required />
            <button type="submit">Agregar</button>
          </form>
        )}

        {/* Mostrar estados de carga, error o productos */}
        {loading ? (
          <p className="loading-message">Cargando productos...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : productos.length === 0 ? (
          <p className="productos-vacio">No se encontraron productos que coincidan con su búsqueda.</p>
        ) : (
          <div className="productos-grid">
            {productos.map((prod) => (
              <div className="producto-card" key={prod.id_producto}>
                <img
                  src={prod.imagen ? `${API_BASE_URL}${prod.imagen}` : 'https://placehold.co/200x200/cccccc/000000?text=No+Img'}
                  alt={prod.nombre_producto}
                  className="producto-img"
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/200x200/cccccc/000000?text=No+Img" }}
                />
                <h4 className="producto-nombre">{prod.nombre_producto}</h4>
                <p className="producto-desc">{prod.descripcion}</p>
                <p className="producto-precio">Bs {Number(prod.precio).toFixed(2)}</p> {/* Formato a 2 decimales */}
                <p className="producto-stock">Stock: {prod.cantidad_en_inventario}</p>
                <button className="btn-add" onClick={() => agregarAlCarrito(prod)}>
                  Agregar al carrito
                </button>
                {esAdmin && (
                  <button className="btn-delete" onClick={() => eliminarProducto(prod.id_producto)}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductsPage;
