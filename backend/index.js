const express = require('express');
const cors = require('cors'); // Ya tienes esta línea, ¡asegúrate de que esté ahí!
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Asegúrate de que db.js cargue dotenv y tenga la configuración SSL
const pool = require('./db'); // Conexión a PostgreSQL

const app = express();
// Usar process.env.PORT para el puerto de Render, o 5000 para desarrollo local.
const PORT = process.env.PORT || 5000;

// === INICIO DE LA MODIFICACIÓN CORS ===
// Configuración de CORS para permitir solo tu frontend desplegado
const corsOptions = {
  // ¡ATENCIÓN! La URL de tu frontend debe ser EXACTA aquí.
  // Es 'https://luvassi-frontend-app.onrender.com'
  origin: 'https://luvassi-frontend-app.onrender.com',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // Métodos HTTP que permites
  credentials: true, // Importante si tu app usa cookies o sesiones
  optionsSuccessStatus: 204 // Para las preflight requests OPTIONS (204 No Content)
};

// Aplica el middleware CORS con las opciones configuradas.
// Esta línea REEMPLAZA a `app.use(cors());`
app.use(cors(corsOptions));
// === FIN DE LA MODIFICACIÓN CORS ===

// Middlewares (el resto se mantiene igual)
app.use(express.json());
// La ruta para servir imágenes debe ser relativa a la raíz del proyecto para Render
// Render montará tu app en la raíz del dominio, así que '/uploads' funcionará.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config (sin cambios)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    // Asegúrate de que la carpeta exista antes de intentar guardar
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // recursive: true para crear carpetas anidadas si no existen
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Nueva ruta de prueba en la raíz (sin cambios)
app.get('/', (req, res) => {
  res.status(200).send('Servidor backend de Luvassi está operativo. Accede a las APIs en /api.');
});

// Ruta de prueba para verificar conexión a PostgreSQL (sin cambios)
app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "¡Backend funcionando!", hora: result.rows[0].now }); // Accede a .now para el campo específico
  } catch (err) {
    console.error('Error al conectar a PostgreSQL:', err);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

// Registro de usuario (sin cambios)
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

// Login de usuario (sin cambios)
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

// Rutas para productos (sin cambios)
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

// Crear pedido con factura (sin cambios)
app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, productos, metodo_pago } = req.body;

  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const clienteExists = await client.query(
      'SELECT 1 FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El ID de cliente no es válido.' });
    }

    const now = new Date();
    const pedidoResult = await client.query(
      'INSERT INTO pedido (id_cliente, estado_pedido, total, fecha_pedido) VALUES ($1, $2, 0, $3) RETURNING id_pedido',
      [id_cliente, 'pendiente', now]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let total = 0;

    for (const p of productos) {
      const prodResult = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [p.id_producto]);
      if (prodResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: `Producto con ID ${p.id_producto} no encontrado.` });
      }
      const precio = prodResult.rows[0].precio;
      total += precio * p.cantidad;

      await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
        [id_pedido, p.id_producto, p.cantidad, precio]
      );
    }

    await client.query(
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, id_pedido]
    );

    const facturaResult = await pool.query(
      'INSERT INTO factura (id_pedido, fecha_emision, monto_total, estado_pago, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING id_factura',
      [id_pedido, now, total, 'Pagado', metodo_pago]
    );
    const id_factura = facturaResult.rows[0].id_factura;

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pedido registrado exitosamente',
      id_pedido,
      id_factura
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al registrar pedido' });
  } finally {
    if (client) client.release();
  }
});

// Final del archivo (sin cambios)
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});