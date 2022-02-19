import express from 'express';
import { signup, login, editUser, deleteUser, forgotPassword, resetPassword, newMenu, editMenu, deleteMenu, getUserMenus, getMenu, newSurvey, editSurvey, deleteSurvey, getUserSurveys, getSurvey } from '../controller/user.js';
const router = express.Router();
import multer from 'multer';
const upload = multer({ dest: 'qrcodes/' })

router.post('/signup', signup);
router.post('/login', login);
router.post('/editUser/:uid', editUser);
router.delete('/deleteUser/:uid', deleteUser);
router.post('/forgotPass', forgotPassword);
router.post('/reset', resetPassword);
router.post('/createMenu/:uid', newMenu);
router.post('/editMenu/:mid', editMenu);
router.delete('/deleteMenu/:mid', deleteMenu);
router.get('/userMenus/:uid', getUserMenus);
router.get('/getMenu/:mid', getMenu);
router.post('/createSurvey/:uid', newSurvey);
router.post('/editSurvey/:sid', editSurvey);
router.delete('/deleteSurvey/:sid', deleteSurvey);
router.get('/userSurveys/:uid', getUserSurveys);
router.get('/getSurvey/:sid', getSurvey);


export default router;

