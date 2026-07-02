/**
 * KnowledgePage.jsx
 * Upload a single master PDF/DOCX/TXT that becomes the AI's entire knowledge base.
 * No categories — the system chunks and embeds everything automatically.
 */

import { useState, useEffect, useRef } from 'react';
import { Trash2, FileText, Brain, Loader, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../lib/axios';

// Accepted file types
const ACCEPT = '.pdf,.docx,.txt';
const ACCEPT_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_SIZE_MB = 10;

// Format file size nicely
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function KnowledgePage() {
  const [sources, setSources]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | done | error
  const [uploadResult, setUploadResult] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [fileError, setFileError]     = useState('');
  const inputRef = useRef(null);

  // ── Fetch sources ────────────────────────────────────────────────────────
  const fetchSources = async () => {
    try {
      const { data } = await axiosInstance.get('/ai/knowledge/sources');
      setSources(data.data || []);
    } catch {
      toast.error('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSources(); }, []);

  // ── File validation ───────────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    if (!ACCEPT_MIME.includes(f.type) && !ACCEPT.split(',').some(ext => f.name.endsWith(ext))) {
      return 'Only PDF, DOCX, or TXT files are accepted.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_SIZE_MB} MB limit.`;
    }
    return '';
  };

  const handleFileSelect = (f) => {
    const err = validateFile(f);
    setFileError(err);
    setFile(err ? null : f);
    setUploadState('idle');
    setUploadResult(null);
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file || uploadState === 'uploading') return;

    setUploadState('uploading');
    setUploadResult(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const { data } = await axiosInstance.post('/ai/knowledge/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(data.data);
      setUploadState('done');
      toast.success('Knowledge base updated successfully');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      fetchSources();
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Please try again.';
      setUploadState('error');
      setUploadResult({ error: msg });
      toast.error(msg);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (sourceId, fileName) => {
    if (!confirm(`Remove "${fileName}" from the knowledge base?\nAll its chunks will be deleted.`)) return;
    setDeletingId(sourceId);
    try {
      await axiosInstance.delete(`/ai/knowledge/sources/${sourceId}`);
      toast.success('Knowledge source removed');
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch {
      toast.error('Failed to delete source');
    } finally {
      setDeletingId(null);
    }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const dropZoneCls = [
    'relative flex flex-col items-center justify-center gap-3',
    'border-2 border-dashed rounded-2xl px-6 py-10 cursor-pointer transition-all',
    dragOver
      ? 'border-amber-500 bg-amber-50'
      : file
      ? 'border-green-400 bg-green-50'
      : 'border-gray-300 bg-gray-50 hover:border-amber-400 hover:bg-amber-50',
  ].join(' ');

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Brain size={22} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
          <p className="text-sm text-gray-500">
            Upload one master document — the AI will read, chunk, and remember everything in it.
          </p>
        </div>
      </div>

      {/* ── Upload card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Upload Master Document
        </h2>

        {/* Drop zone */}
        <div
          className={dropZoneCls}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="Upload file drop zone"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0] || null)}
          />

          {file ? (
            /* Selected file preview */
            <>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText size={24} className="text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatSize(file.size)}</p>
              </div>
              <p className="text-xs text-gray-400">Click or drop to replace</p>
            </>
          ) : (
            /* Empty state */
            <>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <UploadCloud size={24} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Drop your file here, or <span className="text-amber-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF · DOCX · TXT &nbsp;·&nbsp; Max {MAX_SIZE_MB} MB</p>
              </div>
            </>
          )}
        </div>

        {/* Validation error */}
        {fileError && (
          <p className="flex items-center gap-1.5 text-red-600 text-xs mt-2">
            <AlertCircle size={13} /> {fileError}
          </p>
        )}

        {/* Result banner */}
        {uploadState === 'done' && uploadResult && (
          <div className="flex items-start gap-2.5 mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 size={17} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Knowledge base updated</p>
              <p className="text-xs text-green-700 mt-0.5">
                {uploadResult.chunkCount} chunks embedded
                {uploadResult.totalChunks && uploadResult.totalChunks !== uploadResult.chunkCount
                  ? ` (${uploadResult.totalChunks - uploadResult.chunkCount} skipped due to API errors)`
                  : ''}
              </p>
            </div>
          </div>
        )}

        {uploadState === 'error' && uploadResult?.error && (
          <div className="flex items-start gap-2.5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{uploadResult.error}</p>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || !!fileError || uploadState === 'uploading'}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          {uploadState === 'uploading' ? (
            <>
              <Loader size={16} className="animate-spin" />
              Processing — this may take a minute…
            </>
          ) : (
            <>
              <UploadCloud size={16} />
              Process & Embed Document
            </>
          )}
        </button>

        {/* Processing note */}
        {uploadState === 'uploading' && (
          <p className="text-xs text-center text-gray-400 mt-2">
            The document is being chunked and embedded. Keep this page open.
          </p>
        )}
      </div>

      {/* ── Ingested sources ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Ingested Documents
          </h2>
          <span className="text-xs text-gray-400">
            {sources.length} {sources.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={22} className="animate-spin text-amber-500" />
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={34} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No documents uploaded yet.</p>
            <p className="text-xs mt-1">Upload your hotel's master information PDF above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sources.map((src) => (
              <li
                key={src.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={17} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{src.file_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {src.chunk_count ?? 0} chunks
                      {' · '}
                      {new Date(src.created_at).toLocaleDateString([], {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                      {src.uploaded_by_name ? ` · ${src.uploaded_by_name}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(src.id, src.file_name)}
                  disabled={deletingId === src.id}
                  className="ml-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                  title={`Remove ${src.file_name}`}
                >
                  {deletingId === src.id
                    ? <Loader size={15} className="animate-spin" />
                    : <Trash2 size={15} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* How it works note */}
      <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">How it works:</span> Your document is split into overlapping
          text chunks (~700 chars each), each chunk is embedded using Google's
          <span className="font-mono mx-1">text-embedding-004</span> model, and stored in a vector
          database. When a guest asks a question, the most relevant chunks are retrieved and injected
          into the AI's context — so it answers from your actual hotel information, not guesswork.
        </p>
      </div>
    </div>
  );
}
