# PDF Context Provider (DataVault MCP Server)

## Overview
PDF Context Provider is a Model Context Protocol (MCP) server that reads local PDF files and exposes their contents through an MCP tool. It is designed to allow AI agents or MCP-compatible clients to query information stored inside PDF documents.

The server scans a folder containing PDF files, extracts text from each file, and returns the extracted content so that an AI system can answer questions about the data.

This implementation is named **DataVault** and runs using Node.js with the MCP SDK.

---

## Features

- MCP-compatible server using `@modelcontextprotocol/sdk`
- Reads multiple PDF files from a local directory
- Extracts text using `pdf-parse`
- Provides a tool called `getStudentInfo`
- Supports optional custom data source folder
- Returns extracted PDF text as structured JSON

---

## Project Structure

```
pdf-context-provider
│
├── src/
│   └── index.ts        # MCP server implementation
│
├── utils/
│   └── Helper.ts       # PDF text extraction helper
│
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md
```

---

## How It Works

1. The MCP server starts using **stdio transport**.
2. A tool named `getStudentInfo` is registered.
3. The tool reads all `.pdf` files from a configured directory.
4. Each PDF file is parsed and its text extracted.
5. The extracted data is returned as JSON.

---

## Tool: getStudentInfo

### Description
Reads PDF files locally and returns their extracted text content.

### Input

- `query` (string)
  - A natural language question about the student data.

- `folderPath` (optional string)
  - Absolute path to the directory containing PDF files.
  - If not provided, the server uses the default path.

### Default Data Source

```
E:\\DataSource
```

The server will read all PDF files from this directory if no custom folder path is provided.

---

## Installation

Install dependencies:

```
npm install
```

---

## Running the Server

Development mode:

```
npm start
```

Build TypeScript:

```
npm run build
```

---

## Example Response

The tool returns a JSON response similar to:

```
{
  "success": true,
  "userQuery": "Names of 3rd year CSE students",
  "totalFiles": 5,
  "students": [
    {
      "source": "student1.pdf",
      "data": "Extracted text from PDF..."
    }
  ]
}
```

---

## Dependencies

Main libraries used:

- `@modelcontextprotocol/sdk`
- `pdf-parse`
- `fs-extra`
- `zod`

---

## Use Cases

- Student information lookup
- Document knowledge extraction
- Local PDF knowledge base
- AI-powered document search

---

## Notes

- Only `.pdf` files are processed.
- The folder path must be an absolute path.
- Ensure the PDF files are readable and not encrypted.

---

## Future Improvements

- Semantic search across PDFs
- Vector embeddings for faster retrieval
- Metadata extraction
- Pagination and chunking
