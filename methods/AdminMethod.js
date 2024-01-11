import pool from "../resource/db_connection.js";
import { transporter } from "../resource/email.js";
import GeneratePassword from "../resource/password_genarate.js";

export const AdminLogin = async(req, res, next) => {
    const { username, password } = req.body;

    if(!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        })
    }

    try{
        const [rows] = await pool.query('SELECT id, Username FROM admin WHERE Username = ? AND password = ? LIMIT 1', [username, password]);
        
        try{
            if(rows.length > 0) {
                req.session.admin = {admin_id: rows[0]};
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.admin.admin_id
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

export const AdminLogout = async(req, res, next) => {
    try{
        req.session.destroy();
        return res.status(200).json({
            message: 'Logout success'
        })
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const CheckAdminAuth = async(req, res, next) => {
    if(req.session.admin) {
        return res.status(200).json({
            message: 'Authorized'
        })
    }
    else {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
}

export const CreateMidwife = async(req, res, next) => {
    const { name, service_start_date, nic, email, phone, service_id, area_id } = req.body;

    if(!name || !service_start_date || !nic || !email || !phone || !service_id || !area_id) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    // generate password
    const password = GeneratePassword;

    try{
        const [rows] = await pool.query('INSERT INTO midwife (name, service_start_date, nic, email, phone, service_id, created_admin_id, area_id, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, service_start_date, nic, email, phone, service_id, req.session.admin.admin_id.id, area_id, password]);
        
        if(rows.affectedRows > 0) {
            // send email
            try{
                await transporter.sendMail({
                    from: "I-GROWTH <uc.chamod.public@gmail.com>",
                    to: `${email}`,
                    subject: "Your Account Has Been Created",
                    html: `<div style="width: 100%; height: auto; box-sizing: border-box;"><div style="max-width: 500px; width: 100%; background-color: rgb(231, 231, 231); margin: 0 auto; padding: 20px 10px; box-sizing: border-box;"><h1 style="margin: 0; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 22px; color: rgb(61, 89, 243); ">I-GROWTH</h1><div><p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px;">Your account has been created. You can access your account using this link <a href="http://localhost:3000/auth">http://localhost:3000/auth</a></p><div style="width: fit-content; background-color: rgb(63, 63, 63); color: #ffffff; padding: 10px;"><code>USERNAME : ${nic}</code><br><code>PASSWORD : ${password}</code></div></div></div></div>`
                });

                res.status(200).json({message: 'Midwife created'})  
            }
            catch(err){
                return res.status(500).json({
                    message: "Can't send username and password to midwife"
                })
            }
        }
        else {
            return res.status(500).json({
                message: 'Midwife creation failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetAllMidwifes = async(req, res, next) => {
    try{
        const [rows] = await pool.query('SELECT midwife.*, area.area_name FROM midwife inner join area on midwife.area_id = area.area_id');
        const rests = rows.map((row) => {
            const { password, ...rest } = row;
            return rest;
        })
        return res.status(200).json(rests)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const GetMidwifeByID = async(req, res, next) => {
    const { id } = req.params;
    try{
        const [rows] = await pool.query('SELECT * FROM midwife WHERE midwife_id = ? LIMIT 1', [id]);
        const rests = rows.map((row) => {
            const { password, ...rest } = row;
            return rest;
        })
        return res.status(200).json(rests)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const UpdateMidwife = async(req, res, next) => {
    const { id } = req.params;
    const { name, phone, service_id} = req.body;

    if(!id){
        return res.status(400).json({
            message: 'Midwife id is required in parms'
        })
    }

    if(!name || !phone || !service_id) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    try{
        const [rows] = await pool.query('UPDATE midwife SET name = ?, phone = ?, service_id = ? WHERE midwife_id = ?', [name, phone, service_id, id]);
        
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Midwife updated'
            })
        }
        else {
            return res.status(500).json({
                message: 'Midwife updating failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const CreateOfficer = async(req, res, next) => {
    const { officer_name, service_start_date, nic, email, phone, service_id, area_id } = req.body;
    
    if(!officer_name || !service_start_date || !nic || !email || !phone || !service_id || !area_id) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    const password = GeneratePassword;

    try{
        const [rows] = await pool.query('INSERT INTO medical_officer (officer_name, service_start_date, nic, email, phone, service_id, created_admin_id, area_id, password) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)', [officer_name, service_start_date, nic, email, phone, service_id, req.session.admin.admin_id.id, area_id, password]);
        
        if(rows.affectedRows > 0) {
            // send email
            try{
                await transporter.sendMail({
                    from: "I-GROWTH <uc.chamod.public@gmail.com>",
                    to: `${email}`,
                    subject: "Your Account Has Been Created",
                    html: `<div style="width: 100%; height: auto; box-sizing: border-box;"><div style="max-width: 500px; width: 100%; background-color: rgb(231, 231, 231); margin: 0 auto; padding: 20px 10px; box-sizing: border-box;"><h1 style="margin: 0; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 22px; color: rgb(61, 89, 243); ">I-GROWTH</h1><div><p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px;">Your account has been created. You can access your account using this link <a href="http://localhost:3000/auth">http://localhost:3000/auth</a></p><div style="width: fit-content; background-color: rgb(63, 63, 63); color: #ffffff; padding: 10px;"><code>USERNAME : ${nic}</code><br><code>PASSWORD : ${password}</code></div></div></div></div>`
                }); 
                
                res.status(200).json({message: 'Officer created'})
            }
            catch(err){
                return res.status(500).json({
                    message: "Can't send username and password to officer"
                })
            }
        }
        else {
            return res.status(500).json({
                message: 'Officer creation failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
    
}

export const UpdateOfficer = async(req, res, next) => {
    const { id } = req.params;
    const { officer_name, phone, service_id, area_id } = req.body;

    if(!id){
        return res.status(400).json({
            message: 'Officer id is required in parms'
        })
    }

    if(!officer_name || !phone || !service_id || !area_id) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    try{
        const [rows] = await pool.query('UPDATE medical_officer SET officer_name = ?, phone = ?, service_id = ?, area_id = ? WHERE officer_id = ?', [officer_name, phone, service_id, area_id, id]);
        
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Officer updated'
            })
        }
        else {
            return res.status(500).json({
                message: 'Officer updating failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const getAllOfficers = async(req, res, next) => {
    try{
        const [rows] = await pool.query('SELECT *, area.area_name FROM medical_officer inner join area on medical_officer.area_id = area.area_id');
        const rests = rows.map((row) => {
            const { password, ...rest } = row;
            return rest;
        })
        return res.status(200).json(rests)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetOfficerByID = async(req, res, next) => {
    const { id } = req.params;
    try{
        const [rows] = await pool.query('SELECT * FROM medical_officer WHERE officer_id = ? LIMIT 1', [id]);
        const rests = rows.map((row) => {
            const { password, ...rest } = row;
            return rest;
        })
        return res.status(200).json(rests)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetOfficerByAreaID = async(req, res, next) => {
    const { id } = req.params;
    try{
        const [rows] = await pool.query('SELECT * FROM medical_officer WHERE area_id = ?', [id]);
        const rests = rows.map((row) => {
            const { password, ...rest } = row;
            return rest;
        })
        return res.status(200).json(rests)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}


// not sure
export const AddNews = async(req, res, next) => {
    const { title, summary, description } = req.body;

    const author = `{"id":${req.session.admin.admin_id.id},"role":"admin"}`

    if(req.file == undefined) {
        return res.status(400).json({
            message: 'Image is required'
        })
    }

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