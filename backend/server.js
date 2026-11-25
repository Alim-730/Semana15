const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'tienda.sqlite');

app.use(cors());
app.use(express.json());

let db;

function guardarSQLite() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function listarProductos() {
  const res = db.exec('SELECT * FROM productos ORDER BY id DESC');
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((fila) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = fila[i];
    });
    return obj;
  });
}

// Modelo MongoDB (Reseñas)
const resenaSchema = new mongoose.Schema(
  {
    productoId: { type: Number, required: true },
    autor: { type: String, required: true, trim: true },
    comentario: { type: String, required: true, trim: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

const Resena = mongoose.model('Resena', resenaSchema);

// ================= RUTAS PRODUCTOS (SQLite) =================
app.get('/api/productos', (req, res) => {
  try {
    res.json(listarProductos());
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;
  if (!nombre || precio === '' || stock === '' || Number(precio) < 0 || Number(stock) < 0) {
    return res.status(400).json({ error: 'Datos de producto inválidos.' });
  }
  try {
    db.run('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', [
      nombre.trim(),
      Number(precio),
      Number(stock),
    ]);
    guardarSQLite();
    res.status(201).json({ message: 'Producto agregado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el producto.' });
  }
});

app.put('/api/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nombre, precio, stock } = req.body;
  if (!nombre || precio === '' || stock === '' || Number(precio) < 0 || Number(stock) < 0) {
    return res.status(400).json({ error: 'Datos de producto inválidos.' });
  }
  try {
    db.run('UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?', [
      nombre.trim(),
      Number(precio),
      Number(stock),
      id,
    ]);
    if (db.getRowsModified() === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    guardarSQLite();
    res.json({ message: 'Producto actualizado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el producto.' });
  }
});

app.delete('/api/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  try {
    db.run('DELETE FROM productos WHERE id = ?', [id]);
    if (db.getRowsModified() === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    guardarSQLite();
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el producto.' });
  }
});

// ================= RUTAS RESEÑAS (MongoDB) =================
app.get('/api/resenas', async (req, res) => {
  try {
    const resenas = await Resena.find().sort({ createdAt: -1 });
    res.json(resenas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reseñas.' });
  }
});

app.post('/api/resenas', async (req, res) => {
  const { productoId, autor, comentario, calificacion } = req.body;
  if (!productoId || !autor || !comentario || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: 'Datos de reseña inválidos.' });
  }
  try {
    const nueva = new Resena({
      productoId: Number(productoId),
      autor: autor.trim(),
      comentario: comentario.trim(),
      calificacion: Number(calificacion),
    });
    await nueva.save();
    res.status(201).json({ message: 'Reseña publicada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la reseña.' });
  }
});

app.put('/api/resenas/:id', async (req, res) => {
  const { productoId, autor, comentario, calificacion } = req.body;
  if (!productoId || !autor || !comentario || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: 'Datos de reseña inválidos.' });
  }
  try {
    const actualizada = await Resena.findByIdAndUpdate(
      req.params.id,
      {
        productoId: Number(productoId),
        autor: autor.trim(),
        comentario: comentario.trim(),
        calificacion: Number(calificacion),
      },
      { new: true }
    );
    if (!actualizada) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }
    res.json({ message: 'Reseña actualizada correctamente.' });
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar la reseña.' });
  }
});

app.delete('/api/resenas/:id', async (req, res) => {
  try {
    const eliminada = await Resena.findByIdAndDelete(req.params.id);
    if (!eliminada) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }
    res.json({ message: 'Reseña eliminada correctamente.' });
  } catch (err) {
    res.status(400).json({ error: 'Error al eliminar la reseña.' });
  }
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

async function iniciarServidor() {
  try {
    const SQL = await initSqlJs();
    db = fs.existsSync(DB_FILE)
      ? new SQL.Database(fs.readFileSync(DB_FILE))
      : new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER NOT NULL
      )
    `);
    guardarSQLite();
    console.log('Conectado a SQLite (SQL)');

    await mongoose.connect('mongodb://127.0.0.1:27017/tienda_fullstack');
    console.log('Conectado a MongoDB (NoSQL)');

    app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err.message);
  }
}

iniciarServidor();