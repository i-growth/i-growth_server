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
                req.session.midwife = {midwife_id: rows[0], area_id: rows[0].area_id };
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
        const [rows] = await pool.query('INSERT INTO child (child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic, area_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [child_name, child_gender, child_birthday, child_birth_certificate_no, child_born_weight, gardian_nic.toLowerCase(), req.session.midwife.midwife_id.area_id]);

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

const cal_sd = (month) => {
    return {
        plus_3SD: -(0.0174718 * Math.pow(month, 2))  + (0.91498 * month) + 5.11339,
        plus_2SD: -(0.0157843 * Math.pow(month, 2))  + (0.803843 * month) + 4.53092,
        plus_1SD: -(0.0142931 * Math.pow(month, 2))  + (0.719308 * month) + 3.90559,
        median: -(0.013029 * Math.pow(month, 2))  + (0.645037 * month) + 3.46785,
        minus_1SD: -(0.0117718 * Math.pow(month, 2))  + (0.577913 * month) + 2.96326,
        minus_2SD: -(0.0107021 * Math.pow(month, 2))  + (0.523242 * month) + 2.55719,
        minus_3SD: -(0.00420753 * Math.pow(month, 2))  + (0.353832 * month) + 2.0324,
    }
}

export const GetSDMeasurements = async(req, res, next) => {

    const {area_id} = req.session.midwife.midwife_id;
    
    const [rows] = await pool.query('SELECT child.*, TIMESTAMPDIFF(MONTH, child.child_birthday, CURDATE()) AS months_difference, growth_detail.weight FROM child LEFT JOIN growth_detail ON child.child_id = growth_detail.child_id AND growth_detail.month = ( SELECT MAX(month) FROM growth_detail WHERE child_id = child.child_id ) WHERE child.child_birthday >= DATE_SUB(CURDATE(), INTERVAL 60 MONTH) AND child.area_id = ?', [area_id]);
    
    // Create object for save 60 arrays
    var sixtyMonths = {};
    var sixtyMonths_copy = {};

    // Create 60 arrays
    for(var i = 2; i <= 60; i++){
        sixtyMonths[i] = [];
        sixtyMonths_copy[i] = [];
    }

    // Add data to arrays
    rows.forEach(row => {
        sixtyMonths[row.months_difference].push(row);
    })

    // Calculate SD
    Object.keys(sixtyMonths).map((key) => {

        if(sixtyMonths[key].length > 0){

            sixtyMonths[key].forEach((row) => {

                let caled_sd = cal_sd(row.months_difference);
                
                if(row.weight > caled_sd.plus_2SD){
                    sixtyMonths_copy[key].push({
                        // ...row,
                        sd: 'over_weight'
                    })
                }
                else if(row.weight > caled_sd.minus_1SD){
                    sixtyMonths_copy[key].push({
                        // ...row,
                        sd: 'proper_weight'
                    })
                }
                else if(row.weight > caled_sd.minus_2SD){
                    sixtyMonths_copy[key].push({
                        // ...row,
                        sd: 'risk_of_under_weight'
                    })
                }
                else if(row.weight > caled_sd.minus_3SD){
                    sixtyMonths_copy[key].push({
                        // ...row,
                        sd: 'minimum_under_weight'
                    })
                }
                else{
                    sixtyMonths_copy[key].push({
                        // ...row,
                        sd: 'severe_under_weight'
                    })
                }
            })
        }
    })

    

    Object.keys(sixtyMonths_copy).map((key) => {
        
        if(sixtyMonths_copy[key].length > 0){
            sixtyMonths_copy[key].forEach((row) => {
                let sd_count = {
                    over_weight: 0,
                    proper_weight: 0,
                    risk_of_under_weight: 0,
                    minimum_under_weight: 0,
                    severe_under_weight: 0,
                }        

                if(row.sd == 'over_weight') sd_count.over_weight++;
                else if(row.sd == 'proper_weight') sd_count.proper_weight++;
                else if(row.sd == 'risk_of_under_weight') sd_count.risk_of_under_weight++;
                else if(row.sd == 'minimum_under_weight') sd_count.minimum_under_weight++;
                else if(row.sd == 'severe_under_weight') sd_count.severe_under_weight++;

                sixtyMonths_copy[key] = sd_count
            });

        }
        else{
            sixtyMonths_copy[key] = {
                over_weight: 0,
                proper_weight: 0,
                risk_of_under_weight: 0,
                minimum_under_weight: 0,
                severe_under_weight: 0,
            }
        }
    })

    res.send(sixtyMonths_copy)
}

export const GetVaccineTableForChild = async(req, res, next) => {
    const { child_id } = req.params;

    var VACCINE_MAP = []

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try{
        let [all_vaccine] = await pool.query(`select * from vaccine_timetable`);
        
        if(all_vaccine.length < 1) return res.status(404).json({message: 'Vaccine not found'})

        const [children] = await pool.query(`select *, TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) AS months_difference from child where child_id = ?`, [child_id]);
        
        if(children.length < 1) return res.status(404).json({message: 'Child not found'})

        const child = children[0];

        let[take_vaccine] = await pool.query(`select * from taked_vaccine where child_id = ?`, [child_id]);

        // all_vaccine
        // child
        // take_vaccine

        all_vaccine.forEach(vaccine => {

            let return_data = {
                vaccine_id: vaccine.vaccine_id,
                vaccine_name: vaccine.vaccine_name,
                vaccine_month: vaccine.vaccine_month,
            }

            // Check whether the eligible for vaccine
            const eligible = vaccine.vaccine_month <= child.months_difference;
            console.log(vaccine);
            // Check whether the vaccine has been taken
            const taken = take_vaccine.find(take => take.vaccine_id == vaccine.vaccine_id);

            if(taken) {
                return_data = {...return_data, status: "taken"}
            }
            else if(eligible) {
                return_data = {...return_data, status: "eligible"}
            }
            else {
                return_data = {...return_data, status: "not_eligible"}
            }

            VACCINE_MAP.push(return_data);
            
        })

        return res.status(200).json(VACCINE_MAP)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const VaccineGetByChild = async(req, res, next) => {
    const { child_id, vaccine_id } = req.params;

    if(!child_id || !vaccine_id){
        return res.status(400).json({
            message: 'Please add params child_id and vaccine_id',
        })
    }

    try{
        const [row] = await pool.query('INSERT INTO taked_vaccine(child_id, vaccine_id) VALUES (?, ?)', [child_id, vaccine_id]);

        if(row.affectedRows > 0) {
            return res.status(200).json({
                message: 'Vaccine use added'
            })
        }
        else {
            return res.status(500).json({
                message: 'Vaccine usgae adding failed'
            })
        }
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}


export const GetGrowthDetailsChart = async(req, res, next) => {
    const { child_id } = req.params;

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try{
        const [rows] = await pool.query('SELECT * FROM growth_detail WHERE child_id = ?', [child_id]);

        if(rows.length < 1) return res.status(404).json({message: 'Child growth detail not found'})
        
        let table_data = []

        rows.forEach(row => {
            let data = {
                month: row.month,
                weight: row.weight,
            }
            table_data.push(data)
        })

        return res.status(200).json(table_data)
    }
    catch(err) {
        return res.status(500).json({
            message: err.message
        })
    }
}