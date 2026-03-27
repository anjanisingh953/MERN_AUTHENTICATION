import express from 'express';
import  {register, verifyOTP, login, logout, getUser, forgotPassword, resetPassword}  from "../controllers/userController.js";
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router()

router.post('/register', register);
router.post('/opt-verification', verifyOTP);
router.post('/login', login);
router.get('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, getUser);
router.post('/password/forgot', forgotPassword);
router.patch('/password/reset/:token', resetPassword);

export default router;