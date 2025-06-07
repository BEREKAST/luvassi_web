// backend/index.js (Versión corregida con rutas de admin y historial de pedidos)

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db'); // Conexión a PostgreSQL

const app = express();
const PORT = process.env.PORT || 5000;

// === MODIFICACIÓN CLAVE AQUÍ PARA CORS DINÁMICO ===
const allowedOrigins = [
  'https://luvassi-frontend-app.onrender.com', // Frontend desplegado en Render
  'http://localhost:3000' // Frontend en desarrollo local
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (ej. Postman, cURL) o desde los orígenes permitidos
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy: ' + origin), false);
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true, // Importante si usas cookies/sesiones (aunque no veo uso aquí, es buena práctica)
  optionsSuccessStatus: 204 // Código de estado para las solicitudes OPTIONS (preflight)
};

app.use(cors(corsOptions));
// === FIN DE LA MODIFICACIÓN CORS ===

// Middlewares
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
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

// Rutas
app.get('/', (req, res) => {
  res.status(200).send('Servidor backend de Luvassi está operativo. Accede a las APIs en /api.');
});

app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "¡Backend funcionando!", hora: result.rows[0].now });
  } catch (err) {
    console.error('Error al conectar a PostgreSQL en /api:', err);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

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

// Ruta para obtener todos los productos (con filtrado opcional)
// MODIFICADO: Ahora acepta un parámetro de búsqueda 'search'
app.get('/api/productos', async (req, res) => {
  const { search } = req.query; // Obtiene el término de búsqueda de la URL
  let query = 'SELECT * FROM producto'; // Asegúrate de que 'producto' es el nombre correcto de tu tabla
  const queryParams = [];

  if (search) {
    // Añade una cláusula WHERE para filtrar por nombre_producto o descripcion
    // ILIKE es para búsqueda insensible a mayúsculas/minúsculas
    // $1 es el placeholder para el primer parámetro
    query += ' WHERE nombre_producto ILIKE $1 OR descripcion ILIKE $1';
    queryParams.push(`%${search}%`); // El comodín % se añade al valor del parámetro
  }
  query += ' ORDER BY id_producto ASC;'; // O el orden que prefieras

  try {
    console.log("Executing product query:", query, queryParams); // Log para depuración
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos con filtro en backend:', err); // Log más descriptivo
    res.status(500).json({ message: 'Error interno del servidor al obtener productos.' });
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

// NUEVA RUTA: Obtener historial de pedidos de un cliente específico
app.get('/api/pedidos/cliente/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params; // Captura el id_cliente de la URL

  try {
    // Opcional pero recomendado: Verificar si el cliente existe
    const clienteExists = await pool.query(
      'SELECT 1 FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteExists.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // Consulta para obtener pedidos con sus detalles y la información de la factura
    const pedidosResult = await pool.query(
      `SELECT
         p.id_pedido,
         p.estado_pedido,
         p.total,
         p.fecha_pedido,
         json_agg(
           json_build_object(
             'id_producto', dp.id_producto,
             'nombre_producto', prod.nombre_producto,
             'cantidad', dp.cantidad,
             'precio_unitario', dp.precio,
             'imagen', prod.imagen
           )
         ) AS productos,
         f.metodo_pago,
         f.estado_pago,
         f.fecha_emision AS fecha_factura
       FROM pedido p
       JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
       JOIN producto prod ON dp.id_producto = prod.id_producto
       JOIN factura f ON p.id_pedido = f.id_pedido
       WHERE p.id_cliente = $1
       GROUP BY p.id_pedido, p.estado_pedido, p.total, p.fecha_pedido, f.metodo_pago, f.estado_pago, f.fecha_emision
       ORDER BY p.fecha_pedido DESC`,
      [id_cliente]
    );

    // Si no hay pedidos para el cliente, devuelve un array vacío (status 200)
    if (pedidosResult.rows.length === 0) {
      return res.status(200).json([]);
    }

    // Devuelve los pedidos encontrados
    res.status(200).json(pedidosResult.rows);

  } catch (error) {
    console.error(`Error al obtener historial de pedidos para el cliente ${id_cliente}:`, error);
    res.status(500).json({ message: 'Error al obtener historial de pedidos.' });
  }
});

// Crear pedido con factura (CORRECCIÓN CLAVE: Usar 'client.query' en todas las operaciones de la transacción)
app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, productos, metodo_pago } = req.body;

  let client; // Declarar 'client' aquí para asegurar su disponibilidad en 'finally'

  try {
    client = await pool.connect(); // Obtener una conexión del pool
    await client.query('BEGIN'); // Iniciar la transacción

    // 1. Verificar si el cliente existe (usando 'client.query')
    const clienteExists = await client.query(
      'SELECT 1 FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteExists.rows.length === 0) {
      await client.query('ROLLBACK'); // Deshacer si el cliente no es válido
      return res.status(400).json({ message: 'El ID de cliente no es válido.' });
    }

    // 2. Insertar el pedido (usando 'client.query')
    const now = new Date();
    const pedidoResult = await client.query(
      'INSERT INTO pedido (id_cliente, estado_pedido, total, fecha_pedido) VALUES ($1, $2, 0, $3) RETURNING id_pedido',
      [id_cliente, 'pendiente', now]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let total = 0;

    // 3. Insertar los detalles del pedido y calcular el total (usando 'client.query')
    for (const p of productos) {
      // Obtener el precio del producto (usando 'client.query' para consistencia transaccional)
      const prodResult = await client.query('SELECT * FROM producto WHERE id_producto = $1', [p.id_producto]);
      if (prodResult.rows.length === 0) {
        await client.query('ROLLBACK'); // Deshacer si un producto no se encuentra
        return res.status(404).json({ message: `Producto con ID ${p.id_producto} no encontrado.` });
      }
      const precio = prodResult.rows[0].precio;
      total += precio * p.cantidad;

      // Insertar detalle de pedido (usando 'client.query')
      await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
        [id_pedido, p.id_producto, p.cantidad, precio]
      );
    }

    // 4. Actualizar el total en el pedido (usando 'client.query')
    await client.query(
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, id_pedido]
    );

    // 5. Insertar la factura (CORRECCIÓN CLAVE: Usando 'client.query' aquí)
    const facturaResult = await client.query(
      'INSERT INTO factura (id_pedido, fecha_emision, monto_total, estado_pago, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING id_factura',
      [id_pedido, now, total, 'Pagado', metodo_pago]
    );
    const id_factura = facturaResult.rows[0].id_factura;

    await client.query('COMMIT'); // Confirmar la transacción

    res.status(201).json({
      message: 'Pedido registrado exitosamente',
      id_pedido,
      id_factura
    });
  } catch (error) {
    if (client) { // Asegurarse de que 'client' existe antes de intentar 'ROLLBACK'
      await client.query('ROLLBACK'); // Deshacer la transacción en caso de cualquier error
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al registrar pedido' });
  } finally {
    if (client) {
      client.release(); // Siempre liberar el cliente de vuelta al pool
    }
  }
});

// NUEVAS RUTAS PARA LA GESTIÓN DE PEDIDOS DEL ADMINISTRADOR
// --------------------------------------------------------

// Ruta para obtener todos los pedidos (solo para administradores)
app.get('/api/admin/pedidos', async (req, res) => {
  try {
    // NOTA: En un sistema real, implementar aquí un middleware de autenticación
    // y autorización para verificar que el usuario es un 'admin'.
    // Por ahora, esta ruta es accesible para cualquier solicitud,
    // la verificación de rol se hará en el frontend por simplicidad.

    const allPedidos = await pool.query(
      `SELECT
         p.id_pedido,
         p.id_cliente,
         u.nombre AS nombre_cliente,
         u.correo_electronico AS correo_cliente,
         p.estado_pedido,
         p.total,
         p.fecha_pedido,
         json_agg(
           json_build_object(
             'id_producto', dp.id_producto,
             'nombre_producto', prod.nombre_producto,
             'cantidad', dp.cantidad,
             'precio_unitario', dp.precio,
             'imagen', prod.imagen
           )
         ) AS productos,
         f.metodo_pago,
         f.estado_pago,
         f.fecha_emision AS fecha_factura,
         f.id_factura
       FROM pedido p
       JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
       JOIN producto prod ON dp.id_producto = prod.id_producto
       JOIN factura f ON p.id_pedido = f.id_pedido
       JOIN cliente c ON p.id_cliente = c.id_cliente
       JOIN usuario u ON c.id_usuario = u.id_usuario
       GROUP BY p.id_pedido, p.id_cliente, u.nombre, u.correo_electronico, p.estado_pedido, p.total, p.fecha_pedido, f.metodo_pago, f.estado_pago, f.fecha_emision, f.id_factura
       ORDER BY p.fecha_pedido DESC`
    );

    res.status(200).json(allPedidos.rows);
  } catch (error) {
    console.error('Error al obtener todos los pedidos para admin:', error);
    res.status(500).json({ message: 'Error al obtener los pedidos.' });
  }
});

// Ruta para actualizar el estado de un pedido (solo para administradores)
app.put('/api/admin/pedidos/:id_pedido/estado', async (req, res) => {
  const { id_pedido } = req.params;
  const { nuevo_estado } = req.body; // 'completado', 'cancelado', 'pendiente', etc.

  // Validar el nuevo estado (opcional pero recomendado)
  const estadosValidos = ['pendiente', 'completado', 'cancelado'];
  if (!estadosValidos.includes(nuevo_estado)) {
    return res.status(400).json({ message: 'Estado de pedido no válido.' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Actualizar el estado del pedido
    const result = await client.query(
      'UPDATE pedido SET estado_pedido = $1 WHERE id_pedido = $2 RETURNING *',
      [nuevo_estado, id_pedido]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Opcional: Actualizar el estado de pago de la factura si el pedido se completa o cancela
    let estado_pago_factura = 'Pagado'; // Asumimos pagado por defecto si se completa
    if (nuevo_estado === 'cancelado') {
      estado_pago_factura = 'Reembolsado'; // O 'Anulado' si el pedido se cancela
    } else if (nuevo_estado === 'pendiente') {
      estado_pago_factura = 'Pendiente'; // Si el estado del pedido vuelve a pendiente, la factura también
    }

    await client.query(
      'UPDATE factura SET estado_pago = $1 WHERE id_pedido = $2',
      [estado_pago_factura, id_pedido]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: `Estado del pedido ${id_pedido} actualizado a ${nuevo_estado}.`,
      pedido: result.rows[0]
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error(`Error al actualizar estado del pedido ${id_pedido}:`, error);
    res.status(500).json({ message: 'Error al actualizar el estado del pedido.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});


// --------------------------------------------------------
// FIN DE RUTAS PARA LA GESTIÓN DE PEDIDOS DEL ADMINISTRADOR


// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
