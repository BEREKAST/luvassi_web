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
        id: nuevoUsuario.id_usuario, // ID del usuario de la tabla 'usuario'
        id_cliente, // ID del cliente de la tabla 'cliente' (si aplica)
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
        id: usuario.id_usuario, // ID del usuario de la tabla 'usuario'
        id_cliente, // ID del cliente de la tabla 'cliente' (si aplica)
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
  // Se recibe directamente el id_cliente que envía el frontend
  // ¡NUEVO! Recibe tambien el metodo_pago
  const { id_cliente, productos, metodo_pago } = req.body; // Se añade metodo_pago

  let client; // Variable para la transacción

  try {
    client = await pool.connect(); // Obtener un cliente de la pool
    await client.query('BEGIN'); // Iniciar la transacción

    // 1. Validar que el id_cliente proporcionado realmente existe en la tabla 'cliente'
    const clienteExists = await client.query( // Usar client para la transacción
      'SELECT 1 FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteExists.rows.length === 0) {
      await client.query('ROLLBACK'); // Revertir si el cliente no existe
      return res.status(400).json({ message: 'El ID de cliente proporcionado no es válido o no existe.' });
    }

    const now = new Date();
    // 2. Insertar el nuevo pedido usando el id_cliente directamente
    const pedidoResult = await client.query( // Usar client para la transacción
      'INSERT INTO pedido (id_cliente, estado_pedido, total, fecha_pedido) VALUES ($1, $2, 0, $3) RETURNING id_pedido',
      [id_cliente, 'pendiente', now]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let total = 0;

    // 3. Procesar cada producto en el pedido
    for (const p of productos) {
      const prodResult = await client.query('SELECT * FROM producto WHERE id_producto = $1', [p.id_producto]); // Usar client
      if (prodResult.rows.length === 0) {
        await client.query('ROLLBACK'); // Revertir si un producto no se encuentra
        return res.status(404).json({ message: `Producto con ID ${p.id_producto} no encontrado.` });
      }
      const precio = prodResult.rows[0].precio;
      total += precio * p.cantidad;

      // Insertar el detalle del pedido
      await client.query( // Usar client
        'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
        [id_pedido, p.id_producto, p.cantidad, precio]
      );
    }

    // 4. Actualizar el total del pedido
    await client.query( // Usar client
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, id_pedido]
    );

    // ¡NUEVO! 5. Crear una entrada en la tabla 'factura'
    const facturaResult = await client.query( // Usar client
      'INSERT INTO factura (id_pedido, fecha_emision, monto_total, estado_pago, metodo_pago) VALUES ($1, $2, $3, $4, $5) RETURNING id_factura',
      [id_pedido, now, total, 'Pagado', metodo_pago] // Puedes ajustar 'Pagado' a 'Pendiente' o 'Registrado' según tu flujo real
    );
    const id_factura = facturaResult.rows[0].id_factura;

    await client.query('COMMIT'); // Confirmar la transacción

    // 6. Enviar respuesta de éxito
    res.status(201).json({ message: 'Pedido registrado exitosamente', id_pedido: id_pedido, id_factura: id_factura }); // Retorna el id de factura
  } catch (error) {
    if (client) { // Si hay un cliente de transacción, hacer rollback
      await client.query('ROLLBACK');
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error al registrar pedido' });
  } finally {
    if (client) {
      client.release(); // Liberar el cliente de la pool
    }
  }
});

// NUEVA RUTA: Obtener pedidos por ID de cliente
app.get('/api/pedidos/cliente/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params; // Obtener id_cliente de los parámetros de la URL

  try {
    // Validar que el id_cliente proporcionado realmente existe en la tabla 'cliente'
    const clienteExists = await pool.query(
      'SELECT 1 FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteExists.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // Obtener todos los pedidos asociados a este id_cliente
    const pedidosResult = await pool.query(
      `SELECT
          p.id_pedido,
          p.estado_pedido,
          p.total,
          p.fecha_pedido,
          f.metodo_pago, -- ¡NUEVO! Incluir el método de pago de la factura
          json_agg(
            json_build_object(
              'id_producto', dp.id_producto,
              'nombre_producto', pr.nombre_producto,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio,
              'imagen', pr.imagen
            )
          ) AS productos_detalle
        FROM
          pedido p
        JOIN
          detalle_pedido dp ON p.id_pedido = dp.id_pedido
        JOIN
          producto pr ON dp.id_producto = pr.id_producto
        LEFT JOIN -- Usar LEFT JOIN para facturas, por si un pedido aún no tiene factura
          factura f ON p.id_pedido = f.id_pedido
        WHERE
          p.id_cliente = $1
        GROUP BY
          p.id_pedido, p.estado_pedido, p.total, p.fecha_pedido, f.metodo_pago -- Agrupar también por método de pago
        ORDER BY
          p.fecha_pedido DESC`,
      [id_cliente]
    );

    if (pedidosResult.rows.length === 0) {
      return res.status(200).json({ message: 'No hay pedidos para este cliente.', pedidos: [] });
    }

    res.status(200).json({ pedidos: pedidosResult.rows });

  } catch (error) {
    console.error('Error al obtener pedidos del cliente:', error);
    res.status(500).json({ message: 'Error del servidor al obtener pedidos.' });
  }
});


// Levantar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});
