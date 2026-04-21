import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEchoTool } from "./echo.tool.js";

/** Registers all tools on the provided MCP server instance.**/

export function registerAllTools(server: McpServer): void {
  // ── Echo Tool for print ─────────────────────────────────────────────────
  registerEchoTool(server);
}
