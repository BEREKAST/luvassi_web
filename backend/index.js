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
  'https://luvassi-web.vercel.app', // Frontend desplegado en Vercel
  // Agrega aquí cualquier otro dominio donde tu frontend pueda estar desplegado, por ejemplo:
  // 'https://tu-otra-app.render.com', // Si despliegas el frontend en Render
  'http://localhost:3000' // Frontend en desarrollo local
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (ej. Postman, cURL) o desde los orígenes permitidos
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS Blocked: Not allowed by CORS policy for origin: ' + origin); // Log de advertencia
      callback(new Error('Not allowed by CORS policy: ' + origin), false);
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
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
    // console.log("Executing product query:", query, queryParams); // Log para depuración
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
          JOIN cliente c ON p.id_cliente = c.id_cliente
          JOIN usuario u ON c.id_usuario = u.id_usuario
          WHERE p.id_cliente = $1
          GROUP BY p.id_pedido, p.estado_pedido, p.total, p.fecha_pedido, f.metodo_pago, f.estado_pago, f.fecha_emision, f.id_factura
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

    // 2. Insertar el pedido (AHORA SIN 'metodo_pago' en la tabla 'pedido')
    const now = new Date();
    const pedidoResult = await client.query(
      'INSERT INTO pedido (id_cliente, estado_pedido, total, fecha_pedido) VALUES ($1, $2, 0, $3) RETURNING id_pedido',
      [id_cliente, 'pendiente', now]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let total = 0;

    // 3. Procesar cada producto en el pedido: verificar stock, insertar detalle, actualizar stock
    for (const p of productos) {
      // Obtener el precio y stock del producto (usando 'client.query' y FOR UPDATE)
      const prodResult = await client.query(
        'SELECT nombre_producto, precio, cantidad_en_inventario FROM producto WHERE id_producto = $1 FOR UPDATE',
        [p.id_producto]
      );

      if (prodResult.rows.length === 0) {
        await client.query('ROLLBACK'); // Deshacer si un producto no se encuentra
        return res.status(404).json({ message: `Producto con ID ${p.id_producto} no encontrado.` });
      }

      const productoDB = prodResult.rows[0];

      // Verificar stock
      if (productoDB.cantidad_en_inventario < p.cantidad) {
        await client.query('ROLLBACK'); // Deshacer si no hay stock suficiente
        return res.status(400).json({
          message: `Stock insuficiente para el producto '${productoDB.nombre_producto}'. Disponible: ${productoDB.cantidad_en_inventario}, Solicitado: ${p.cantidad}`
        });
      }

      const precio = productoDB.precio;
      total += precio * p.cantidad;

      // Insertar detalle de pedido (usando 'client.query')
      await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
        [id_pedido, p.id_producto, p.cantidad, precio]
      );

      // Decrementar la cantidad en inventario (usando 'client.query')
      await client.query(
        'UPDATE producto SET cantidad_en_inventario = cantidad_en_inventario - $1 WHERE id_producto = $2',
        [p.cantidad, p.id_producto]
      );
    }

    // 4. Actualizar el total en el pedido (usando 'client.query')
    await client.query(
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, id_pedido]
    );

    // 5. Insertar la factura (CORRECCIÓN CLAVE: Usando 'client.query' aquí y con metodo_pago)
    const facturaResult = await client.query(
      'INSERT INTO factura (id_pedido, fecha_emision, monto_total, estado_pago, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING id_factura',
      [id_pedido, now, total, 'Pendiente', metodo_pago] // 'metodo_pago' se usa aquí para la factura
    );
    const id_factura = facturaResult.rows[0].id_factura;

    let qr_code_url = null;
    // Generar URL de QR si el método de pago es 'Pago QR'
    if (metodo_pago === 'Pago QR') {
      // === CORRECCIÓN AQUÍ: Usar la URL de Vercel/Render para el frontend ===
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000'; // Define una variable de entorno para esto
      const qr_data = `${frontendBaseUrl}/confirmar-pago?pedido=${id_pedido}&total=${total}&factura=${id_factura}`;
      qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr_data)}`;
    }

    await client.query('COMMIT'); // Confirmar la transacción

    res.status(201).json({
      message: 'Pedido registrado exitosamente',
      id_pedido,
      id_factura,
      qr_code_url // Incluye la URL del QR en la respuesta
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK'); // Deshacer la transacción en caso de cualquier error
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al registrar pedido: ' + error.message }); // Mensaje de error más detallado
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

// NUEVA RUTA: Obtener todos los usuarios registrados (para admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    // En un sistema real, aquí iría un middleware de autenticación y autorización
    // para asegurar que solo los administradores puedan acceder a esta ruta.
    const users = await pool.query(
      `SELECT
          id_usuario,
          nombre,
          correo_electronico,
          direccion,
          rol
        FROM usuario
        ORDER BY nombre ASC`
    );
    res.status(200).json(users.rows);
  } catch (error) {
    console.error('Error al obtener todos los usuarios para admin:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios.' });
  }
});

// NUEVA RUTA: Actualizar stock de un producto (para admin)
app.put('/api/admin/products/:id_producto/stock', async (req, res) => {
  const { id_producto } = req.params;
  const { quantity } = req.body; // La cantidad a añadir

  // Validación básica
  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad a agregar debe ser un número positivo.' });
  }

  try {
    const result = await pool.query(
      'UPDATE producto SET cantidad_en_inventario = cantidad_en_inventario + $1 WHERE id_producto = $2 RETURNING *',
      [quantity, id_producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.status(200).json({
      message: `Stock del producto ${id_producto} actualizado. Nuevo stock: ${result.rows[0].cantidad_en_inventario}`,
      product: result.rows[0]
    });
  } catch (error) {
    console.error(`Error al actualizar stock del producto ${id_producto}:`, error);
    res.status(500).json({ message: 'Error al actualizar el stock del producto.' });
  }
});

// NUEVA RUTA: Eliminar un usuario y sus registros relacionados (para admin)
app.delete('/api/admin/users/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN'); // Iniciar la transacción

    // 1. Obtener id_cliente asociado al id_usuario
    const clienteResult = await client.query(
      'SELECT id_cliente FROM cliente WHERE id_usuario = $1',
      [id_usuario]
    );

    const id_cliente = clienteResult.rows.length > 0 ? clienteResult.rows[0].id_cliente : null;

    if (id_cliente) {
      // 2. Eliminar facturas asociadas a los pedidos de este cliente
      await client.query(
        `DELETE FROM factura WHERE id_pedido IN (SELECT id_pedido FROM pedido WHERE id_cliente = $1)`,
        [id_cliente]
      );

      // 3. Eliminar detalles de pedidos asociados a los pedidos de este cliente
      await client.query(
        `DELETE FROM detalle_pedido WHERE id_pedido IN (SELECT id_pedido FROM pedido WHERE id_cliente = $1)`,
        [id_cliente]
      );

      // 4. Eliminar pedidos del cliente
      await client.query('DELETE FROM pedido WHERE id_cliente = $1', [id_cliente]);

      // 5. Eliminar el registro del cliente
      await client.query('DELETE FROM cliente WHERE id_cliente = $1', [id_cliente]);
    }

    // 6. Finalmente, eliminar el usuario
    const userDeleteResult = await client.query(
      'DELETE FROM usuario WHERE id_usuario = $1 RETURNING *',
      [id_usuario]
    );

    if (userDeleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    await client.query('COMMIT'); // Confirmar la transacción
    res.status(200).json({ message: 'Usuario y todos sus registros relacionados eliminados exitosamente.' });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK'); // Deshacer la transacción en caso de error
    }
    console.error(`Error al eliminar usuario ${id_usuario} y sus registros relacionados:`, error);
    res.status(500).json({ message: 'Error al eliminar el usuario y sus registros.' });
  } finally {
    if (client) {
      client.release(); // Siempre liberar el cliente de vuelta al pool
    }
  }
});


// --------------------------------------------------------
// FIN DE RUTAS PARA LA GESTIÓN DE PEDIDOS DEL ADMINISTRADOR


// ==============================================================
//           NUEVAS RUTAS PARA EL HISTORIAL DE VENTAS Y ESTADÍSTICAS
// ==============================================================

// Ruta: Obtener todas las ventas completadas
app.get('/api/sales/completed', async (req, res) => {
  try {
    const sales = await pool.query(
      `SELECT
          p.id_pedido,
          p.fecha_pedido,
          p.total,
          f.metodo_pago,
          u.nombre AS nombre_cliente,
          u.correo_electronico AS correo_cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        JOIN usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN factura f ON p.id_pedido = f.id_pedido
        WHERE p.estado_pedido = 'completado'
        ORDER BY p.fecha_pedido DESC`
    );
    res.status(200).json(sales.rows);
  } catch (error) {
    console.error('Error al obtener ventas completadas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener ventas completadas.' });
  }
});

// Ruta: Obtener todas las ventas canceladas
app.get('/api/sales/cancelled', async (req, res) => {
  try {
    const sales = await pool.query(
      `SELECT
          p.id_pedido,
          p.fecha_pedido,
          p.total,
          f.metodo_pago,
          u.nombre AS nombre_cliente,
          u.correo_electronico AS correo_cliente
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        JOIN usuario u ON c.id_usuario = u.id_usuario
        LEFT JOIN factura f ON p.id_pedido = f.id_pedido
        WHERE p.estado_pedido = 'cancelado'
        ORDER BY p.fecha_pedido DESC`
    );
    res.status(200).json(sales.rows);
  } catch (error) {
    console.error('Error al obtener ventas canceladas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener ventas canceladas.' });
  }
});

// Ruta: Obtener el stock actual de todos los productos
app.get('/api/products/stock', async (req, res) => {
  try {
    const products = await pool.query(
      `SELECT id_producto, nombre_producto, cantidad_en_inventario, imagen
        FROM producto
        ORDER BY nombre_producto ASC`
    );
    res.status(200).json(products.rows);
  } catch (error) {
    console.error('Error al obtener stock de productos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener stock de productos.' });
  }
});

// Ruta: Obtener resumen de ventas por fecha (para gráfico)
app.get('/api/sales/summary-by-date', async (req, res) => {
  try {
    const salesSummary = await pool.query(
      `SELECT
          TO_CHAR(fecha_pedido, 'YYYY-MM-DD') AS sale_date,
          COUNT(id_pedido) AS total_orders,
          SUM(total) AS total_revenue
        FROM pedido
        WHERE estado_pedido = 'completado'
        GROUP BY TO_CHAR(fecha_pedido, 'YYYY-MM-DD')
        ORDER BY sale_date ASC`
    );
    res.status(200).json(salesSummary.rows);
  } catch (error) {
    console.error('Error al obtener resumen de ventas por fecha:', error);
    res.status(500).json({ message: 'Error del servidor al obtener resumen de ventas.' });
  }
});

// ==============================================================
//           FIN DE RUTAS PARA EL HISTORIAL DE VENTAS Y ESTADÍSTICAS
// ==============================================================


// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});