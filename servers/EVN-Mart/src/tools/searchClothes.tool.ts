import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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

export let data = [
  {
    id: 1,
    name: "Classic Oxford Shirt",
    gender: "Men",
    price: 45.0,
    color: "Light Blue",
    category: "Tops",
  },
  {
    id: 2,
    name: "High-Waist Skinny Jeans",
    gender: "Women",
    price: 59.99,
    color: "Indigo",
    category: "Bottoms",
  },
  {
    id: 3,
    name: "Heavyweight Cotton Hoodie",
    gender: "Unisex",
    price: 65.0,
    color: "Heather Grey",
    category: "Outerwear",
  },
  {
    id: 4,
    name: "Floral Summer Sundress",
    gender: "Women",
    price: 38.5,
    color: "Multicolor",
    category: "Dresses",
  },
  {
    id: 5,
    name: "Slim Fit Chinos",
    gender: "Men",
    price: 42.0,
    color: "Olive",
    category: "Bottoms",
  },
  {
    id: 6,
    name: "Graphic Crewneck Tee",
    gender: "Unisex",
    price: 22.0,
    color: "Black",
    category: "Tops",
  },
  {
    id: 7,
    name: "Water-Resistant Windbreaker",
    gender: "Men",
    price: 89.0,
    color: "Navy",
    category: "Outerwear",
  },
  {
    id: 8,
    name: "Pleated Midi Skirt",
    gender: "Women",
    price: 55.0,
    color: "Emerald Green",
    category: "Bottoms",
  },
];

export function registerSearchClothesTool(server: McpServer): void {
  server.registerTool(
    "search_clothes",
    {
      description: "Simple Search tool for finding clothing items.",
      inputSchema: {
        query: z
          .string()
          .min(2)
          .describe(
            "Natural language description of the clothing you are looking for.",
          ),
      },
    },
    async ({ query }) => {
      try {
        const clothesData = data;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  query,
                  results: clothesData,
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
