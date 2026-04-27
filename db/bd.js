const mysql = require('mysql2');

// En lugar de mysql.createConnection, usamos mysql.createPool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', // Cambia esto si tu usuario de XAMPP/MySQL es diferente
    password: '', // Cambia esto si tienes contraseña en tu MySQL local
    database: 'mynotes_db',
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexiones simultáneas
    queueLimit: 0
});

// Comprobamos la conexión inicial para saber que todo está bien
db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('La conexión a la base de datos fue cerrada.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('La base de datos tiene demasiadas conexiones.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('La conexión a la base de datos fue rechazada.');
        }
    }
    if (connection) {
        console.log('Conexión exitosa a MySQL (Pool)');
        connection.release(); // Liberamos la conexión de vuelta al pool
    }
    return;
});

// Exportamos el pool para que index.js lo use exactamente igual que antes con db.query()
module.exports = db;