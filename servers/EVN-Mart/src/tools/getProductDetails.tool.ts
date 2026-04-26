import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTable } from "../lib/lancerDB-Client.js";
import { ClothingMetadata, LanceRow } from "../type/columns.js";
import { embedQuery } from "../lib/embeddings.js";

// ---------------------------------------------------------------------------
// Tool: get_product_details
// ---------------------------------------------------------------------------
// PURPOSE (Deep Specification): After discovering a product_no with
// search_clothes, call this tool to retrieve its COMPLETE metadata (all
// fields). This avoids context-window overflow during broad discovery searches.
// ---------------------------------------------------------------------------

export function registerGetProductDetailsTool(server: McpServer): void {
  server.registerTool(
    "get_product_details",
    {
      description:
        "📄 SPECIFICATION TOOL — Retrieve the COMPLETE metadata for one or more specific products by their product_no. " +
        "Returns all catalog fields including material, sustainability, EAN, weights, and photo URL. " +
        "Use this AFTER search_clothes to get full specifications for a product the user wants to know more about. " +
        "Accepts up to 20 product_nos in a single call.",
      inputSchema: {
        product_nos: z
          .array(z.string())
          .min(1)
          .max(20)
          .describe(
            "One or more product numbers (from search_clothes results) to look up. Maximum 20 per call."
          ),
      },
    },
    async ({ product_nos }) => {
      try {
        const table = await getTable();

        // Build a SQL IN clause to fetch multiple products at once
        const escaped = product_nos.map((pn) => `'${pn.replace(/'/g, "''")}'`);
        const whereClause = `product_no IN (${escaped.join(", ")})`;

        const results = await table
          .query()
          .where(whereClause)
          .toArray();

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: `No products found for the given product_nos: ${product_nos.join(", ")}. ` +
                    "Verify the product numbers are correct (from a search_clothes result).",
                }),
              },
            ],
            isError: true,
          };
        }

        // Strip the vector field (large, not useful to the LLM) => Its delete vectors from the response, leaving only metadata fields 
        const items = results.map((row: any) => {
          const { vector, ...rest } = row;
          return rest;
        });

        // Report any requested IDs that weren't found
        const foundIds = new Set(items.map((it: any) => it.product_no));
        const notFound = product_nos.filter((pn) => !foundIds.has(pn));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  requested: product_nos.length,
                  found: items.length,
                  not_found: notFound.length > 0 ? notFound : undefined,
                  products: items,
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
