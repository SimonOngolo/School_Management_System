const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Placeholder notice router', data: [] });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  res.json({ id, title: `Notice ${id}`, note: 'placeholder' });
});

module.exports = router;
