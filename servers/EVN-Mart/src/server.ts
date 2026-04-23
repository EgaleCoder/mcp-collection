import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/index.js";

/**
 * Creates and configures a fresh McpServer instance.
**/


export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "evn-mart-mcp",
    version: "2.0.1",
  });

  // Register all tools (and resources / prompts) here
  registerAllTools(server);

  return server;
}
