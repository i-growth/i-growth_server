import express from 'express';
const router = express.Router();
import session from 'express-session';
import { OfficerLogin } from '../methods/OfficerMethod.js';



router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
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

const checkAuth = (req, res, next) => {
    if(req.session.officer) {
        next();
    }
    else {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
}


router.options('*', (req, res) => res.sendStatus(200));
router.post('/login', OfficerLogin);
router.post('/logout', );

router.use(checkAuth);



export default router;