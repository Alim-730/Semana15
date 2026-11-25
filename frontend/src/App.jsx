import { useEffect, useState } from 'react';

const API_PRODUCTOS = 'http://localhost:3001/api/productos';
const API_RESENAS = 'http://localhost:3001/api/resenas';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [prodForm, setProdForm] = useState({ id: null, nombre: '', precio: '', stock: '' });
  const [resenaForm, setResenaForm] = useState({
    id: null,
    productoId: '',
    autor: '',
    comentario: '',
    calificacion: 5,
  });

  const cargarDatos = async () => {
    try {
      const [resP, resR] = await Promise.all([fetch(API_PRODUCTOS), fetch(API_RESENAS)]);
      const dataP = await resP.json();
      const dataR = await resR.json();

      setProductos(Array.isArray(dataP) ? dataP : []);
      setResenas(Array.isArray(dataR) ? dataR : []);
    } catch {
      setError('No se pudo conectar con el backend. Verifica que node server.js esté corriendo.');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarAviso = (msg, esError = false) => {
    setMensaje(esError ? '' : msg);
    setError(esError ? msg : '');
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    const url = prodForm.id ? `${API_PRODUCTOS}/${prodForm.id}` : API_PRODUCTOS;
    const method = prodForm.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodForm),
    });
    const data = await res.json();
    if (!res.ok) return mostrarAviso(data.error, true);

    mostrarAviso(data.message);
    setProdForm({ id: null, nombre: '', precio: '', stock: '' });
    cargarDatos();
  };

  const eliminarProducto = async (id) => {
    const res = await fetch(`${API_PRODUCTOS}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return mostrarAviso(data.error, true);
    mostrarAviso(data.message);
    cargarDatos();
  };

  const guardarResena = async (e) => {
    e.preventDefault();
    const url = resenaForm.id ? `${API_RESENAS}/${resenaForm.id}` : API_RESENAS;
    const method = resenaForm.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productoId: Number(resenaForm.productoId),
        autor: resenaForm.autor,
        comentario: resenaForm.comentario,
        calificacion: Number(resenaForm.calificacion),
      }),
    });
    const data = await res.json();
    if (!res.ok) return mostrarAviso(data.error, true);

    mostrarAviso(data.message);
    setResenaForm({ id: null, productoId: '', autor: '', comentario: '', calificacion: 5 });
    cargarDatos();
  };

  const eliminarResena = async (id) => {
    const res = await fetch(`${API_RESENAS}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return mostrarAviso(data.error, true);
    mostrarAviso(data.message);
    cargarDatos();
  };

  const renderEstrellas = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>Panel Tienda Fullstack</h1>
          <p>Integración de API RESTful con doble base de datos (SQLite + MongoDB)</p>
        </div>
        <div className="stats">
          <div className="stat-box">
            <span className="stat-number">{productos.length}</span>
            <span className="stat-label">Productos</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{resenas.length}</span>
            <span className="stat-label">Reseñas</span>
          </div>
        </div>
      </header>

      {mensaje && (
        <div className="alert alert-success">
          <span>{mensaje}</span>
          <button className="alert-close" onClick={() => setMensaje('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <main className="grid">
        <section className="card">
          <div className="card-header">
            <h2>Gestión de Productos</h2>
            <span className="badge badge-sql">SQLite (SQL)</span>
          </div>

          <form onSubmit={guardarProducto} className="form">
            <div className="field">
              <label>Nombre del producto</label>
              <input
                placeholder="Ej. Teclado mecánico"
                value={prodForm.nombre}
                onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={prodForm.precio}
                  onChange={(e) => setProdForm({ ...prodForm, precio: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Stock disponible</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-sql">
                {prodForm.id ? 'Guardar cambios' : 'Agregar producto'}
              </button>
              {prodForm.id && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProdForm({ id: null, nombre: '', precio: '', stock: '' })}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {productos.length === 0 ? (
            <div className="empty-state">No hay productos registrados todavía.</div>
          ) : (
            <ul className="item-list">
              {productos.map((p) => (
                <li key={p.id} className="item-card">
                  <div className="item-info">
                    <div className="item-title">
                      <span className="id-tag">ID #{p.id}</span>
                      <span>{p.nombre}</span>
                    </div>
                    <div className="item-meta">
                      Precio: <span className="price">S/ {Number(p.precio).toFixed(2)}</span> · Stock: {p.stock} uds.
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-edit" onClick={() => setProdForm(p)}>
                      Editar
                    </button>
                    <button className="btn btn-delete" onClick={() => eliminarProducto(p.id)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Reseñas de Clientes</h2>
            <span className="badge badge-mongo">MongoDB (NoSQL)</span>
          </div>

          <form onSubmit={guardarResena} className="form">
            <div className="form-row">
              <div className="field">
                <label>ID del Producto</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 1"
                  value={resenaForm.productoId}
                  onChange={(e) => setResenaForm({ ...resenaForm, productoId: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Calificación (1 a 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={resenaForm.calificacion}
                  onChange={(e) => setResenaForm({ ...resenaForm, calificacion: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Autor</label>
              <input
                placeholder="Ej. Valeria Mendoza"
                value={resenaForm.autor}
                onChange={(e) => setResenaForm({ ...resenaForm, autor: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Comentario</label>
              <input
                placeholder="Escribe una opinión sobre el producto..."
                value={resenaForm.comentario}
                onChange={(e) => setResenaForm({ ...resenaForm, comentario: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-mongo">
                {resenaForm.id ? 'Guardar cambios' : 'Publicar reseña'}
              </button>
              {resenaForm.id && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setResenaForm({ id: null, productoId: '', autor: '', comentario: '', calificacion: 5 })
                  }
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {resenas.length === 0 ? (
            <div className="empty-state">No hay reseñas registradas todavía.</div>
          ) : (
            <ul className="item-list">
              {resenas.map((r) => (
                <li key={r._id} className="item-card">
                  <div className="item-info">
                    <div className="item-title">
                      <span className="id-tag">Prod #{r.productoId}</span>
                      <span>{r.autor}</span>
                      <span className="stars">{renderEstrellas(r.calificacion)}</span>
                    </div>
                    <p className="comment-text">"{r.comentario}"</p>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-edit"
                      onClick={() =>
                        setResenaForm({
                          id: r._id,
                          productoId: r.productoId,
                          autor: r.autor,
                          comentario: r.comentario,
                          calificacion: r.calificacion,
                        })
                      }
                    >
                      Editar
                    </button>
                    <button className="btn btn-delete" onClick={() => eliminarResena(r._id)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}