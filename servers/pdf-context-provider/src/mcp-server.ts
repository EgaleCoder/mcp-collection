import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./Tools/index.js";

// Create server instance
const mcpServer = new McpServer({
  name: "DataVault",
  version: "1.06.04.26",
});

// Register all tools
registerAllTools(mcpServer);

import { fileURLToPath } from "url";

// Create a Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("MCP Server is running and connected via stdio transport.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
  });
}

export { mcpServer };
