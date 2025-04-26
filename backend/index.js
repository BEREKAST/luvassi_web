// backend/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db'); // Conexión a PostgreSQL

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir imágenes

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Ruta de prueba para verificar conexión a PostgreSQL
app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "¡Backend funcionando!", hora: result.rows[0] });
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

// Ruta: Registro de usuario
app.post('/api/register', async (req, res) => {
  const { nombre, direccion, correo_electronico, contrasena, rol } = req.body;

  try {
    const checkUser = await pool.query(
      'SELECT * FROM usuario WHERE correo_electronico = $1',
      [correo_electronico]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const result = await pool.query(
      'INSERT INTO usuario (nombre, direccion, correo_electronico, contrasena, rol) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, direccion, correo_electronico, hashedPassword, rol]
    );

    const nuevoUsuario = result.rows[0];

    let id_cliente = null;

    if (rol.toLowerCase() === 'usuario') {
      const clienteInsert = await pool.query(
        'INSERT INTO cliente (id_usuario, telefono) VALUES ($1, $2) RETURNING id_cliente',
        [nuevoUsuario.id_usuario, '00000000']
      );
      id_cliente = clienteInsert.rows[0].id_cliente;
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id_usuario,
        id_cliente,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo_electronico,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Ruta: Login de usuario
app.post('/api/login', async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE correo_electronico = $1',
      [correo_electronico]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    let id_cliente = null;
    if (usuario.rol === 'usuario') {
      const clienteResult = await pool.query(
        'SELECT id_cliente FROM cliente WHERE id_usuario = $1',
        [usuario.id_usuario]
      );
      if (clienteResult.rows.length > 0) {
        id_cliente = clienteResult.rows[0].id_cliente;
      }
    }

    res.status(200).json({
      message: 'Login exitoso',
      usuario: {
        id: usuario.id_usuario,
        id_cliente,
        nombre: usuario.nombre,
        correo: usuario.correo_electronico,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Rutas para productos
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producto');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/productos', upload.single('imagen'), async (req, res) => {
  const { nombre_producto, descripcion, precio, cantidad_en_inventario } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      'INSERT INTO producto (nombre_producto, descripcion, precio, cantidad_en_inventario, imagen) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre_producto, descripcion, precio, cantidad_en_inventario, imagen]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM producto WHERE id_producto = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear pedido
app.post('/api/pedidos', async (req, res) => {
  const { id_cliente: id_usuario, productos } = req.body;

  try {
    // Buscar el id_cliente real a partir del id_usuario
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM cliente WHERE id_usuario = $1',
      [id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(400).json({ message: 'El usuario no está registrado como cliente' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    const now = new Date();
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('en-GB');

    const pedido = await pool.query(
      'INSERT INTO pedido (id_cliente, estado_pedido, total, fecha_pedido) VALUES ($1, $2, 0, $3) RETURNING *',
      [id_cliente, 'pendiente', now]
    );

    let total = 0;

    for (const p of productos) {
      const prod = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [p.id_producto]);
      const precio = prod.rows[0].precio;
      total += precio * p.cantidad;

      await pool.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
        [pedido.rows[0].id_pedido, p.id_producto, p.cantidad, precio]
      );
    }

    await pool.query(
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, pedido.rows[0].id_pedido]
    );

    res.status(201).json({ message: 'Pedido registrado', id_pedido: pedido.rows[0].id_pedido });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al registrar pedido' });
  }
});


// Levantar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});