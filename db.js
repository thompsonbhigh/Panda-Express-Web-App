/**
 * @fileoverview Database connection route
 */

const dotenv = require('dotenv').config();
const { Pool } =  require('pg');

const pool = new Pool({
    user: DBUSER,
    host: DBHOST,
    database: DBNAME,
    password: DBPSWD,
    port: 5432,
    ssl: {rejectUnauthorized: false },
});

pool.connect()
    .then(client =>{
        console.log('Connected to PostgreSQL database');
        client.release();
    })
    .catch(err => console.error('Connection error', err.stack));


process.on('SIGINT', async () => {
    await pool.end();
    console.log('Database connection closed');
    process.exit(0);
});
module.exports = pool;