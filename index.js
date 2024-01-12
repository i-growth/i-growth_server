import express from 'express';
const app = express();
import cookieParser from 'cookie-parser';
import { PORT } from './resource/config.js';
import AdminRoutes from './routers/AdminRoutes.js';
import MidwifeRoutes from './routers/MidwifeRoutes.js';
import OfficerRoutes from './routers/OfficerRoutes.js';
import PublicRoutes from './routers/PublicRoutes.js';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/public', PublicRoutes);
app.use('/midwife', MidwifeRoutes);
app.use('/officer', OfficerRoutes)
app.use('/admin', AdminRoutes);

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
})