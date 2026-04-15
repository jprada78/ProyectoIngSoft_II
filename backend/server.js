require('dotenv').config();

console.log("🔥 ESTE ES MI SERVER CORRECTO");
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect(err => {
    if (err) {
        console.error('Error conexión BD:', err);
    } else {
        console.log('Conectado a MySQL 🚀');
    }
});

// 🧪 Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});

// 🔐 REGISTRO DE USUARIO
app.post('/register', async (req, res) => {
    try {
        const { password, pregunta, respuesta } = req.body;

        // Validación básica
        if (!password || !pregunta || !respuesta) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO usuarios (password, pregunta, respuesta)
            VALUES (?, ?, ?)
        `;

        db.query(query, [hashedPassword, pregunta, respuesta], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al registrar');
            }

            res.send('Usuario registrado correctamente ✅');
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

// 🔐 LOGIN
app.post('/login', async (req, res) => {
    const { password } = req.body;

    const query = 'SELECT * FROM usuarios LIMIT 1';

    db.query(query, async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error en servidor');
        }

        if (results.length === 0) {
            return res.status(404).send('No hay usuario registrado');
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).send('Contraseña incorrecta');
        }

        res.send('Login exitoso ✅');
    });
});

// 📌 OBTENER PREGUNTA DE SEGURIDAD
app.get('/pregunta', (req, res) => {
    const query = 'SELECT pregunta FROM usuarios LIMIT 1';

    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Error');

        if (results.length === 0) {
            return res.status(404).send('No hay usuario');
        }

        res.json({ pregunta: results[0].pregunta });
    });
});

// 🔎 VERIFICAR RESPUESTA DE SEGURIDAD
app.post('/verificar-respuesta', (req, res) => {
    const { respuesta } = req.body;

    const query = 'SELECT * FROM usuarios LIMIT 1';

    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Error');

        const user = results[0];

        if (user.respuesta.trim().toLowerCase() !== respuesta.trim().toLowerCase()) {
            return res.status(401).send('Respuesta incorrecta');
        }

        res.send('Respuesta correcta');
    });
});

// 🔄 ACTUALIZAR CONTRASEÑA
app.post('/reset-password', async (req, res) => {
    const { nuevaPassword } = req.body;

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    const query = 'UPDATE usuarios SET password = ? LIMIT 1';

    db.query(query, [hashedPassword], (err) => {
        if (err) return res.status(500).send('Error al actualizar');

        res.send('Contraseña actualizada ✅');
    });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

// 🔎 VERIFICAR SI YA EXISTE USUARIO
app.get('/existe-usuario', (req, res) => {
    db.query('SELECT * FROM usuarios LIMIT 1', (err, results) => {
        if (err) return res.status(500).send('Error');

        res.json({ existe: results.length > 0 });
    });
});

