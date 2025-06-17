const express = require('express');
const router = express.Router();

// GET queue status
router.get('/', (req, res) => {
  res.json({ message: 'Get queue status', queue: [] });
});

// POST add to queue
router.post('/', (req, res) => {
  res.json({ message: 'Add to queue', data: req.body });
});

// PUT update queue position
router.put('/:id', (req, res) => {
  res.json({ message: `Update queue position for ${req.params.id}` });
});

// DELETE remove from queue
router.delete('/:id', (req, res) => {
  res.json({ message: `Remove from queue ${req.params.id}` });
});

module.exports = router;
