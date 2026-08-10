const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Placeholder class router', data: [] });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  res.json({ id, name: `Class ${id}`, note: 'placeholder' });
});

module.exports = router;
