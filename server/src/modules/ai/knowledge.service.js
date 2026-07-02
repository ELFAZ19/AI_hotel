/**
 * knowledge.service.js
 * Handles ingestion (chunking + embedding) and retrieval (vector search).
 *
 * One master document approach:
 *   - Upload a single PDF/DOCX/TXT
 *   - System chunks it automatically
 *   - All chunks tagged with source_name = file name, category = 'master'
 *   - RAG retrieval searches across all chunks regardless of category
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------------------------------------------------------
// 1. Chunking
//    Strategy: sentence-aware sliding window so chunks never cut mid-sentence.
// ---------------------------------------------------------------------------
const CHUNK_SIZE = 700;    // target characters per chunk
const CHUNK_OVERLAP = 120; // overlap to preserve context across boundaries

const chunkText = (text) => {
  // Normalise whitespace
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

  // Split into sentences (naive but effective for hotel documents)
  const sentences = cleaned.split(/(?<=[.!?])\s+/);

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      // Keep the last part of current as overlap
      const words = current.split(' ');
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 5));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }

  if (current.trim().length > 50) {
    chunks.push(current.trim());
  }

  return chunks.filter(c => c.length > 50);
};

// ---------------------------------------------------------------------------
// 2. Embedding
// ---------------------------------------------------------------------------
const embedText = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: 768
  });
  return result.embedding.values; // float[]
};

// ---------------------------------------------------------------------------
// 3. Ingest — no category, everything is 'master'
// ---------------------------------------------------------------------------
const ingestDocument = async (text, sourceName, uploadedBy) => {
  // Delete any existing source with the same file name (replace-on-reupload)
  const existing = await pool.query(
    'SELECT id FROM knowledge_sources WHERE file_name = $1',
    [sourceName]
  );
  if (existing.rows.length > 0) {
    await pool.query('DELETE FROM knowledge_chunks WHERE source_name = $1', [sourceName]);
    await pool.query('DELETE FROM knowledge_sources WHERE file_name = $1', [sourceName]);
    logger.info(`Replaced existing source: "${sourceName}"`);
  }

  // Register new source
  const srcResult = await pool.query(
    `INSERT INTO knowledge_sources (file_name, category, uploaded_by)
     VALUES ($1, 'master', $2) RETURNING id`,
    [sourceName, uploadedBy || null]
  );
  const sourceId = srcResult.rows[0].id;

  // Chunk the text
  const chunks = chunkText(text);
  logger.info(`Ingesting "${sourceName}": ${chunks.length} chunks`);

  // Embed + insert each chunk
  let inserted = 0;
  for (const chunk of chunks) {
    try {
      const embedding = await embedText(chunk);
      const vectorLiteral = `[${embedding.join(',')}]`;
      await pool.query(
        `INSERT INTO knowledge_chunks (source_name, category, chunk_text, embedding, metadata)
         VALUES ($1, 'master', $2, $3::vector, $4)`,
        [sourceName, chunk, vectorLiteral, JSON.stringify({ source_id: sourceId })]
      );
      inserted++;
      // Small delay to stay within Gemini free-tier rate limits
      await new Promise(r => setTimeout(r, 60));
    } catch (err) {
      logger.error(`Failed to embed chunk ${inserted + 1} from "${sourceName}": ${err.message}`);
    }
  }

  // Update chunk count
  await pool.query(
    'UPDATE knowledge_sources SET chunk_count = $1 WHERE id = $2',
    [inserted, sourceId]
  );

  return { sourceId, chunkCount: inserted, totalChunks: chunks.length };
};

// ---------------------------------------------------------------------------
// 4. RAG retrieval — no category filter, search the whole master knowledge base
// ---------------------------------------------------------------------------
const retrieveRelevantChunks = async (query, topK = 5) => {
  try {
    const queryEmbedding = await embedText(query);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const result = await pool.query(
      `SELECT id, source_name, chunk_text,
              1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_chunks
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral, topK]
    );

    return result.rows;
  } catch (err) {
    logger.error('RAG retrieval failed: ' + err.message);
    return [];
  }
};

// ---------------------------------------------------------------------------
// 5. Delete a source and all its chunks
// ---------------------------------------------------------------------------
const deleteSource = async (sourceId) => {
  const src = await pool.query(
    'SELECT file_name FROM knowledge_sources WHERE id = $1',
    [sourceId]
  );
  if (!src.rows[0]) throw new Error('Source not found');
  const { file_name } = src.rows[0];

  await pool.query('DELETE FROM knowledge_chunks WHERE source_name = $1', [file_name]);
  await pool.query('DELETE FROM knowledge_sources WHERE id = $1', [sourceId]);
  return true;
};

// ---------------------------------------------------------------------------
// 6. List all sources
// ---------------------------------------------------------------------------
const listSources = async () => {
  const result = await pool.query(
    `SELECT ks.id, ks.file_name, ks.chunk_count, ks.created_at,
            u.first_name || ' ' || u.last_name AS uploaded_by_name
     FROM knowledge_sources ks
     LEFT JOIN users u ON ks.uploaded_by = u.id
     ORDER BY ks.created_at DESC`
  );
  return result.rows;
};

module.exports = {
  ingestDocument,
  retrieveRelevantChunks,
  deleteSource,
  listSources,
};
