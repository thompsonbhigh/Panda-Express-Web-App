/**
 * @fileoverview Employee management route for manager operations.
 * Handles employee records including viewing, adding,
 * updating employee details (salary, hours, position, status), and removing employees.
 * @module routes/managerRoute/employees
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');  

/**
 * GET /manager/employees
 * Retrieves and displays all employee records ordered by employee_id.
 * 
 * @name GetEmployees
 * @route {GET} /manager/employees
 * @returns {View} Renders the employees management view with all employee records
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM employees ORDER BY employee_id");
        res.render('manager_views/employees', { employees: result.rows});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading Employees"); 

    }
});

/**
 * POST /manager/employees/update
 * Updates an existing employee's information including salary, hours worked,
 * position, and employment status.
 * 
 * @name UpdateEmployee
 * @route {POST} /manager/employees/update
 * @bodyparam {number} employee_id - The ID of the employee to update
 * @bodyparam {number} salary - The employee's salary
 * @bodyparam {number} hours_worked - Total hours worked by the employee
 * @bodyparam {string} position - The employee's job position/title
 * @bodyparam {string} employement_status - The employment status
 * @returns {Redirect} Redirects to /manager/employees on success
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{employee_id, salary, hours_worked, position, employement_status} = req.body;

    try{
        await db.query(
            "UPDATE employees SET salary = $1, hours_worked = $2, position = $3, employement_status = $4 WHERE employee_id = $5", 
            [salary, hours_worked, position, employement_status, employee_id]
        );
        res.redirect('/manager/employees');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/employee?error=Error updating employee')

    }
}); 

/**
 * POST /manager/employees/add
 * Adds a new employee to the system.
 * If employee_id is not provided, automatically generates the next available ID.
 * 
 * @name AddEmployee
 * @route {POST} /manager/employees/add
 * @bodyparam {number} [employee_id] - Optional ID for the new employee
 * @bodyparam {string} employee_name - The name of the employee
 * @bodyparam {number} salary - The employee's salary
 * @bodyparam {number} hours_worked - Initial hours worked
 * @bodyparam {string} position - The employee's job position/title
 * @bodyparam {string} employement_status - The employment status
 * @returns {Redirect} Redirects to /manager/employees on success
 * @throws {Error} Redirects with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    let{employee_id, employee_name, salary, hours_worked, position, employement_status} = req.body;

    try{
        if(!employee_id || employee_id.trim() === ''){
            const maxIdResult = await db.query(
                "SELECT COALESCE(MAX(employee_id), 0) + 1 AS next_id FROM employees"
            );
            employee_id = maxIdResult.rows[0].next_id;
        }

        await db.query(
            "INSERT INTO employees (employee_id, employee_name, salary, hours_worked, position, employement_status) VALUES ($1, $2, $3, $4, $5, $6)", 
            [employee_id, employee_name, salary, hours_worked, position, employement_status]
        );
        res.redirect('/manager/employees');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/employee?error=Error adding employee')

    }
});

/**
 * POST /manager/employees/delete
 * Removes an employee record from the database by employee_id.
 * 
 * @name DeleteEmployee
 * @route {POST} /manager/employees/delete
 * @bodyparam {number} employee_id - The ID of the employee to delete
 * @returns {Redirect} Redirects to /manager/employees on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ employee_id } = req.body;

    try{
        await db.query(
            "DELETE FROM employees WHERE employee_id = $1", 
            [employee_id]
        );
        res.redirect('/manager/employees');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/employees?error=Error deleting employee')

    }
});

module.exports = router;