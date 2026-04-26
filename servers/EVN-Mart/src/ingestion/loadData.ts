import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { resetTable, addToTable } from "../lib/lancerDB-Client.js";
import { embedTexts } from "../lib/embeddings.js";
import { ClothingMetadata, LanceRow } from "../type/columns.js";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe string extraction — handles nulls, rich-text cells, and hyperlinks */
function str(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v)
      return (v as ExcelJS.CellRichTextValue).richText
        .map((rt) => rt.text)
        .join("")
        .trim();
    if ("hyperlink" in v)
      return String(
        (v as ExcelJS.CellHyperlinkValue).text ??
          (v as ExcelJS.CellHyperlinkValue).hyperlink
      ).trim();
    if (v instanceof Date) return v.toISOString();
  }
  return String(v).trim();
}

/** Safe number extraction — returns 0 for missing / non-numeric values */
function num(v: ExcelJS.CellValue): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/**
 * Merges product name + description EN into a single rich text chunk.
 * Used as the text field that gets embedded.
 * More context → better semantic search relevance.
 */
function buildDocument(m: ClothingMetadata): string {
  const parts: string[] = [
    m.name,
    m.brand ? `by ${m.brand}` : "",
    m.category,
    m.family,
    m.colour ? `${m.colour} colour` : "",
    m.size ? `size ${m.size}` : "",
    m.size_range ? `(${m.size_range})` : "",
    m.material ? `Material: ${m.material}.` : "",
    m.quality ? `Quality: ${m.quality}.` : "",
    m.sustainability ? `Sustainability: ${m.sustainability}.` : "",
    m.gender ? `Gender: ${m.gender}.` : "",
    m.country_of_origin ? `Made in ${m.country_of_origin}.` : "",
    m.price ? `Price: €${m.price}.` : "",
    m.description,
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reads Sheet 1 of the .xlsx and returns metadata + document pairs.
 * Rows with missing product numbers are skipped.
 */
async function readExcel(
  filePath: string
): Promise<{ metadata: ClothingMetadata; document: string }[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const ws = workbook.worksheets[0];
  if (!ws) throw new Error("Workbook has no worksheets.");

  const rows: { metadata: ClothingMetadata; document: string }[] = [];
  let skipped = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const v = row.values as ExcelJS.CellValue[];

    const product_no = str(v[6]);
    if (!product_no) {
      skipped++;
      return;
    }

    const metadata: ClothingMetadata = {
      product_no,
      int_code: str(v[2]),
      brand: str(v[5]),
      name: str(v[9]) || str(v[7]),
      category: str(v[13]),
      family: str(v[14]),
      photo_url: str(v[18]),
      colour: str(v[21]),
      size: str(v[25]),
      size_range: str(v[26]),
      sustainability: str(v[28]),
      material: str(v[31]),
      quality: str(v[35]),
      gender: str(v[38]),
      gross_weight: num(v[39]),
      netto_weight: num(v[40]),
      qty_in_box: num(v[41]),
      country_of_origin: str(v[43]),
      ean: str(v[44]),
      description: str(v[46]),
      price: num(v[50]),    // ← parsed as number for <= filters
      sales_by_piece: str(v[51]),
      discount: num(v[52]),
    };

    rows.push({ metadata, document: buildDocument(metadata) });
  });

  if (skipped > 0)
    console.warn(`  ⚠  Skipped ${skipped} rows with missing product numbers`);

  return rows;
}

// ---------------------------------------------------------------------------
// Main ingestion flow
// ---------------------------------------------------------------------------

async function ingest(filePath: string): Promise<void> {
  console.log(`\n📂  Reading: ${filePath}`);
  const rows = await readExcel(filePath);
  console.log(`✅  Parsed ${rows.length} clothing items\n`);

  if (rows.length === 0) {
    throw new Error(
      "No valid rows found. Check that Sheet 1 matches the 52-column EVN-Mart schema."
    );
  }

  // ---- Generate embeddings in batches of 50 ----------------------
  const EMBED_BATCH = 50;
  const allEmbeddings: number[][] = [];

  console.log(
    "🧠  Generating embeddings (model downloads ~22 MB on first run)..."
  );

  for (let i = 0; i < rows.length; i += EMBED_BATCH) {
    const slice = rows.slice(i, i + EMBED_BATCH);
    const vecs = await embedTexts(slice.map((r) => r.document));
    allEmbeddings.push(...vecs);
    console.log(
      `    [${Math.min(i + EMBED_BATCH, rows.length)}/${rows.length}] embedded`
    );
  }

  // ---- Build LanceDB rows ----------------------------------------
  const lanceRows: LanceRow[] = rows.map((r, i) => ({
    ...r.metadata,
    text: r.document,
    vector: allEmbeddings[i],
  }));

  // ---- Write first batch to create / reset table ------------------
  const UPSERT_BATCH = 500;
  console.log("\n💾  Writing to LanceDB...");

  const firstBatch = lanceRows.slice(0, UPSERT_BATCH);
  const table = await resetTable(firstBatch as unknown as Record<string, unknown>[]);
  console.log(
    `    [${Math.min(UPSERT_BATCH, lanceRows.length)}/${lanceRows.length}] written`
  );

  // ---- Append remaining batches -----------------------------------
  for (let i = UPSERT_BATCH; i < lanceRows.length; i += UPSERT_BATCH) {
    const batch = lanceRows.slice(i, i + UPSERT_BATCH);
    await addToTable(table, batch as unknown as Record<string, unknown>[]);
    console.log(
      `    [${Math.min(i + UPSERT_BATCH, lanceRows.length)}/${lanceRows.length}] written`
    );
  }

  console.log(
    `\n🎉  Ingestion complete — ${lanceRows.length} items stored in LanceDB at data/lancedb/\n`
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultXlsx = path.resolve(__dirname, "../../data/clothing.xlsx");
const targetFile = process.argv[2] ?? defaultXlsx;

ingest(targetFile).catch((err: unknown) => {
  console.error(
    "\n❌  Ingestion failed:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
