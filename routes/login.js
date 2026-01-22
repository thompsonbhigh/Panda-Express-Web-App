const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fhvqvqhvc&#&@78383busbd';

const users = [
    {
        id: 1,
        username: 'customer',
        password: 'customerpassword',
        role: 'customer'
    },
    {
        id: 2,
        username: 'admin',
        password: 'adminpassword',
        role: 'admin'
    }
];

/**
 * Authentication function to be used when routing
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const authJWT = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.redirect('login');;
    }
};

/**
 * GET /login
 * Renders the login screen
 * 
 * @name GetLoginScreen
 * @route {GET} /login
 * @returns {View} Renders the login screen
 */
router.get('/', (req, res) => {
    res.render('login');
});

/**
 * POST /login
 * Accepts login information
 * 
 * @name PostLoginInfo
 * @route {POST} /login
 * @returns {View} Redirects to nav page or customer based on login
 */
router.post('/', (req, res) => {
    const username = req.body.uname;
    const password = req.body.psw;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.redirect('/login');
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {httpOnly: true});

    if (user.role == 'customer') {
        res.redirect('/customer');
    } else {
        res.redirect('/');
    }
});

module.exports = {
    login: router, 
    auth: authJWT
};