const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([{ id: 1, name: 'Teacher 1' }]);
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  res.json({ id, name: `Teacher ${id}`, note: 'placeholder' });
});

module.exports = router;
