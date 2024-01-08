import express from 'express';
import { AddNews, AdminLogin, AdminLogout, CheckAdminAuth, CreateMidwife, CreateOfficer, GetAllMidwifes, GetMidwifeByID, GetOfficerByAreaID, GetOfficerByID, UpdateMidwife, UpdateOfficer, getAllOfficers } from '../methods/AdminMethod.js';
const router = express.Router();
import session from 'express-session';
import multer from 'multer';


router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

router.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadStorage = multer({ storage: storage })


const checkAuth = (req, res, next) => {
    if(req.session.admin) {
        next();
    }
    else {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
}

router.options('*', (req, res) => res.sendStatus(200));

// router.post('/upload', uploadStorage.single('file'), (req, res) => {
//   console.log(req.file);
//   res.send(req.file);
// })

router.options('*', (req, res) => res.sendStatus(200));
router.post('/login', AdminLogin);
router.post('/logout', AdminLogout);
router.get('/check-auth', CheckAdminAuth);

router.use(checkAuth);

router.post('/create-midwife', CreateMidwife);
router.get('/midwifes', GetAllMidwifes);
router.get('/midwife/:id', GetMidwifeByID);
router.put('/midwife/:id', UpdateMidwife);

router.post('/create-officer', CreateOfficer);
router.put('/officer/:id', UpdateOfficer);
router.post('/add-news', uploadStorage.single('file'), AddNews);

router.get('/get-all-officer', getAllOfficers);
router.get('/get-officer/:id', GetOfficerByID);
router.get('/get-officers-by-area/:id', GetOfficerByAreaID);


export default router;