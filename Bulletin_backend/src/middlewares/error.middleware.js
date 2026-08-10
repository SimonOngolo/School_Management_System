const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Erreur:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
