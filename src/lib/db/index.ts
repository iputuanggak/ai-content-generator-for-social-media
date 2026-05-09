import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// DATABASE_URL may not be set at build time; use a dummy URL so the module
// can be imported without throwing. Actual queries will fail at runtime if
// the env var is absent, which is acceptable.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://user:pass@localhost/db";
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
