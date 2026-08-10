const express = require('express');
const {
  getAllUEs,
  getUEById,
  createUE,
  updateUE,
  deleteUE
} = require('../controllers/ue.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Tous les endpoints nécessitent d'être connecté + rôle admin ou secretariat
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'secretariat']));

router.get('/', getAllUEs);
router.get('/:id', getUEById);
router.post('/', createUE);
router.put('/:id', updateUE);
router.delete('/:id', deleteUE);

module.exports = router;
