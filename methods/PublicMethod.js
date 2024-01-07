import pool from "../resource/db_connection.js";

export const GetAllAreas = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM area');
        return res.status(200).json(rows)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetAreaByID = async (req, res, next) => {
    const {id} = req.params;
    if(!id) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try {
        const [rows] = await pool.query('SELECT * FROM area WHERE area_id = ? LIMIT 1', [id]);
        if(rows.length > 0) {
            const data = rows[0]
            return res.status(200).send(data)
        }
        else {
            return res.status(404).json({
                message: 'Area not found'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}