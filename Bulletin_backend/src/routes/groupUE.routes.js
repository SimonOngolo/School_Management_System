const express = require('express');
const { getGroupUEs, assignUEs, removeUE } = require('../controllers/groupUE.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Toutes les routes protégées (admin ou secretariat)
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'secretariat'));

// GET /api/groups/:groupId/ues - Liste des UE d'un groupe
router.get('/groups/:groupId/ues', getGroupUEs);

// POST /api/group-ues - Assigner des UE à un groupe
router.post('/group-ues', assignUEs);

// DELETE /api/group-ues/:id - Retirer une UE
router.delete('/group-ues/:id', removeUE);

module.exports = router;
