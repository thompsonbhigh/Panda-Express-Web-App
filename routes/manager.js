/**
 * @fileoverview Manager route to handle traversal of manager tabs and routes 
 * @module routes/manager
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

const inventoryRouter = require('./managerRoute/inventory');
const menuRouter = require('./managerRoute/menu');
const employeesRouter = require('./managerRoute/employees');
const recipesRouter = require('./managerRoute/recipes');
const pricingRouter = require('./managerRoute/pricing');
const scheduleRouter = require('./managerRoute/schedule');
const managerReportRouter = require('./managerReportRoute/managerReports');
const { auth } = require('./login');

/**
 * GET /manager
 * Renders the main manager dashboard view.
 * Implements role-based access control:
 * - Redirects customers to the customer portal
 * - Redirects non-admin users to the login page
 * - Only allows admin users to access the manager dashboard
 * 
 * @name GetManagerDashboard
 * @route {GET} /manager
 * @authentication Requires authentication via auth middleware
 * @authorization Requires 'admin' role
 * @returns {Redirect} Redirects to /customer if user role is 'customer'
 * @returns {Redirect} Redirects to /login if user role is not 'admin'
 * @returns {View} Renders the managerView template for admin users
 */
router.get('/', auth, async(req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    if (req.user.role != 'admin') {
        return res.redirect('login');
    }
    res.render('manager_views/managerView'); 
}); 

router.use('/inventory', inventoryRouter);
router.use('/menu', menuRouter);
router.use('/employees', employeesRouter);
router.use('/recipes', recipesRouter);
router.use('/pricing', pricingRouter);
router.use('/schedule', scheduleRouter);
router.use('/managerReports', managerReportRouter);

module.exports = router;