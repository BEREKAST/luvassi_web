import React, { useState } from 'react';

const AddProductForm = ({ onProductAdded }) => {
  const [form, setForm] = useState({
    nombre_producto: '',
    descripcion: '',
    precio: '',
    cantidad_en_inventario: '',
    imagen: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Producto agregado');
        onProductAdded(); // recarga productos
        setForm({
          nombre_producto: '',
          descripcion: '',
          precio: '',
          cantidad_en_inventario: '',
          imagen: ''
        });
      } else {
        alert(data.message || 'Error al agregar producto');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el backend');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '2rem 0' }}>
      <h3>Agregar nuevo producto</h3>
      <input type="text" name="nombre_producto" placeholder="Nombre" value={form.nombre_producto} onChange={handleChange} required />
      <input type="text" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} required />
      <input type="number" step="0.01" name="precio" placeholder="Precio" value={form.precio} onChange={handleChange} required />
      <input type="number" name="cantidad_en_inventario" placeholder="Stock" value={form.cantidad_en_inventario} onChange={handleChange} required />
      <input type="text" name="imagen" placeholder="URL de imagen" value={form.imagen} onChange={handleChange} />
      <button type="submit">Agregar Producto</button>
    </form>
  );
};

export default AddProductForm;
