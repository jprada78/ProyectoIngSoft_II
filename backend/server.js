require('dotenv').config();

console.log("🔥 ESTE ES MI SERVER CORRECTO");

const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 CONEXIÓN MYSQL (POOL + PROMISE)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// 🧪 Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});


// 🔐 REGISTRO
app.post('/register', async (req, res) => {
    try {
        const { password, pregunta, respuesta } = req.body;

        if (!password || !pregunta || !respuesta) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO usuarios (password, pregunta, respuesta)
            VALUES (?, ?, ?)
        `;

        await db.execute(query, [hashedPassword, pregunta, respuesta]);

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
        res.status(500).send(err.message);
    }
});


// 🔎 VERIFICAR RESPUESTA
app.post('/verificar-respuesta', async (req, res) => {
    try {
        const { respuesta } = req.body;

        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        const user = results[0];

        if (user.respuesta.trim().toLowerCase() !== respuesta.trim().toLowerCase()) {
            return res.status(401).send('Respuesta incorrecta');
        }

        res.send('Respuesta correcta');

    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🔄 RESET PASSWORD
app.post('/reset-password', async (req, res) => {
    try {
        const { nuevaPassword } = req.body;

        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

        await db.execute('UPDATE usuarios SET password = ? LIMIT 1', [hashedPassword]);

        res.send('Contraseña actualizada ✅');

    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🔎 EXISTE USUARIO
app.get('/existe-usuario', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        res.json({ existe: results.length > 0 });

    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.get('/fix-db', async (req, res) => {
    try {
        await db.execute(`DROP TABLE IF EXISTS usuarios`);

        await db.execute(`
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                password VARCHAR(255) NOT NULL,
                pregunta VARCHAR(255) NOT NULL,
                respuesta VARCHAR(255) NOT NULL
            )
        `);

        res.send('Tabla creada correctamente ✅');

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});