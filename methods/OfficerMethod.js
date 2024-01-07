export const OfficerLogin = async(req, res, next) => {
    const {nic, password} = req.body;
    if(!nic || !password) {
        return res.status(400).json({
            message: 'Please fill all fields'
        })
    }
    try{
        const [rows] = await pool.query('SELECT officer_id, email, nic FROM medical_officer WHERE nic = ? AND password = ? LIMIT 1', [nic, password]);
        
        try{
            if(rows.length > 0) {
                req.session.midwife = {officer_id: rows[0] };
                req.session.save();
                return res.status(200).json({
                    message: 'Login success',
                    data: req.session.midwife.officer_id
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