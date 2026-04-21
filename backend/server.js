require('dotenv').config();

console.log("ESTE ES MI SERVER CORRECTO");

const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// CONEXIÓN MYSQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
}).promise();


// Abrir en Fronted
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});



// TEST DB
app.get('/test-db', async (req, res) => {
    try {
        await db.execute('SELECT 1');
        res.send('BD conectada');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en BD');
    }
});


// REGISTRO
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

        res.send('Usuario registrado correctamente');

    } catch (err) {
        console.error("ERROR REGISTER:", err);
        res.status(500).send(err.message);
    }
});


// LOGIN
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

        res.send('Login exitoso');

    } catch (err) {
        console.error("ERROR LOGIN:", err);
        res.status(500).send(err.message);
    }
});


// PREGUNTA
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


// VERIFICAR RESPUESTA
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


// RESET PASSWORD
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

        res.send('Contraseña actualizada correctamente');

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// EXISTE USUARIO
app.get('/existe-usuario', async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM usuarios LIMIT 1');

        res.json({ existe: results.length > 0 });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

function getBogotaDateTime() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(new Date());

    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function getBogotaDateParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return {
        year: values.year,
        month: values.month,
        day: values.day,
    };
}

function getDashboardRanges() {
    const { year, month, day } = getBogotaDateParts();

    const currentDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(currentDate.getDate() + 1);

    const nextDayYear = tomorrowDate.getFullYear();
    const nextDayMonth = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(tomorrowDate.getDate()).padStart(2, '0');

    const nextMonthStart =
        month === '12'
            ? `${Number(year) + 1}-01-01 00:00:00`
            : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01 00:00:00`;

    return {
        todayStart: `${year}-${month}-${day} 00:00:00`,
        tomorrowStart: `${nextDayYear}-${nextDayMonth}-${nextDay} 00:00:00`,
        monthStart: `${year}-${month}-01 00:00:00`,
        nextMonthStart,
    };
}

// REGISTRAR VENTA
app.post('/api/sales', async (req, res) => {
    try {
        const {
            product,
            saleType,
            description,
            quantity,
            amount,
            paymentMethod
        } = req.body;

        if (!saleType || !description || !amount || !paymentMethod) {
            return res.status(400).json({
                message: 'Tipo de venta, descripción, monto y medio de pago son obligatorios',
            });
        }

        const numericAmount = Number(amount);
        const numericQuantity =
            quantity === null || quantity === undefined || quantity === ''
                ? null
                : Number(quantity);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: 'El monto debe ser mayor a 0',
            });
        }

        if (
            numericQuantity !== null &&
            (!Number.isInteger(numericQuantity) || numericQuantity <= 0)
        ) {
            return res.status(400).json({
                message: 'La cantidad debe ser un número entero mayor a 0',
            });
        }

        const createdAt = getBogotaDateTime();

        const [result] = await db.execute(
            `INSERT INTO ventas 
             (producto, tipo_venta, descripcion, cantidad, monto, medio_pago, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                product || null,
                saleType,
                description,
                numericQuantity,
                numericAmount,
                paymentMethod,
                createdAt,
            ]
        );

        res.status(201).json({
            message: 'Venta registrada correctamente',
            id: result.insertId,
        });

    } catch (err) {
        console.error('ERROR REGISTRAR VENTA:', err);
        res.status(500).json({ message: err.message });
    }
});

// REGISTRAR GASTO
app.post('/api/expenses', async (req, res) => {
    try {
        const {
            product,
            description,
            category,
            quantity,
            amount
        } = req.body;

        if (!description || !category || !amount) {
            return res.status(400).json({
                message: 'Descripción, categoría y monto son obligatorios',
            });
        }

        const normalizedCategory = category.trim().toLowerCase();
        const isInventoryExpense = normalizedCategory === 'inventario';

        const numericAmount = Number(amount);
        const numericQuantity =
            quantity === null || quantity === undefined || quantity === ''
                ? null
                : Number(quantity);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: 'El monto debe ser mayor a 0',
            });
        }

        if (isInventoryExpense && numericQuantity === null) {
            return res.status(400).json({
                message: 'La cantidad es obligatoria para gastos de inventario',
            });
        }

        if (
            numericQuantity !== null &&
            (!Number.isInteger(numericQuantity) || numericQuantity <= 0)
        ) {
            return res.status(400).json({
                message: 'La cantidad debe ser un número entero mayor a 0',
            });
        }

        const unitAmount = isInventoryExpense ? numericAmount : null;
        const totalAmount = isInventoryExpense
            ? numericAmount * numericQuantity
            : numericAmount;

        const finalQuantity = isInventoryExpense ? numericQuantity : null;
        const createdAt = getBogotaDateTime();

        const [result] = await db.execute(
            `INSERT INTO gastos 
             (producto, descripcion, categoria, cantidad, valor_unitario, monto, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                product || null,
                description,
                category,
                finalQuantity,
                unitAmount,
                totalAmount,
                createdAt,
            ]
        );

        res.status(201).json({
            message: 'Gasto registrado correctamente',
            id: result.insertId,
            totalAmount,
            unitAmount,
            quantity: finalQuantity,
        });

    } catch (err) {
        console.error('ERROR REGISTRAR GASTO:', err);
        res.status(500).json({ message: err.message });
    }
});

// REGISTRAR TRANSACCIÓN CORRESPONSAL
app.post('/api/corresponsal', async (req, res) => {
    try {
        const {
            transactionType,
            entity,
            amount,
            commission
        } = req.body;

        if (!transactionType || !entity || !amount) {
            return res.status(400).json({
                message: 'Tipo de transacción, entidad y monto son obligatorios',
            });
        }

        const numericAmount = Number(amount);
        const numericCommission =
            commission === null || commission === undefined || commission === ''
                ? 0
                : Number(commission);

        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: 'El monto debe ser mayor a 0',
            });
        }

        if (Number.isNaN(numericCommission) || numericCommission < 0) {
            return res.status(400).json({
                message: 'La comisión no puede ser negativa',
            });
        }

        const createdAt = getBogotaDateTime();

        const [result] = await db.execute(
            `INSERT INTO corresponsal 
            (tipo_transaccion, entidad, monto, comision_ganada, created_at)
            VALUES (?, ?, ?, ?, ?)`,
            [
                transactionType,
                entity,
                numericAmount,
                numericCommission,
                createdAt,
            ]
        );

        res.status(201).json({
            message: 'Transacción registrada correctamente',
            id: result.insertId,
        });

    } catch (err) {
        console.error('ERROR REGISTRAR CORRESPONSAL:', err);
        res.status(500).json({ message: err.message });
    }
});

// LISTAR PRODUCTOS DE INVENTARIO
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                id,
                nombre,
                categoria,
                precio_venta,
                costo,
                stock,
                stock_minimo,
                created_at
             FROM inventario
             ORDER BY created_at DESC`
        );

        res.json(
            rows.map(row => ({
                id: row.id,
                name: row.nombre,
                category: row.categoria,
                salePrice: Number(row.precio_venta),
                cost: Number(row.costo),
                stock: Number(row.stock),
                minStock: Number(row.stock_minimo),
                createdAt: row.created_at,
            }))
        );
    } catch (err) {
        console.error('ERROR LISTAR INVENTARIO:', err);
        res.status(500).json({ message: err.message });
    }
});

// REGISTRAR PRODUCTO EN INVENTARIO
app.post('/api/products', async (req, res) => {
    try {
        const {
            id,
            name,
            category,
            salePrice,
            cost,
            stock,
            minStock
        } = req.body;

        if (!id || !name || !category || salePrice === undefined || cost === undefined || stock === undefined || minStock === undefined) {
            return res.status(400).json({
                message: 'Todos los campos son obligatorios',
            });
        }

        const numericSalePrice = Number(salePrice);
        const numericCost = Number(cost);
        const numericStock = Number(stock);
        const numericMinStock = Number(minStock);

        if (Number.isNaN(numericSalePrice) || numericSalePrice < 0) {
            return res.status(400).json({ message: 'El precio de venta no es válido' });
        }

        if (Number.isNaN(numericCost) || numericCost < 0) {
            return res.status(400).json({ message: 'El costo no es válido' });
        }

        if (!Number.isInteger(numericStock) || numericStock < 0) {
            return res.status(400).json({ message: 'El stock debe ser un entero mayor o igual a 0' });
        }

        if (!Number.isInteger(numericMinStock) || numericMinStock < 0) {
            return res.status(400).json({ message: 'El stock mínimo debe ser un entero mayor o igual a 0' });
        }

        const [existing] = await db.execute(
            'SELECT id FROM inventario WHERE id = ? LIMIT 1',
            [id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: 'Ya existe un producto con ese ID',
            });
        }

        const createdAt = getBogotaDateTime();

        await db.execute(
            `INSERT INTO inventario
             (id, nombre, categoria, precio_venta, costo, stock, stock_minimo, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                name,
                category,
                numericSalePrice,
                numericCost,
                numericStock,
                numericMinStock,
                createdAt,
            ]
        );

        res.status(201).json({
            message: 'Producto registrado correctamente',
            id,
        });
    } catch (err) {
        console.error('ERROR REGISTRAR PRODUCTO:', err);
        res.status(500).json({ message: err.message });
    }
});

// EDITAR PRODUCTO DE INVENTARIO
app.put('/api/products', async (req, res) => {
    try {
        const {
            id,
            name,
            category,
            salePrice,
            cost,
            stock,
            minStock
        } = req.body;

        if (!id || !name || !category || salePrice === undefined || cost === undefined || stock === undefined || minStock === undefined) {
            return res.status(400).json({
                message: 'Todos los campos son obligatorios',
            });
        }

        const numericSalePrice = Number(salePrice);
        const numericCost = Number(cost);
        const numericStock = Number(stock);
        const numericMinStock = Number(minStock);

        if (Number.isNaN(numericSalePrice) || numericSalePrice < 0) {
            return res.status(400).json({ message: 'El precio de venta no es válido' });
        }

        if (Number.isNaN(numericCost) || numericCost < 0) {
            return res.status(400).json({ message: 'El costo no es válido' });
        }

        if (!Number.isInteger(numericStock) || numericStock < 0) {
            return res.status(400).json({ message: 'El stock debe ser un entero mayor o igual a 0' });
        }

        if (!Number.isInteger(numericMinStock) || numericMinStock < 0) {
            return res.status(400).json({ message: 'El stock mínimo debe ser un entero mayor o igual a 0' });
        }

        const [result] = await db.execute(
            `UPDATE inventario
             SET nombre = ?, categoria = ?, precio_venta = ?, costo = ?, stock = ?, stock_minimo = ?
             WHERE id = ?`,
            [
                name,
                category,
                numericSalePrice,
                numericCost,
                numericStock,
                numericMinStock,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado',
            });
        }

        res.json({
            message: 'Producto actualizado correctamente',
            id,
        });
    } catch (err) {
        console.error('ERROR ACTUALIZAR PRODUCTO:', err);
        res.status(500).json({ message: err.message });
    }
});

// ELIMINAR PRODUCTO DE INVENTARIO
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM inventario WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado',
            });
        }

        res.json({
            message: 'Producto eliminado correctamente',
            id,
        });
    } catch (err) {
        console.error('ERROR ELIMINAR PRODUCTO:', err);
        res.status(500).json({ message: err.message });
    }
});


// RESUMEN DASHBOARD
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const { todayStart, tomorrowStart, monthStart, nextMonthStart } = getDashboardRanges();

        // Ventas del día
        const [[salesDayRow]] = await db.execute(
            `SELECT COALESCE(SUM(monto), 0) AS total
             FROM ventas
             WHERE created_at >= ? AND created_at < ?`,
            [todayStart, tomorrowStart]
        );

        // Comisión corresponsal del día
        const [[commissionDayRow]] = await db.execute(
            `SELECT COALESCE(SUM(comision_ganada), 0) AS total
             FROM corresponsal
             WHERE created_at >= ? AND created_at < ?`,
            [todayStart, tomorrowStart]
        );

        // Gastos del día
        const [[expensesDayRow]] = await db.execute(
            `SELECT COALESCE(SUM(monto), 0) AS total
             FROM gastos
             WHERE created_at >= ? AND created_at < ?`,
            [todayStart, tomorrowStart]
        );

        // Ventas del mes
        const [[monthSalesRow]] = await db.execute(
            `SELECT COALESCE(SUM(monto), 0) AS total
             FROM ventas
             WHERE created_at >= ? AND created_at < ?`,
            [monthStart, nextMonthStart]
        );

        // Comisión corresponsal del mes
        const [[monthCommissionRow]] = await db.execute(
            `SELECT COALESCE(SUM(comision_ganada), 0) AS total
             FROM corresponsal
             WHERE created_at >= ? AND created_at < ?`,
            [monthStart, nextMonthStart]
        );

        // Gastos del mes
        const [[monthExpensesRow]] = await db.execute(
            `SELECT COALESCE(SUM(monto), 0) AS total
             FROM gastos
             WHERE created_at >= ? AND created_at < ?`,
            [monthStart, nextMonthStart]
        );

        // Top 5 productos vendidos del mes
        const [topProductsRows] = await db.execute(
            `SELECT 
                COALESCE(NULLIF(producto, ''), descripcion) AS name,
                COALESCE(SUM(COALESCE(cantidad, 1)), 0) AS units,
                COALESCE(SUM(monto), 0) AS income
             FROM ventas
             WHERE created_at >= ? AND created_at < ?
             GROUP BY COALESCE(NULLIF(producto, ''), descripcion)
             ORDER BY income DESC
             LIMIT 5`,
            [monthStart, nextMonthStart]
        );

        // Ventas por tipo del mes
        const [salesByTypeRows] = await db.execute(
            `SELECT 
                tipo_venta AS label,
                COALESCE(SUM(monto), 0) AS value
             FROM ventas
             WHERE created_at >= ? AND created_at < ?
             GROUP BY tipo_venta
             ORDER BY value DESC`,
            [monthStart, nextMonthStart]
        );

        const salesDay = Number(salesDayRow.total);
        const commissionDay = Number(commissionDayRow.total);
        const expensesDay = Number(expensesDayRow.total);

        const monthSales = Number(monthSalesRow.total);
        const monthCommission = Number(monthCommissionRow.total);
        const monthExpenses = Number(monthExpensesRow.total);

        const dayIncome = salesDay + commissionDay;
        const monthIncome = monthSales + monthCommission;
        const netProfit = monthIncome - monthExpenses;

        res.json({
            alert: {
                count: 0,
                product: '',
            },
            cards: {
                salesDay: dayIncome,
                expensesDay,
                netProfit,
                monthTotal: monthIncome,
            },
            topProducts: topProductsRows.map(row => ({
                name: row.name,
                units: Number(row.units),
                income: Number(row.income),
            })),
            salesByType: salesByTypeRows.map(row => ({
                label: row.label,
                value: Number(row.value),
            })),
        });

    } catch (err) {
        console.error('ERROR DASHBOARD SUMMARY:', err);
        res.status(500).json({ message: err.message });
    }
});

// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});