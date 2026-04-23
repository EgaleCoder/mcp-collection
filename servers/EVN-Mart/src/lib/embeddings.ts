import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------
// "Xenova/all-MiniLM-L6-v2" is a lightweight 22 MB ONNX model that produces
// 384-dimensional sentence embeddings. It is downloaded automatically by
// @xenova/transformers on first use and cached in ~/.cache/huggingface.
const MODEL_NAME =
  process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";

// ---------------------------------------------------------------------------
// Singleton — avoid re-loading the model on every tool call
// ---------------------------------------------------------------------------
let _embeddings: HuggingFaceTransformersEmbeddings | null = null;

export function getEmbeddings(): HuggingFaceTransformersEmbeddings {
  if (!_embeddings) {
    _embeddings = new HuggingFaceTransformersEmbeddings({
      model: MODEL_NAME,
    });
  }
  return _embeddings;
}

/**
 * Embed multiple text strings (used during ingestion).
 * Returns one embedding vector per input string.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  return getEmbeddings().embedDocuments(texts);
}

/**
 * Embed a single query string (used at search time).
 */
export async function embedQuery(text: string): Promise<number[]> {
  return getEmbeddings().embedQuery(text);
}
