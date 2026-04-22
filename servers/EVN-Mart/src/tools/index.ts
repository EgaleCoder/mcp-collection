import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEchoTool } from "./echo.tool.js";
import { registerGetProductDetailsTool } from "./getProductDetails.tool.js";
import { registerSearchClothesTool } from "./searchClothes.tool.js";

/** Registers all tools on the provided MCP server instance.**/

export function registerAllTools(server: McpServer): void {
  // ── Echo Tool for print ─────────────────────────────────────────────────
  registerEchoTool(server);

  // ─── Additional tools can be registered here ─────────────────────────────

  registerSearchClothesTool(server);
  
  registerGetProductDetailsTool(server);

}
