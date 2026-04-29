import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from "./mcp-server.js";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

let transport: SSEServerTransport;

// Middleware
app.use(express.json());

// Test GET request
app.get("/test", (req: Request, res: Response): void => {
  res.json({
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

// MCP SSE Endpoint
app.get("/mcp", async (req: Request, res: Response) => {
  transport = new SSEServerTransport("/mcp/messages", res);
  await mcpServer.connect(transport);
});

// MCP Messages Endpoint
app.post("/mcp/messages", async (req: Request, res: Response) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE connection");
  }
});

// Start server
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
