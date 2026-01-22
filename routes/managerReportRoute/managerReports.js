/**
 * @fileoverview Manager reports routing hub that handles navigation between different reports.
 * @module routes/managerReportRoute/managerReports
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

const salesReportRouter = require('./salesReport');
const XandZReportRouter = require('./XandZReport');
const restockReportRouter = require('./restockReport');
const productusageReportRouter = require('./productUsageReport');
/**
 * GET /manager/managerReports
 * Renders the main manager reports dashboard view.
 * Provides navigation to reports for managers
 * 
 * @name GetManagerReportsDashboard
 * @route {GET} /manager/managerReports
 * @returns {View} Renders the managerReports template with report navigation options
 */
router.get('/', async (req, res) => {
    res.render('manager_reports/managerReports');
});

router.use('/salesReport', salesReportRouter);
router.use('/xAndzReport', XandZReportRouter);
router.use('/restock', restockReportRouter);
router.use('/productUsageReport', productusageReportRouter);


module.exports = router;