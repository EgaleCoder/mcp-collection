import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStudentInfoTool } from "./getStudentInfo.js";

export function registerAllTools(server: McpServer) {
  registerGetStudentInfoTool(server);
}
