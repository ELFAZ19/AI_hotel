-- 011_ai_chat.sql
-- AI Chat: sessions, messages, and knowledge base chunks

-- -----------------------------------------------------------------------
-- 1. pgvector extension (enables vector similarity search for RAG)
--    If you are on Supabase or Neon, this extension is usually pre-installed.
--    On a self-hosted Postgres run: CREATE EXTENSION IF NOT EXISTS vector;
-- -----------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------
-- 2. Chat sessions
--    user_id is nullable → guest users can chat without an account.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_token  VARCHAR(200),          -- stable browser-generated token for guests
  title        VARCHAR(255),          -- optional – first user message summarised
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_guest ON chat_sessions(guest_token);

-- -----------------------------------------------------------------------
-- 3. Chat messages
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content       TEXT NOT NULL,
  tool_calls    JSONB DEFAULT NULL,   -- raw Gemini tool_calls for assistant turns
  tool_name     VARCHAR(100),         -- populated for role='tool' result messages
  tool_result   JSONB DEFAULT NULL,   -- raw tool return value
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(session_id, created_at);

-- -----------------------------------------------------------------------
-- 4. Knowledge chunks (RAG store)
--    Admin uploads documents → text is chunked → stored here with embeddings.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(255) NOT NULL,   -- original filename / title
  category    VARCHAR(100),            -- e.g. 'policies', 'amenities', 'faq'
  chunk_text  TEXT NOT NULL,
  embedding   vector(768),             -- Gemini text-embedding-004 = 768 dims
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category
  ON knowledge_chunks(category);

-- -----------------------------------------------------------------------
-- 5. Knowledge sources (tracks uploaded files so admin can manage them)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    VARCHAR(255) NOT NULL,
  category     VARCHAR(100),
  chunk_count  INT DEFAULT 0,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
