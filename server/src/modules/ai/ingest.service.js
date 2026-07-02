/**
 * ingest.service.js
 * Extracts text from an uploaded master document and delegates to
 * knowledge.service for sentence-aware chunking + embedding.
 *
 * Supported formats: PDF, DOCX, TXT
 * No categories — one master knowledge file covers everything.
 */

const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const knowledgeService = require('./knowledge.service');
const logger = require('../../utils/logger');

/**
 * Extract raw text from a buffer based on mimetype / file extension.
 */
const extractText = async (buffer, mimetype, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  if (mimetype === 'text/plain' || ext === '.txt') {
    return buffer.toString('utf-8');
  }

  if (mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type "${ext}". Please upload a PDF, DOCX, or TXT file.`);
};

/**
 * Process the master knowledge document:
 *   extract text → chunk → embed → store in DB
 *
 * If a document with the same filename already exists it is replaced.
 */
const processUpload = async ({ buffer, mimetype, originalName, uploadedBy }) => {
  logger.info(`Processing master knowledge upload: ${originalName}`);

  const text = await extractText(buffer, mimetype, originalName);

  if (!text || text.trim().length < 50) {
    throw new Error('The file appears to be empty or contains no readable text.');
  }

  // No category — ingestDocument handles 'master' internally
  const result = await knowledgeService.ingestDocument(text, originalName, uploadedBy);
  return result;
};

module.exports = { processUpload };
