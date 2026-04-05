import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";



// Create server instance
const server = new McpServer({
  name: "DataVault",
  version: "1.06.04.26",
});



// Create a Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server is running and connected via stdio transport.");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
});
