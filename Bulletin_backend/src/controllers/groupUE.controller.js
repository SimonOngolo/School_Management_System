/**
 * Contrôleur pour gérer les associations Groupes ↔ UE
 */

const { Group, UE, GroupUE, Semester } = require('../models');

// GET /api/groups/:groupId/ues - Récupérer les UE d'un groupe
const getGroupUEs = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findByPk(groupId, {
      include: [{
        model: UE,
        as: 'UEs',
        include: [{
          model: Semester,
          as: 'Semester'
        }]
      }]
    });
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    }
    
    // Get GroupUE entries for the IDs
    const groupUEEntries = await GroupUE.findAll({
      where: { groupId },
      attributes: ['id', 'groupId', 'ueId', 'createdAt', 'updatedAt']
    });
    
    // Map to include UE details
    const groupUEs = groupUEEntries.map(gue => {
      const ue = group.UEs?.find(u => u.id === gue.ueId);
      return {
        id: gue.id,
        groupId: gue.groupId,
        ueId: gue.ueId,
        createdAt: gue.createdAt,
        updatedAt: gue.updatedAt,
        UE: ue || null
      };
    });
    
    res.json({
      success: true,
      data: groupUEs
    });
    
  } catch (error) {
    next(error);
  }
};

// POST /api/group-ues - Assigner des UE à un groupe
const assignUEs = async (req, res, next) => {
  try {
    const { groupId, ueIds } = req.body;
    
    if (!groupId || !ueIds || !Array.isArray(ueIds)) {
      return res.status(400).json({
        success: false,
        message: 'groupId et ueIds (tableau) sont requis'
      });
    }
    
    const created = [];
    const errors = [];
    
    for (const ueId of ueIds) {
      try {
        // Vérifier si l'association existe déjà
        const existing = await GroupUE.findOne({
          where: { groupId, ueId }
        });
        
        if (existing) {
          errors.push({ ueId, message: 'Déjà assignée' });
          continue;
        }
        
        const groupUE = await GroupUE.create({ groupId, ueId });
        created.push(groupUE);
      } catch (err) {
        errors.push({ ueId, message: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `${created.length} UE(s) assignée(s)`,
      data: { created, errors }
    });
    
  } catch (error) {
    next(error);
  }
};

// DELETE /api/group-ues/:id - Retirer une UE d'un groupe
const removeUE = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const groupUE = await GroupUE.findByPk(id);
    if (!groupUE) {
      return res.status(404).json({
        success: false,
        message: 'Association non trouvée'
      });
    }
    
    await groupUE.destroy();
    
    res.json({
      success: true,
      message: 'UE retirée du groupe'
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupUEs,
  assignUEs,
  removeUE
};
