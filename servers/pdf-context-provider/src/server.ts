import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpServer } from "./mcp-server.js";
import cors from "cors";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);
const MCP_ENDPOINT = "/mcp"; // Standard MCP endpoint path

app.set("trust proxy", 1);
app.use(cors());

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

// ---------------------------------------------------------------------------
// Session store (stateful mode)
// ---------------------------------------------------------------------------
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

app.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  // Resume an existing session
  if (sessionId && sessions.has(sessionId)) {
    transport = sessions.get(sessionId)!;
  }

  // New session — the body must be an MCP initialize request
  else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (newSessionId) => {
        // Store transport so the client can reuse it
        sessions.set(newSessionId, transport);
        console.log(`[MCP] Session created: ${newSessionId}`);
      },
    });

    // Connect the MCP server to this new transport session
    mcpServer.connect(transport).catch((error) => {
      console.error(`[MCP] Failed to connect server to transport for session:`, error);
    });

    // Clean up when the transport closes
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && sessions.has(sid)) {
        sessions.delete(sid);
        console.log(`[MCP] Session closed: ${sid}`);
      }
    };
  }

  // Unknown / stale session
  else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Bad request: no valid session ID and not an initialize request.",
      },
      id: null,
    });
    return;
  }

  // Delegate request handling to the transport
  await transport.handleRequest(req, res, req.body);
});


// ---------------------------------------------------------------------------
// MCP endpoint  — GET /mcp  (SSE stream for server-sent notifications)
// ---------------------------------------------------------------------------
app.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID." });
    console.log("[MCP] Invalid or missing session ID.");
    return;
  }

  console.log(`[MCP] SSE stream opened: ${sessionId}`);
  const transport = sessions.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// ---------------------------------------------------------------------------
// MCP endpoint  — DELETE /mcp  (graceful session termination)
// ---------------------------------------------------------------------------
app.delete(MCP_ENDPOINT, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID." });
    return;
  }

  const transport = sessions.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Start server
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
