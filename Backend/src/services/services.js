const db = require('../database/db.js');

async function getCourses(filters){
    let sql = "SELECT * FROM courses";
    const params = [];

    if(filters.language){
        sql += "AND language = ?";
        params.push(filters.language);
    }

    if (filters.level) {
    sql += " AND level = ?";
    params.push(filters.level);
    }

    if (filters.source) {
        sql += " AND source_name = ?";
        params.push(filters.source);
    }

    if (filters.category) {
        sql += " AND category = ?";
        params.push(filters.category);
    }

    if (filters.search) {
        sql += " AND (title LIKE ? OR keywords LIKE ?)";
        params.push(`%${filters.search}%`);
        params.push(`%${filters.search}%`);
    }

    const [rows] = await db.query(sql, params);
    return rows;
}

async function getCourseById(id){
    const [row] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
    return row;
}

module.exports = {
    getCourses,
    getCourseById
};