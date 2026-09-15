import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3847),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url(),
  BLOCK_INTERVAL_MS: z.coerce.number().default(10000),
  STANDARD_FEE_CC: z.coerce.number().default(0.50),
  REQUIRED_CONFIRMATIONS: z.coerce.number().default(3),
  HOST: z.string().default("127.0.0.1"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  BLOCK_INTERVAL_MS: process.env.BLOCK_INTERVAL_MS,
  STANDARD_FEE_CC: process.env.STANDARD_FEE_CC,
  REQUIRED_CONFIRMATIONS: process.env.REQUIRED_CONFIRMATIONS,
  HOST: process.env.HOST ?? "127.0.0.1",
});
