/**
 * @fileoverview Schedule management route for manager operations.
 * Handles employee scheduling including viewing schedules,
 * adding shifts, updating shift assignments, and removing schedule entries.
 * Schedule entries are uniquely identified by the combination of date and employee ID.
 * @module routes/managerRoute/schedule
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');  

/**
 * GET /manager/schedule
 * Retrieves and displays all schedule entries ordered by schedule date.
 * 
 * @name GetSchedule
 * @route {GET} /manager/schedule
 * @returns {View} Renders the schedule management view with all schedule entries
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM schedule ORDER BY scheduledate;");
        res.render('manager_views/schedule', { schedule: result.rows});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading Schedule"); 

    }
});

/**
 * POST /manager/schedule/update
 * Updates an existing schedule entry's shift time and position.
 * The schedule entry is identified by the combination of employee ID and date.
 * 
 * @name UpdateSchedule
 * @route {POST} /manager/schedule/update
 * @bodyparam {string} scheduledate - The date of the schedule entry
 * @bodyparam {string} shift - The shift time 
 * @bodyparam {string} position - The position/role for this shift 
 * @bodyparam {number} employeeid - The ID of the employee assigned to this shift
 * @returns {Redirect} Redirects to /manager/schedule on success
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{scheduledate, shift, position, employeeid} = req.body;

    try{
        await db.query(
            "UPDATE schedule SET shift = $1, position = $2 WHERE employeeid = $3 AND scheduledate = $4", 
            [shift, position, employeeid, scheduledate]
        );
        res.redirect('/manager/schedule');
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error updating schedule");

    }
}); 

/**
 * POST /manager/schedule/add
 * Adds a new schedule entry assigning an employee to a shift on a specific date.
 * The combination of employee ID and date must be unique.
 * 
 * @name AddScheduleEntry
 * @route {POST} /manager/schedule/add
 * @bodyparam {number} employeeid - The ID of the employee to schedule
 * @bodyparam {string} shift - The shift time 
 * @bodyparam {string} position - The position/role for this shift 
 * @bodyparam {string} scheduledate - The date for this schedule entry 
 * @returns {Redirect} Redirects to /manager/schedule on success
 * @throws {Error} Returns 500 status with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    let{employeeid, shift, position, scheduledate} = req.body;
    
    try{
        await db.query(
            "INSERT INTO schedule (scheduledate, shift, position, employeeid) VALUES ($1, $2, $3, $4)", 
            [scheduledate, shift, position, employeeid]
        );
        res.redirect('/manager/schedule');
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error adding schedule item");

    }
});

/**
 * POST /manager/schedule/delete
 * Removes a schedule entry from the database.
 * The entry is identified by the unique combination of date and employee ID.
 * 
 * @name DeleteScheduleEntry
 * @route {POST} /manager/schedule/delete
 * @bodyparam {string} scheduledate - The date of the schedule entry to delete (YYYY-MM-DD format)
 * @bodyparam {number} employeeid - The ID of the employee whose schedule entry should be deleted
 * @returns {Redirect} Redirects to /manager/schedule on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ scheduledate, employeeid } = req.body;

    try{
        await db.query(
            "DELETE FROM schedule WHERE scheduledate = $1 AND employeeid = $2", 
            [scheduledate, employeeid]
        );
        res.redirect('/manager/schedule');
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error deleting schedule");

    }
});

module.exports = router;