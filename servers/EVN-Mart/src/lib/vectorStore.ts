import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.resolve(__dirname, "../../data/vector_index.json");

interface SerializedIndex {
  embeddings: number[][]; // [384][]
  documents: string[];
  metadata: any[];
}

let _cachedData: SerializedIndex | null = null;

/**
 * Calculates dot product similarity between two normalized vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export async function getVectorStore() {
  if (_cachedData) return _cachedData;

  try {
    const raw = await fs.readFile(INDEX_FILE, "utf-8");
    _cachedData = JSON.parse(raw);
    return _cachedData!;
  } catch (err) {
    return { embeddings: [], documents: [], metadata: [] };
  }
}

export async function saveVectorStore(
  embeddings: number[][],
  documents: string[],
  metadata: any[]
) {
  const data: SerializedIndex = { embeddings, documents, metadata };
  await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true });
  await fs.writeFile(INDEX_FILE, JSON.stringify(data), "utf-8");
  _cachedData = data;
}

/**
 * Performs a linear scan to find top K similar items.
 */
export function searchIndex(queryVector: number[], data: SerializedIndex, topK: number) {
  const results = data.embeddings.map((vec, idx) => ({
    id: idx,
    similarity: cosineSimilarity(queryVector, vec),
  }));

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topK);
}

