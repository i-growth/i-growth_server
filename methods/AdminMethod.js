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

    // send email
    try{
        await transporter.sendMail({
            from: "I-GROWTH <uc.chamod.public@gmail.com>",
            to: `${email}`,
            subject: "Your account have been created",
            html: `
                <h1>Your account have been created</h1>
                <p>Username: ${nic}</p>
                <p>Password: ${password}</p>
                <p>Click <a href="http://localhost:3000/midwife/login">here</a> to login</p>
            `
        });   
    }
    catch(err){
        return res.status(500).json({
            message: "Can't send username and password to midwife"
        })
    }

    try{
        const [rows] = await pool.query('INSERT INTO midwife (name, service_start_date, nic, email, phone, service_id, created_admin_id, area_id, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, service_start_date, nic, email, phone, service_id, req.session.admin.admin_id.id, area_id, password]);
        
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Midwife created'
            })
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

export const CreateOfficer = async(req, res, next) => {
    const { officer_name, service_start_date, nic, email, phone, service_id, area_id } = req.body;
    
    if(!officer_name || !service_start_date || !nic || !email || !phone || !service_id || !area_id) {
        return res.status(400).json({
            message: 'All fields are required'
        })
    }

    const password = GeneratePassword;

    // send email
    try{
        await transporter.sendMail({
            from: "I-GROWTH <uc.chamod.public@gmail.com>",
            to: `${email}`,
            subject: "Your account have been created",
            html: `
                <h1>Your account have been created</h1>
                <p>Username: ${nic}</p>
                <p>Password: ${password}</p>
                <p>Click <a href="http://localhost:3000/officer/login">here</a> to login</p>
            `
        });   
    }
    catch(err){
        return res.status(500).json({
            message: "Can't send username and password to midwife"
        })
    }

    try{
        const [rows] = await pool.query('INSERT INTO medical_officer (officer_name, service_start_date, nic, email, phone, service_id, created_admin_id, area_id, password) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)', [officer_name, service_start_date, nic, email, phone, service_id, req.session.admin.admin_id.id, area_id, password]);
        
        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Officer created'
            })
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