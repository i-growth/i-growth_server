import pool from "../resource/db_connection.js";

export const OfficerLogin = async(req, res, next) => {
    const {nic, password} = req.body;
    if(!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try{
        const [rows] = await pool.query('SELECT officer_id, email, area_id, nic FROM medical_officer WHERE nic = ? AND password = ? LIMIT 1', [nic, password]);
        console.log(rows);
        try{
            if(rows.length > 0) {
                req.session.officer = {officer_id: rows[0], area_id: rows[0].area_id };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.officer.officer_id
                })
            }
            else {
                return res.status(401).json({
                    message: 'Login failed'
                })
            }
        }
        catch(err) {
            return res.status(500).json({
                message: err.message
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const Logout = async(req, res, next) => {
    req.session.destroy();
    return res.status(200).json({
        message: 'Logged out'
    })
}

export const AddNews = async(req, res, next) => {
    const { title, summary, description } = req.body;

    const author = `{"id":${req.session.officer.officer_id.officer_id},"role":"officer"}`
    
    const image = req.file.filename;

    if(!title || !summary || !description || !image || !author) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }
    
    try{
        const [rows] = await pool.query('INSERT INTO news_feed (title, summary, description, image, author) VALUES (?, ?, ?, ?, ?)', [title, summary, description, image, author]);
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'News added'
            })
        }
        else {
            return res.status(500).json({
                message: 'News adding failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetNews = async(req, res, next) => {
    try{
        const [rows] = await pool.query('SELECT * FROM news_feed');
        return res.status(200).json(rows)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetNewsByID = async(req, res, next) => {
    const { id } = req.params;
    try{
        const [rows] = await pool.query('SELECT * FROM news_feed WHERE news_id = ? LIMIT 1', [id]);
        return res.status(200).json(rows[0])
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const DeleteNews = async(req, res, next) => {
    const { id } = req.params;
    try{
        const [rows] = await pool.query('DELETE FROM news_feed WHERE news_id = ?', [id]);
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'News deleted'
            })
        }
        else {
            return res.status(500).json({
                message: 'News deleting failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetOfficerProfile = async(req, res, next) => {
    const officer_id = req.session.officer.officer_id.officer_id;

    try{
        let [rows] = await pool.query('SELECT medical_officer.*, area.area_name FROM medical_officer inner join area on medical_officer.area_id = area.area_id WHERE medical_officer.officer_id = ? LIMIT 1', [officer_id]);
        rows.forEach(row => {
            delete row.password;
        })
        return res.status(200).json(rows[0])
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}