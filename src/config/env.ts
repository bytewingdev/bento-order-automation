import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  TZ: z.string().default("Asia/Tokyo"),

  ORDER_EXECUTE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  TARGET_SITE_URL: z.string().url(),

  OBENTO_COMPANY_CODE: z.string().min(1),
  OBENTO_USER_ID: z.string().min(1),
  OBENTO_PASSWORD: z.string().min(1),

  MAIL_FROM: z.string().email(),
  MAIL_TO: z.string().email(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),

  GCS_BUCKET_NAME: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;