const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Version TEMPORAIRE : accessible à tous pour créer le premier admin
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }
    
    // Le hook beforeCreate va hacher automatiquement le mot de passe
    const user = await User.create({ 
      email, 
      password,  // ← en clair, le hook le hache tout seul !
      firstName, 
      lastName, 
      role: role || 'student' 
    });
    
    const token = generateToken(user);
    
    res.status(201).json({ 
      success: true, 
      data: { 
        token, 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer tous les utilisateurs (admin uniquement)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'active', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un utilisateur (admin uniquement)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, active, password } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    // Mise à jour des champs
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;
    if (password) user.password = password; // Le hook beforeUpdate va hacher le mot de passe
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un utilisateur (admin uniquement)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    // Empêcher la suppression de son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getAllUsers, updateUser, deleteUser };
