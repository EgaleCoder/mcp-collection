import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTable } from "../lib/lancerDB-Client.js";
import { ClothingMetadata, LanceRow } from "../type/columns.js";
import { embedQuery } from "../lib/embeddings.js";

// ---------------------------------------------------------------------------
// Tool: search_clothes
// ---------------------------------------------------------------------------
// PURPOSE (Discovery): This tool performs a broad, semantic + filtered search
// across the ENTIRE EVN-Mart catalog. Use it to DISCOVER products matching a
// natural language description. It intentionally returns a summary view
// (name, brand, price, score) to avoid context-window overflow.
//
// For full specifications of any single result, call get_product_details with
// the returned product_no.
// ---------------------------------------------------------------------------

export function registerSearchClothesTool(server: McpServer): void {
  server.registerTool(
    "search_clothes",
    {
      description:
        "🔍 DISCOVERY TOOL — Find clothing items matching a natural language query across the entire EVN-Mart catalog. " +
        "Returns a ranked summary list (name, brand, price, match score). " +
        "Use this first to discover relevant product numbers, then call get_product_details for full specifications. " +
        "Supports filters: gender, brand, category, colour, max_price.",
      inputSchema: {
        query: z
          .string()
          .min(2)
          .describe("Natural language description of the clothing you are looking for."),
        gender: z
          .string()
          .optional()
          .describe('Filter by gender. Common values: "Men", "Women", "Unisex", "Boys", "Girls".'),
        brand: z
          .string()
          .optional()
          .describe("Filter by exact brand name (case-sensitive as stored in catalog)."),
        category: z
          .string()
          .optional()
          .describe('Filter by main category, e.g. "T-Shirts", "Jeans", "Jackets".'),
        colour: z
          .string()
          .optional()
          .describe('Filter by colour EN, e.g. "Blue", "Red", "Black".'),
        max_price: z
          .number()
          .positive()
          .optional()
          .describe("Maximum advice selling price in €."),
        top_k: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .default(20)
          .describe("Maximum number of results to return (1–500, default 20)."),
      },
    },
    async ({
      query,
      gender,
      brand,
      category,
      colour,
      max_price,
      top_k,
    }) => {
      try {
        const table = await getTable();

        // ── Embed the query locally ───────────────────────────────────────
        const queryEmbedding = await embedQuery(query);

        // ── Build SQL-like WHERE clause for LanceDB ───────────────────────
        const conditions: string[] = [];

        if (gender)    conditions.push(`gender = '${gender.replace(/'/g, "''")}'`);
        if (brand)     conditions.push(`brand = '${brand.replace(/'/g, "''")}'`);
        if (category)  conditions.push(`category = '${category.replace(/'/g, "''")}'`);
        if (colour)    conditions.push(`colour = '${colour.replace(/'/g, "''")}'`);
        if (max_price != null) conditions.push(`price <= ${max_price}`);

        const whereClause = conditions.length > 0
          ? conditions.join(" AND ")
          : undefined;

        // ── Query LanceDB ─────────────────────────────────────────────────
        const nResults = top_k ?? 20;

        let searchQuery = table
          .vectorSearch(queryEmbedding)
          .limit(nResults);

        if (whereClause) {
          searchQuery = searchQuery.where(whereClause);
        }

        const results = await searchQuery.toArray();

        // ── Format results ────────────────────────────────────────────────
        const finalItems = results.map((row: any, i: number) => ({
          rank: i + 1,
          product_no:  row.product_no  ?? "",
          name:        row.name        ?? "",
          brand:       row.brand       ?? "",
          category:    row.category    ?? "",
          colour:      row.colour      ?? "",
          size:        row.size        ?? "",
          price:       row.price       ?? 0,
          gender:      row.gender      ?? "",
          match_score: row._distance != null
            ? `${Math.round((1 - row._distance) * 100)}%`
            : "N/A",
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  query,
                  filters_applied: { gender, brand, category, colour, max_price },
                  total_results: finalItems.length,
                  tip: "Use get_product_details with a product_no for full specifications.",
                  items: finalItems,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isNotFound =
          message.includes("not found") ||
          message.includes("does not exist") ||
          message.includes("Table");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: isNotFound
                  ? "Catalog not loaded. Please run `npm run ingest` first to populate LanceDB."
                  : message,
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
