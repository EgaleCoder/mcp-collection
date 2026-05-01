import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpServer } from "./mcp-server.js";
import cors from "cors";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.set("trust proxy", 1);
app.use(cors());

let transport: StreamableHTTPServerTransport;

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "mcp-session-id",
    "Accept",
    "Authorization",
    "ngrok-skip-browser-warning",
    "x-requested-with",
  ],
  exposedHeaders: ["mcp-session-id"],
  credentials: false,
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

// CORS preflight handling
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// Maps sessionId → transport so subsequent requests hit the same transport.
const sessions = new Map<string, StreamableHTTPServerTransport>();

// Test GET request
app.get("/", (req: Request, res: Response): void => {
  res.json({
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

// MCP SSE Endpoint
app.get("/mcp", async (req: Request, res: Response) => {
  transport = new StreamableHTTPServerTransport("/mcp/messages", req, res);
  await mcpServer.connect(transport);
});

// MCP Messages Endpoint
app.post("/mcp/messages", async (req: Request, res: Response) => {
  if (transport) {
    await transport.sessionId.sendMessage(req.body);
  } else {
    res.status(400).send("No active SSE connection");
  }
});

// Start server
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
