import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { data } from "./searchClothes.tool.js";

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
        "This is a tool to retrieve complete metadata for specific products.",
      inputSchema: {
        product_nos: z
          .array(z.string())
          .min(1)
          .max(20)
          .describe(
            "One or more product numbers (from search_clothes results) to look up. Maximum 20 per call.",
          ),
      },
    },
    async ({ product_nos }) => {
      try {
        const clothesData = data; // In-memory data from searchClothes.tool.js; replace with LanceDB query in production
        
        if (clothesData.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error:
                    "Verify the product numbers are correct (from a search_clothes result).",
                }),
              },
            ],
            isError: true,
          };
        }

        const items = clothesData.filter((item) =>
          product_nos.includes(item.id.toString()),
        );

        const notFound = product_nos.filter(
          (no) => !items.some((item) => item.id.toString() === no),
        );
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
                2,
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
    },
  );
}
