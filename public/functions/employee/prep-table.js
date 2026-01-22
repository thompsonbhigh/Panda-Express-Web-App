module.exports = (pool) => {
    async function lowItems() {
        const query = `
            SELECT * from kitchen;
        `;
        
        try {
        const res = await pool.query(query);
        return res.rows;
        } catch (err) {
            console.error("Error generating prep table:", err.message);
            return [];
        }
    }
    return { lowItems };
    
};
