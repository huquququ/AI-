const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/:roleId/messages', chatController.getMessages);
router.post('/:roleId/messages', chatController.sendMessage);
router.get('/:roleId/stream', chatController.getStream);
router.post('/ai/response', chatController.getAIResponse);
router.delete('/:roleId', chatController.clearConversation);

module.exports = router;
