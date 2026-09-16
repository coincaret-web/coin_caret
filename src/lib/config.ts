import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@127.0.0.1:5433/coin_caret_test?schema=public"),
  PORT: z.coerce.number().default(3847),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(16).default("coin_caret_development_nextauth_secret_key_3847_mainnet"),
  NEXTAUTH_URL: z.string().url().default("http://127.0.0.1:3847"),
  BLOCK_INTERVAL_MS: z.coerce.number().default(10000),
  STANDARD_FEE_CC: z.coerce.number().default(0.50),
  REQUIRED_CONFIRMATIONS: z.coerce.number().default(3),
  HOST: z.string().default("127.0.0.1"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "coin_caret_development_nextauth_secret_key_3847_mainnet",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://127.0.0.1:3847",
  BLOCK_INTERVAL_MS: process.env.BLOCK_INTERVAL_MS,
  STANDARD_FEE_CC: process.env.STANDARD_FEE_CC,
  REQUIRED_CONFIRMATIONS: process.env.REQUIRED_CONFIRMATIONS,
  HOST: process.env.HOST ?? "127.0.0.1",
});
