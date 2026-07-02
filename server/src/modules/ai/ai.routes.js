/**
 * ai.routes.js
 * All AI-related endpoints.
 *
 * Public (no auth required): chat (guests can use it)
 * Optional auth: chat (authenticated users get extra capabilities)
 * Protected (admin/manager): knowledge management
 */

const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../../middleware/auth');
const controller = require('./ai.controller');

const router = express.Router();

// -----------------------------------------------------------------------
// Multer for knowledge uploads (memory storage – no disk write needed)
// -----------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .pdf, and .docx files are allowed'), false);
    }
  },
});

// -----------------------------------------------------------------------
// Optional auth middleware (doesn't fail on missing token)
// -----------------------------------------------------------------------
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Guest mode – req.user remains undefined
  }
  return authenticate(req, res, next);
};

// -----------------------------------------------------------------------
// Chat routes (accessible to everyone)
// -----------------------------------------------------------------------
router.post('/chat', optionalAuth, controller.sendMessage);
router.post('/chat/stream', optionalAuth, controller.sendMessageStream);

// -----------------------------------------------------------------------
// Session history (authenticated users only)
// -----------------------------------------------------------------------
router.get('/sessions', authenticate, controller.getSessions);
router.get('/sessions/:sessionId/messages', authenticate, controller.getSessionMessages);

// -----------------------------------------------------------------------
// Knowledge management (admin / manager only)
// -----------------------------------------------------------------------
router.post(
  '/knowledge/upload',
  authenticate,
  authorize('admin', 'manager'),
  upload.single('file'),
  controller.uploadKnowledge
);

router.get(
  '/knowledge/sources',
  authenticate,
  authorize('admin', 'manager'),
  controller.listSources
);

router.delete(
  '/knowledge/sources/:sourceId',
  authenticate,
  authorize('admin', 'manager'),
  controller.deleteSource
);

module.exports = router;
