const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.getHistory);
router.delete('/:roleId', historyController.deleteHistory);

module.exports = router;
