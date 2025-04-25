// src/pages/ProductsPage.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import CarritoSidebar from '../components/CarritoSidebar';
import './ProductsPage.css';

const ProductsPage = () => {
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: '',
    descripcion: '',
    precio: '',
    cantidad_en_inventario: ''
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const esAdmin = usuario && (usuario.rol === 'admin' || usuario.rol === 'empleado');

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = () => {
    fetch('http://localhost:5000/api/productos')
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((error) => console.error('Error al obtener productos:', error));
  };

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

      const res = await fetch('http://localhost:5000/api/productos', {
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
        obtenerProductos();
        alert('✅ Producto agregado');
      }
    } catch (err) {
      console.error('Error al agregar producto:', err);
    }
  };

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5000/api/productos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        obtenerProductos();
        alert('🗑️ Producto eliminado');
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
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

        <div className="productos-grid">
          {productos.length === 0 ? (
            <p className="productos-vacio">No hay productos disponibles.</p>
          ) : (
            productos.map((prod) => (
              <div className="producto-card" key={prod.id_producto}>
                <img
                  src={prod.imagen ? `http://localhost:5000${prod.imagen}` : 'https://via.placeholder.com/200'}
                  alt={prod.nombre_producto}
                  className="producto-img"
                />
                <h4 className="producto-nombre">{prod.nombre_producto}</h4>
                <p className="producto-desc">{prod.descripcion}</p>
                <p className="producto-precio">Bs {prod.precio}</p>
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
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
