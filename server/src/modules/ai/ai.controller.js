/**
 * ai.controller.js
 * HTTP handlers for all AI chat and knowledge management endpoints.
 */

const { success, error } = require('../../utils/apiResponse');
const agentService = require('./agent.service');
const chatService = require('./chat.service');
const knowledgeService = require('./knowledge.service');
const ingestService = require('./ingest.service');

// ---------------------------------------------------------------------------
// Chat endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/ai/chat
 * Body: { message, sessionId?, guestToken? }
 * Auth: optional (userId from req.user if authenticated)
 */
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, guestToken } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return error(res, 'message is required', 400);
    }

    const userId = req.user?.id || null;
    const userName = req.user
      ? `${req.user.first_name} ${req.user.last_name}`
      : null;

    const result = await agentService.chat({
      message: message.trim(),
      sessionId,
      userId,
      userName,
      guestToken,
    });

    return success(res, result);
  } catch (err) {
    return error(res, err.message || 'AI service error', 500);
  }
};

/**
 * POST /api/ai/chat/stream
 * Streaming via Server-Sent Events (SSE).
 * Body: { message, sessionId?, guestToken? }
 */
const sendMessageStream = async (req, res) => {
  const { message, sessionId, guestToken } = req.body;

  if (!message?.trim()) {
    return error(res, 'message is required', 400);
  }

  const userId = req.user?.id || null;
  const userName = req.user
    ? `${req.user.first_name} ${req.user.last_name}`
    : null;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Keep-alive ping every 15s to prevent proxy timeout
  const pingInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': ping\n\n');
    }
  }, 15000);

  const sendSSE = (event, data) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  req.on('close', () => clearInterval(pingInterval));

  try {
    await agentService.chatStream({
      message: message.trim(),
      sessionId,
      userId,
      userName,
      guestToken,
      onChunk: (text) => sendSSE('chunk', { text }),
      onToolCall: ({ name }) => sendSSE('tool', { name }),
      onDone: ({ sessionId: sid }) => sendSSE('done', { sessionId: sid }),
    });
  } catch (err) {
    sendSSE('error', { message: err.message });
  } finally {
    clearInterval(pingInterval);
    res.end();
  }
};

/**
 * GET /api/ai/sessions
 * Returns chat session history for the authenticated user.
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await chatService.getUserSessions(req.user.id);
    return success(res, sessions);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/ai/sessions/:sessionId/messages
 * Returns messages for a given session.
 */
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.getSessionMessages(sessionId, 50);
    return success(res, messages);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ---------------------------------------------------------------------------
// Knowledge base management (admin only)
// ---------------------------------------------------------------------------

/**
 * POST /api/ai/knowledge/upload
 * Multipart form: file only — no category field.
 * Admin/Manager only.
 */
const uploadKnowledge = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    const { buffer, mimetype, originalname } = req.file;

    const result = await ingestService.processUpload({
      buffer,
      mimetype,
      originalName: originalname,
      uploadedBy: req.user.id,
    });

    return success(res, {
      message: `Document processed successfully — ${result.chunkCount} of ${result.totalChunks} chunks embedded.`,
      sourceId: result.sourceId,
      chunkCount: result.chunkCount,
      totalChunks: result.totalChunks,
    }, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * GET /api/ai/knowledge/sources
 * Lists all ingested knowledge sources.
 */
const listSources = async (req, res) => {
  try {
    const sources = await knowledgeService.listSources();
    return success(res, sources);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * DELETE /api/ai/knowledge/sources/:sourceId
 * Removes a knowledge source and all its chunks.
 */
const deleteSource = async (req, res) => {
  try {
    await knowledgeService.deleteSource(req.params.sourceId);
    return success(res, { message: 'Knowledge source deleted.' });
  } catch (err) {
    return error(res, err.message, 400);
  }
};

module.exports = {
  sendMessage,
  sendMessageStream,
  getSessions,
  getSessionMessages,
  uploadKnowledge,
  listSources,
  deleteSource,
};
