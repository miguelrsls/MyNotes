const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db/bd");
const path = require("path");

const app = express();

app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Verifica que tu Live Server use este puerto
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.static(__dirname)); // Permite cargar HTML, CSS y JS desde la carpeta raíz

app.use(
  session({
    secret: "secreto",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// RUTA PARA SERVIR EL DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!req.session.usuario) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// REGISTRO
app.post("/usuarios", async (req, res) => {
  try {
    const { nombre, telefono, email, password } = req.body;
    if (!nombre || !telefono || !email || !password) {
      return res.status(400).send("Faltan datos");
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO usuarios (nombre, telefono, email, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [nombre, telefono, email, hashPassword], (err) => {
      if (err) return res.status(500).send("Error al registrar");
      res.send("Usuario creado con éxito");
    });
  } catch (err) {
    res.status(500).send("Error del servidor");
  }
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).send("Credenciales inválidas");

    const usuario = results[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).send("Contraseña incorrecta");

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    };
    res.send("Login correcto");
  });
});

// PERFIL
app.get("/perfil", (req, res) => {
  if (!req.session.usuario) return res.status(401).send("No autorizado");
  res.json(req.session.usuario);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.send("Sesión cerrada"));
});

app.listen(3000, () => {
  console.log("Servidor API corriendo en http://localhost:3000");
});

// =========================
// CRUD DE NOTAS
// =========================

// 1. OBTENER NOTAS (Filtra por usuario y estado)
app.get("/notas", (req, res) => {
  if (!req.session.usuario) return res.status(401).send("No autorizado");

  const usuario_id = req.session.usuario.id;
  // Obtenemos todas las notas del usuario
  const sql = "SELECT * FROM notas WHERE usuario_id = ?";

  db.query(sql, [usuario_id], (err, results) => {
    if (err) return res.status(500).send("Error al obtener notas");
    res.json(results);
  });
});

// 2. CREAR NOTA
app.post("/notas", (req, res) => {
  if (!req.session.usuario) return res.status(401).send("No autorizado");
  const { titulo, nota } = req.body;
  const usuario_id = req.session.usuario.id;

  const sql =
    "INSERT INTO notas (titulo, nota, favorito, papelera, usuario_id) VALUES (?, ?, 0, 0, ?)";
  db.query(sql, [titulo, nota, usuario_id], (err) => {
    if (err) return res.status(500).send("Error al crear nota");
    res.send("Nota creada");
  });
});

// 3. ACTUALIZAR ESTADO (Favorito / Papelera)
app.put("/notas/:id", (req, res) => {
  const { id } = req.params;
  const { favorito, papelera } = req.body;

  const sql = "UPDATE notas SET favorito = ?, papelera = ? WHERE id = ?";
  db.query(sql, [favorito, papelera, id], (err) => {
    if (err) return res.status(500).send("Error al actualizar");
    res.send("Actualizado");
  });
});

// 4. ELIMINAR DEFINITIVAMENTE
app.delete("/notas/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM notas WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).send("Error al eliminar");
    res.send("Eliminada");
  });
});

// EDITAR CONTENIDO DE LA NOTA
app.put("/notas/editar/:id", (req, res) => {
  const { id } = req.params;
  const { titulo, nota } = req.body;

  if (!titulo || !nota) return res.status(400).send("Campos obligatorios");

  const sql = "UPDATE notas SET titulo = ?, nota = ? WHERE id = ?";
  db.query(sql, [titulo, nota, id], (err) => {
    if (err) return res.status(500).send("Error al editar la nota");
    res.send("Nota actualizada correctamente");
  });
});
