/**
 * Module that initializes database access functions for menu pricing.
 * @param {Object} pool - The database connection pool used to execute queries.
 * @returns {Object} An object containing the getPrice function.
 */
module.exports = (pool) => {
    /**
     * Retrieves all menu price records from the 'menuprice' table.
     * Catches and logs database errors, returning an empty array on failure.
     * @async
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of price row objects, or an empty array if an error occurs.
     */
    async function getPrice() {
        const query = `
            SELECT * from menuprice;
        `;
        
        try {
        const res = await pool.query(query);
        return res.rows;
        } catch (err) {
            console.error("Error retrieving prices:", err.message);
            return [];
        }
    }

    return { getPrice };
};