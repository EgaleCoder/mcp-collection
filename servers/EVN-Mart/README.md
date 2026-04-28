# EVN-Mart MCP Server

A powerful semantic clothing search engine powered by **LanceDB**, **LangChain**, and local embeddings. This MCP (Model Context Protocol) server enables intelligent product search and retrieval for the EVN-Mart clothing catalog.

## 🎯 Project Overview

**EVN-Mart MCP Server** is a sophisticated backend service built for the **EVN Ecommerce Platform (UK-based)** that enables LLM-powered data analysis and intelligent product discovery. This server acts as a bridge between Large Language Models and ecommerce data, allowing end users to interact with product catalogs using natural language queries without any risk of personal data exposure.

The server implements the Model Context Protocol (MCP), which ensures that LLMs receive sanitized, context-aware responses generated from ecommerce data. All queries are processed through specialized tools that analyze and search data according to user intent, returning polished and accurate results directly to end users through the LLM.

### Key Features

- **NLP-Powered Search**: Find clothing items using natural language descriptions - users can query in plain English
- **LLM Integration**: Seamlessly integrates with Large Language Models via MCP protocol for intelligent conversational search
- **Data Analysis Tools**: Specialized tools that analyze and extract insights from ecommerce data
- **Isolated & Secure**: Completely isolated architecture - no direct database access from LLM, ensuring zero risk of personal data leaks
- **Vector Database**: Powered by LanceDB for efficient semantic similarity search
- **Local Embeddings**: Uses HuggingFace transformers for generating embeddings locally (no external API calls required)
- **Product Details**: Retrieve comprehensive information about specific products with accuracy
- **RESTful API**: Express-based HTTP server with MCP protocol support
- **CORS Enabled**: Ready for cross-origin requests and external integrations
- **Scalable Architecture**: Works seamlessly with dummy data during development and real production data in deployment
- **Built with TypeScript**: Modern Node.js best practices for type safety and reliability

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Vector Database**: LanceDB
- **AI/ML**: LangChain + HuggingFace Transformers
- **Protocol**: Model Context Protocol (MCP) for LLM integration
- **Data Format**: Apache Arrow for efficient data handling
- **Security**: Isolated architecture with zero direct LLM-to-database access

## 🔒 Security & Data Privacy

This server implements a **secure, isolated architecture** designed to protect sensitive ecommerce data:

- **MCP Protocol Layer**: Acts as a controlled gateway between LLMs and ecommerce data
- **Context-Based Responses**: Only processed, context-aware data is returned - never raw database records
- **No Direct Data Access**: LLMs cannot directly query or access the underlying data - all requests go through validated tools
- **Sanitized Output**: All responses are polished and curated by MCP tools before reaching the LLM
- **Dummy Data Support**: Fully functional with dummy data during development, seamlessly transitions to real production data
- **Zero Personal Data Leaks**: The isolated tool-based architecture ensures complete separation between data and LLM access

## 📸 Outcomes & Screenshots

*Screenshots demonstrating the search functionality, product results, and API responses will be added here.*

- Search Results UI
- Product Details Display
- API Response Examples
- Admin Dashboard

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- **TypeScript** knowledge (optional, but helpful)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mcp-collection.git
cd mcp-collection/servers/EVN-Mart
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- MCP SDK
- LanceDB and dependencies
- LangChain
- Express.js
- TypeScript and dev tools

#### 3. Data Ingestion (Optional)

To load the clothing dataset into the vector database:

```bash
npm run ingest
```

This command:
- Reads the clothing data from the data source
- Generates embeddings for each product
- Stores the embeddings in LanceDB
- Creates searchable vector indices

### 🏃 Running the Server

#### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start with TypeScript watch mode. Changes to source files will automatically reload the server.

#### Production Mode

```bash
npm start
```

The server will run once and continue listening for requests.

#### Build for Production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

#### Serve Built Files

```bash
npm run serve
```

Runs the compiled JavaScript directly (requires `npm run build` first).

### 📋 Configuration

The server can be configured via environment variables:

```bash
# Set the port (default: 3030)
PORT=3000 npm start

# MCP Endpoint
MCP_ENDPOINT=/mcp  # Default endpoint for MCP requests
```

#### Default Settings

- **Port**: 3030
- **MCP Endpoint**: `/mcp`
- **CORS**: Enabled for all origins
- **Proxy**: Enabled (trusts X-Forwarded-* headers)

## 🔧 Available Tools

The server provides the following MCP tools:

### 1. Search Clothes
- **Purpose**: Search for clothing items using semantic/natural language queries
- **Input**: Product description or search query
- **Output**: List of matching products with similarity scores

**Example:**
```
Input: "blue cotton t-shirt with logo"
Output: [
  { product_no: "P001", name: "Blue Logo Tee", category: "T-Shirts", score: 0.95 },
  { product_no: "P002", name: "Navy Cotton Top", category: "Tops", score: 0.87 }
]
```

### 2. Get Product Details
- **Purpose**: Retrieve comprehensive information about a specific product
- **Input**: Product number/ID
- **Output**: Complete product metadata (price, size, color, material, etc.)

**Example:**
```
Input: "P001"
Output: {
  product_no: "P001",
  name: "Blue Logo Tee",
  category: "T-Shirts",
  price: 29.99,
  sizes: ["S", "M", "L", "XL"],
  colors: ["Blue", "White"],
  material: "100% Cotton",
  description: "Comfortable cotton t-shirt with embroidered logo"
}
```

### 3. Echo Tool
- **Purpose**: Test server connectivity and MCP protocol
- **Input**: Any message
- **Output**: Echo response with message details

## 📁 Project Structure

```
EVN-Mart/
├── src/
│   ├── main.ts              # Express app entry point
│   ├── server.ts            # MCP server factory
│   ├── tools/
│   │   ├── index.ts         # Tool registration
│   │   ├── searchClothes.tool.ts
│   │   ├── getProductDetails.tool.ts
│   │   └── echo.tool.ts
│   ├── lib/
│   │   ├── embeddings.ts    # Embedding generation
│   │   ├── lancerDB-Client.ts
│   │   └── vectorStore.ts
│   ├── ingestion/
│   │   └── loadData.ts      # Data loading script
│   └── type/
│       └── columns.ts       # TypeScript type definitions
├── data/
│   └── lancedb/             # Vector database storage
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 API Endpoints

### Health Check
```
GET http://localhost:3030/
```

### MCP Protocol Endpoint
```
POST http://localhost:3030/mcp
```

All MCP tool calls go through this endpoint with proper headers and session management.

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the server in production mode |
| `npm run dev` | Run with auto-reload during development |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run serve` | Run compiled JavaScript |
| `npm run ingest` | Load and index clothing data |

## 🔌 MCP Protocol Support

This server implements the Model Context Protocol, making it compatible with:
- Claude and other LLMs
- MCP client libraries
- AI assistants and agents
- Custom integrations

### Session Management

The server maintains stateful sessions to handle multi-message conversations. Each session is identified by `mcp-session-id` header.

## 🚨 Troubleshooting

### Port Already in Use
```bash
PORT=3001 npm start
```

### Data Not Found
Ensure you've run the ingestion script:
```bash
npm run ingest
```

### Module Not Found Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Guidelines

### Adding a New Tool

1. Create a new file in `src/tools/`:
   ```typescript
   // src/tools/myTool.tool.ts
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

   export function registerMyTool(server: McpServer): void {
     server.tool("my_tool", { /* tool definition */ }, async (args) => {
       // Tool implementation
     });
   }
   ```

2. Register in `src/tools/index.ts`:
   ```typescript
   import { registerMyTool } from "./myTool.tool.js";
   
   export function registerAllTools(server: McpServer): void {
     // ... existing tools ...
     registerMyTool(server);
   }
   ```

### Type Safety

All tool inputs and outputs should be properly typed using Zod for runtime validation.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👤 Author

Created by **EgaleCoder**

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the MCP Protocol specification

---

**Version**: 2.0.0  
**Last Updated**: April 2026
