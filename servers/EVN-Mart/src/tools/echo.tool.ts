import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the "echo" test tool on the given MCP server instance.
 *
 * The tool accepts a message and optionally repeats it N times,
 * making it perfect for verifying that the server is reachable and
 * that tool invocation round-trips are working correctly.
 */
export function registerEchoTool(server: McpServer): void {
  server.registerTool(
    "echo",
    {
      description:
        "A simple test tool that echoes back a message. Use it to verify the MCP server is running correctly.",
      inputSchema: {
        message: z.string().describe("The message to echo back"),
        repeat: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .default(1)
          .describe("How many times to repeat the message (1-10, default: 1)"),
        uppercase: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether to return the message in uppercase"),
      },
    },
    async ({ message, repeat, uppercase }) => {
      let output = uppercase ? message.toUpperCase() : message;
      const lines = Array(repeat).fill(output).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `🔁 Echo Result (×${repeat}):\n\n${lines}`,
          },
        ],
      };
    },
  );
}
