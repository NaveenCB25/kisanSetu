const express = require('express');
const router = express.Router();
const { registerFarmer, registerCenter, login, getMe, updateFcmToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerFarmerSchema, registerCenterSchema, loginSchema } = require('../middleware/validate');

router.post('/register/farmer', validate(registerFarmerSchema), registerFarmer);
router.post('/register/center', validate(registerCenterSchema), registerCenter);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
