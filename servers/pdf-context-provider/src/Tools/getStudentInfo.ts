import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { extractTextFromPDF } from "../utils/Helper.js";
import fs from "fs-extra";
import path from "path";

// Default path for student PDF data source
const DefaultDataSourcePath = "E:\\DataSource";

export function registerGetStudentInfoTool(server: McpServer) {
  server.registerTool(
    "getStudentInfo",
    {
      description: `Reads PDF files locally to answer questions about students. Detaults to ${DefaultDataSourcePath} if folderPath is not provided.`,
      inputSchema: {
        query: z
          .string()
          .describe(
            "The specific question about students (e.g., 'Names of 3rd year CSE students')",
          ),
        folderPath: z
          .string()
          .optional()
          .describe(
            "Optional absolute path to the directory containing student PDFs. If provided, the tool reads PDFs from here.",
          ),
      },
    },
    async ({ query, folderPath }: any) => {
      try {
        const activePath = folderPath || DefaultDataSourcePath;
        const exists = await fs.pathExists(activePath);
        if (!exists) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  message: `Data source folder not found at path: ${activePath}`,
                }),
              },
            ],
          };
        }

        const filesDir = await fs.readdir(activePath);
        const pdfFiles = filesDir.filter(
          (file: any) => path.extname(file).toLowerCase() === ".pdf",
        );

        if (pdfFiles.length === 0 || !activePath) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  message: "No PDF files found in the data source folder",
                }),
              },
            ],
          };
        }

        // Use Promise.all() to read them all in parallel:
        const students = await Promise.all(
          pdfFiles.map(async (file) => {
            console.error(`[Reading file]: ${file} from ${activePath}`);
            const text = await extractTextFromPDF(path.join(activePath, file));
            return {
              source: file,
              data: text,
            };
          }),
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                userQuery: query,
                totalFiles: students.length,
                students,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("Error reading PDF files:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "Error reading PDF files",
              }),
            },
          ],
        };
      }
    },
  );
}
