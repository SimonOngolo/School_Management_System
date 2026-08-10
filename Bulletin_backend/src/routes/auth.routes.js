const express = require('express');
const { login, register, getAllUsers, updateUser, deleteUser } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/login', login);

// Routes protégées (admin uniquement)
router.post('/register', register);
router.get('/users',  getAllUsers);
router.put('/users/:id', authMiddleware, roleMiddleware('admin'), updateUser);
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), deleteUser);

module.exports = router;
