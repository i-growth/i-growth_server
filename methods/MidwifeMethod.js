import pool from "../resource/db_connection.js";
import { transporter } from "../resource/email.js";
import GeneratePassword from "../resource/password_genarate.js";

export const MidwifeLogin = async(req, res, next) => {
    const {nic, password} = req.body;
    if(!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try{
        const [rows] = await pool.query('SELECT midwife_id, area_id, email, nic FROM midwife WHERE nic = ? AND password = ? LIMIT 1', [nic, password]);
        
        try{
            if(rows.length > 0) {
                req.session.midwife = {midwife_id: rows[0] };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.midwife.midwife_id
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

export const MidwifeLogout = async(req, res, next) => {
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

export const CreateParent = async(req, res, next) => {
    const { guardian_nic, mother_name, father_name, phone, email, address, area_id, guardian_name } = req.body;

    const password = GeneratePassword;
    
    if(!guardian_nic || !mother_name || !father_name || !phone || !email || !address || !area_id || !guardian_name) {
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ['guardian_nic', 'mother_name', 'father_name', 'phone', 'email', 'address', 'area_id', 'password', 'guardian_name']
        })
    }

    if(area_id != req.session.midwife.midwife_id.area_id){
        return res.status(401).json({
            message: 'Not privileges'
        })
    }

    try{
        const [rows] = await pool.query('INSERT INTO parent (guardian_nic, mother_name, father_name, phone, email, address, area_id, password, guardian_name, created_midwife) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [guardian_nic.toLowerCase(), mother_name, father_name, phone, email, address, area_id, password, guardian_name, req.session.midwife.midwife_id.midwife_id]);
        
        if(rows.affectedRows > 0) {
            // send email
            try{
                await transporter.sendMail({
                    from: "I-GROWTH <uc.chamod.public@gmail.com>",
                    to: `${email}`,
                    subject: "Your account have been created",
                    html: `
                        <h1>Your account have been created</h1>
                        <p>Username: ${guardian_nic}</p>
                        <p>Password: ${password}</p>
                        <p>Click <a href="http://localhost:3000/parent/login">here</a> to login</p>
                    `
                }); 
                
                res.status(200).json({message: 'Parent created'})
            }
            catch(err){
                console.log(err);
                return res.status(500).json({
                    message: "Can't send username and password to parent"
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

export const getAllParents = async(req, res, next) => {
    try{
        const [rows] = await pool.query('SELECT * FROM parent');
        const parents = rows.map((row) => {
            const { password, ...parent } = row;
            return parent;
        })
        return res.status(200).json(parents)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetParentByID = async(req, res, next) => {
    const {guardian_nic} = req.params;
    try{
        const [rows] = await pool.query('SELECT * FROM parent WHERE guardian_nic = ?', [guardian_nic]);
        if(rows.length < 1) return res.status(404).json({message: 'Parent not found'})
        const {password, ...rest} = rows[0];
        return res.status(200).json(rest)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const AddChild = async(req, res, next) => {
    const { child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic } = req.body;

    if(!child_name || !child_gender || !child_birthday || !child_birth_certificate_no || !child_born_weight || !gardian_nic){
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ["child_name", "child_gender", "child_birthday", "child_birth_certificate_no", "child_born_weight", "gardian_nic"]
        })
    }

    try{
        const [rows] = await pool.query('INSERT INTO child (child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic) VALUES (?, ?, ?, ?, ?, ?)', [child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic.toLowerCase()]);

        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Child added'
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

export const AddChildGrowthDetail = async(req, res, next) => {
    const { child_id } = req.params;

    const { weight, height, month, head_cricumference } = req.body;

    if(!weight || !height || !month || !head_cricumference){
        return res.status(400).json({
            message: 'Please fill all fields',
            fields: ["weight", "height", "month", "head_cricumference"],
        })
    }

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    const bmi = (parseFloat(weight) / (parseFloat(height/100) * parseFloat(height/100))).toFixed(3);

    try{
        const [rows] = await pool.query('INSERT INTO growth_detail (child_id, weight, height, month, head_cricumference, bmi) VALUES (?, ?, ?, ?, ?, ?)', [child_id, weight, height, month, head_cricumference, bmi]);

        if(rows.affectedRows > 0) {
            return res.status(200).json({
                message: 'Child growth detail added'
            })
        }
        else {
            return res.status(500).json({
                message: 'Child growth detail adding failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetChildGrowthDetailByID = async(req, res, next) => {
    const { child_id } = req.params;

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try{
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ?', [child_id]);

        if(rows.length < 1) return res.status(404).json({message: 'Child growth detail not found'})

        return res.status(200).json(rows)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }

}

export const GetLastChildGrowthDetail = async(req, res, next) => {
    const { child_id } = req.params;

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try{
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ? ORDER BY month DESC LIMIT 1', [child_id]);

        if(rows.length < 1) return res.status(404).json({message: 'Child growth detail not found'})

        return res.status(200).json(rows[0])
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}