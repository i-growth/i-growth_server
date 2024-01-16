import pool from "../resource/db_connection.js";


export const ParentLogin = async (req, res, next) => {
    const { nic, password } = req.body;
    if (!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try {
        const [rows] = await pool.query('SELECT guardian_nic, area_id, email FROM parent WHERE guardian_nic = ? AND password = ? LIMIT 1', [nic, password]);

        try {
            if (rows.length > 0) {
                req.session.parent = { parent_id: rows[0], area_id: rows[0].area_id };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.parent.parent_id
                })
            }
            else {
                return res.status(401).json({
                    message: 'Login failed'
                })
            }
        }
        catch (err) {
            return res.status(500).json({
                message: err.message
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const ParentLogout = async (req, res, next) => {
    try {
        req.session.destroy();
        return res.status(200).json({
            message: 'Logout success'
        })
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const ParentCheckAuth = async (req, res, next) => {
    if (req.session.parent) {
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

export const GetChildByGuardianNIC = async (req, res, next) => {
    const {guardian_nic} = req.session.parent.parent_id
    
    try {
        const [rows] = await pool.query('SELECT * FROM child WHERE gardian_nic = ?', [guardian_nic]);
        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetChildByID = async (req, res, next) => {
    const {child_id} = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM child WHERE child_id = ?', [child_id]);
        return res.status(200).json(rows)
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetChildVaccineDetails = async (req, res, next) => {
    const { child_id } = req.params;

    // var VACCINE_MAP = []

    if (!child_id) {
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    try {
        let [all_vaccine] = await pool.query(`select vaccine_timetable.*, vaccine.* from vaccine_timetable join vaccine on vaccine.vaccine_id = vaccine_timetable.vaccine_id`);

        if (all_vaccine.length < 1) return res.status(404).json({ message: 'Vaccine not found' })

        const [children] = await pool.query(`select *, TIMESTAMPDIFF(MONTH, child_birthday, CURDATE()) AS months_difference from child where child_id = ?`, [child_id]);

        if (children.length < 1) return res.status(404).json({ message: 'Child not found' })

        const child = children[0];

        const [vaccine_time_table] = await pool.query(`select vaccine_timetable.*, vaccine.* from vaccine_timetable join vaccine on vaccine.vaccine_id = vaccine_timetable.vaccine_id order by vaccine_month ASC`);


        // let return_data = {
        //     vaccine_id: vaccine.vaccine_id,
        //     vaccine_name: vaccine.vaccine_name,
        //     vaccine_month: vaccine.vaccine_month,
        // }

        const VACCINE_MAP = await Promise.all( 
            vaccine_time_table.map(async(vaccine) => {
                let {vaccine_timetable_id} = vaccine;
                let {child_id} = child;
                let {months_difference} = child;

                let return_data = {
                    time_table_id: vaccine_timetable_id,
                    vaccine_id: vaccine.vaccine_id,
                    vaccine_name: vaccine.vaccine_name,
                    vaccine_month: vaccine.vaccine_month,
                }

            try{
                // check vaccine taken or not
                const [result] = await pool.query('select * from taked_vaccine where time_table_id = ? and child_id = ?', [vaccine_timetable_id, child_id]);
                
                if(result.length > 0){
                    return_data = {...return_data, status: "taken"}
                }
                else{
                    if(vaccine.vaccine_month <= months_difference){
                        return_data = {...return_data, status: "eligible"}
                    }
                    else{
                        return_data = {...return_data, status: "not_eligible"}
                    }
                }

                

            }
                catch(err){
                console.log(err);
                return res.status(500).json({
                    message: err.message
                })
                }

                // console.log(return_data);
                return return_data
            })
        )


        console.log(VACCINE_MAP);
        return res.status(200).json(VACCINE_MAP)

    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const GetDevActivity = async (req, res, next) => {
    const { child_id } = req.params;

    if(!child_id){
        return res.status(400).json({
            message: 'Please add params child_id',
        })
    }

    // Get All Growth Details
    try {
        const [activities] = await pool.query('select * from activities');
        
        if(activities.length < 1) return res.status(404).json({message: 'Activities not found'})

        // Check child done the activity or not
        const ACTIVITY_MAP = await Promise.all(
            activities.map(async(activity) => {
                try{
                    // console.log(child_id, activity.activity_id);
                    const [result] = await pool.query('select * from done_activities where child_id = ? and activity_id = ?', [child_id, activity.activity_id]);
                    if(result.length > 0){
                        activity.done = true;
                    }
                    else{
                        activity.done = false;
                    }

                    return activity;
                }
                catch(err){
                    console.log(err);
                    return res.status(500).json({
                        message: err.message
                    })
                }

            })
        )

        return res.status(200).json(ACTIVITY_MAP)


    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}

export const DevMakeAsDone = async (req, res, next) => {
    const { child_id, activity_id } = req.params;

    if(!child_id || !activity_id){
        return res.status(400).json({
            message: 'Please add params child_id and activity_id',
        })
    }

    try{
        const [result] = await pool.query('select * from done_activities where child_id = ? and activity_id = ?', [child_id, activity_id]);
        if(result.length > 0){
            return res.status(400).json({
                message: 'Already done'
            })
        }
        else{
            await pool.query('insert into done_activities (child_id, activity_id) values (?, ?)', [child_id, activity_id]);
            return res.status(200).json({
                message: 'Done'
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message: err.message
        })
    }
}