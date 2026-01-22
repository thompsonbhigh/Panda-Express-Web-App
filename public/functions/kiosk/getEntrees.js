/**
 * Module that initializes database access functions for retrieving menu items.
 * @param {Object} pool - The database connection pool used to execute queries.
 * @returns {Object} An object containing the getEntreeNames function.
 */
module.exports = (pool) => {
    /**
     * Retrieves all menu items from the 'menuitem' table, ordered by category in descending order.
     * Catches and logs database errors, returning an empty array on failure.
     * @async
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of menu item objects, or an empty array if an error occurs.
     */
    async function getEntreeNames() {
        const query = `
            SELECT * from menuitem
            order by category DESC;
        `;
        
        try {
        const res = await pool.query(query);
        return res.rows;
        } catch (err) {
            console.error("Error generating menu:", err.message);
            return [];
        }
    }

    return { getEntreeNames };
};