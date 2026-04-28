import express, { Request, Response } from "express";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

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

// Start server
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
