require('dotenv').config();

console.log("🔥 ESTE ES MI SERVER CORRECTO");

const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 CONEXIÓN MYSQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
}).promise();


// 🧪 TEST SERVIDOR
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});


// 🧪 TEST DB
app.get('/test-db', async (req, res) => {
    try {
        await db.execute('SELECT 1');
        res.send('BD conectada ✅');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en BD ❌');
    }
});


// 🔐 REGISTRO
app.post('/register', async (req, res) => {
    try {
        const { password, pregunta, respuesta } = req.body;

        if (!password || !pregunta || !respuesta) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        // Verificar si ya existe usuario
        const [rows] = await db.execute('SELECT * FROM usuarios LIMIT 1');
        if (rows.length > 0) {
            return res.status(400).send('Ya existe un usuario registrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO usuarios (password, pregunta, respuesta) VALUES (?, ?, ?)`,
            [hashedPassword, pregunta, respuesta]
        );

        res.send('Usuario registrado correctamente ✅');

    } catch (err) {
        console.error("🔥 ERROR REGISTER:", err);
        res.status(500).send(err.message);
    }
});


// 🔐 LOGIN
app.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).send('Ingrese la contraseña');
        }

        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        if (results.length === 0) {
            return res.status(404).send('No hay usuario registrado');
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).send('Contraseña incorrecta');
        }

        res.send('Login exitoso ✅');

    } catch (err) {
        console.error("🔥 ERROR LOGIN:", err);
        res.status(500).send(err.message);
    }
});


// 📌 PREGUNTA
app.get('/pregunta', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT pregunta FROM usuarios LIMIT 1');

        if (results.length === 0) {
            return res.status(404).send('No hay usuario');
        }

        res.json({ pregunta: results[0].pregunta });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// 🔎 VERIFICAR RESPUESTA
app.post('/verificar-respuesta', async (req, res) => {
    try {
        const { respuesta } = req.body;

        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        if (results.length === 0) {
            return res.status(404).send('No hay usuario');
        }

        const user = results[0];

        if (user.respuesta.trim().toLowerCase() !== respuesta.trim().toLowerCase()) {
            return res.status(401).send('Respuesta incorrecta');
        }

        res.send('Respuesta correcta');

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// 🔄 RESET PASSWORD
app.post('/reset-password', async (req, res) => {
    try {
        const { nuevaPassword } = req.body;

        if (!nuevaPassword) {
            return res.status(400).send('Ingrese la nueva contraseña');
        }

        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

        await db.execute(
            'UPDATE usuarios SET password = ? LIMIT 1',
            [hashedPassword]
        );

        res.send('Contraseña actualizada ✅');

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// 🔎 EXISTE USUARIO
app.get('/existe-usuario', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        res.json({ existe: results.length > 0 });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});