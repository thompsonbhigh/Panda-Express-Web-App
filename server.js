/**
 * @fileoverview Server file that connects all routes
 */

const express  = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');   
const bodyParser = require('body-parser');   
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());
const session = require('express-session');
app.use(session({
    secret: 'kiosk_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const customer = require('./routes/customer'),
      kitchen = require('./routes/kitchen'),
      menu_board = require('./routes/menu-board'),
      manager = require('./routes/manager'),
      newCashier = require('./routes/newCashier'),
      prepTable = require('./routes/prep-table'),
      { login, auth } = require('./routes/login');
const { render } = require('ejs');
const { userInfo } = require('os');


app
app.use('/login', login);
app.use('/prep-table', prepTable);
app.use('/customer', customer);
app.use('/kitchen', kitchen);
app.use('/newCashier', newCashier);
app.use('/menu-board', menu_board);
app.use('/manager', manager);

app.get('/', auth, (req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    res.render('nav');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});