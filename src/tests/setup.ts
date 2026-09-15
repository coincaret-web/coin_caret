import "@testing-library/jest-dom";
import dotenv from "dotenv";
import path from "path";

// Load test environment explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
