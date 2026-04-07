import { PDFParse } from "pdf-parse";
import fs from "fs-extra";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  const data = new Uint8Array(buf);
  const parser = new PDFParse(data);
  const result = await parser.getText();
  return result.text;
}
