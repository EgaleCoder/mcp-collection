import express, { Request, Response } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 3030);
const MCP_ENDPOINT = "/mcp"; // Standard MCP endpoint path

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// protocol, host, and client IP from X-Forwarded-* headers.
app.set("trust proxy", 1);

// Parse JSON bodies — required so transport can read the MCP request payload
app.use(express.json());

// ---------------------------------------------------------------------------
// CORS — allow all origins so MCP clients / tunnels can connect freely.
// ---------------------------------------------------------------------------
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

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// ---------------------------------------------------------------------------
// Session store (stateful mode)
// ---------------------------------------------------------------------------
// Maps sessionId → transport so subsequent requests hit the same transport.
const sessions = new Map<string, StreamableHTTPServerTransport>();

// ---------------------------------------------------------------------------
// MCP endpoint  — POST /mcp
// ---------------------------------------------------------------------------
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
        // console.log(`[MCP] Session created: ${newSessionId}`);
      },
    });

    // Clean up when the transport closes
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && sessions.has(sid)) {
        sessions.delete(sid);
        console.log(`[MCP] Session closed: ${sid}`);
      }
    };

    // Wire a fresh McpServer to this transport
    const server = createMcpServer();
    await server.connect(transport);
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
    // console.log("[MCP] Invalid or missing session ID.");
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

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "evn-mart-mcp",
    version: "2.0.1",
    activeSessions: sessions.size,
    mcpEndpoint: `POST/GET/DELETE ${MCP_ENDPOINT}`,
  });
});

// ---------------------------------------------------------------------------
// Root — helpful info for anyone hitting the base URL
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    name: "EVN-Mart MCP Server",
    version: "2.0.1",
    endpoints: {
      health: "/health",
      mcp: MCP_ENDPOINT,
    },
    usage: `Connect your MCP client to POST ${MCP_ENDPOINT}`,
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n EVN-Mart MCP Server running`);
  console.log(`   Health : http://localhost:${PORT}/health`);
  console.log(`   MCP    : http://localhost:${PORT}${MCP_ENDPOINT}`);
});
