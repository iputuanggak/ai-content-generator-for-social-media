import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(connectionString);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function backfillSlugs() {
  console.log("Fetching organizations with NULL slug...");
  const orgs = await sql`
    SELECT id, name FROM organization WHERE slug IS NULL
  `;

  if (orgs.length === 0) {
    console.log("No organizations need slug backfill. Done.");
    return;
  }

  console.log(`Found ${orgs.length} organization(s) without slugs.`);

  const existing = await sql`SELECT slug FROM organization WHERE slug IS NOT NULL`;
  const usedSlugs = new Set(
    existing.map((r: Record<string, unknown>) => r.slug as string)
  );

  for (const org of orgs) {
    const baseSlug = generateSlug(org.name);
    let slug = baseSlug;

    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }

    await sql`UPDATE organization SET slug = ${slug} WHERE id = ${org.id}`;
    usedSlugs.add(slug);
    console.log(`  Org "${org.name}" → slug "${slug}"`);
  }

  console.log("Backfill complete.");
}

backfillSlugs().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
