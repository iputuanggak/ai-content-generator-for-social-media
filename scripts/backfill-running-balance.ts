import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(connectionString);

async function backfillRunningBalances() {
  console.log("Fetching organizations with credit transactions...");

  const orgs = await sql`
    SELECT DISTINCT organization_id FROM credit_transaction
  `;

  if (orgs.length === 0) {
    console.log("No organizations with transactions found. Done.");
    return;
  }

  console.log(`Found ${orgs.length} organization(s).`);

  for (const org of orgs) {
    const orgId = org.organization_id as string;

    const rows = await sql`
      SELECT id, amount FROM credit_transaction
      WHERE organization_id = ${orgId}
      ORDER BY created_at ASC
    `;

    console.log(`  Org ${orgId}: ${rows.length} transaction(s)`);

    let running = 0;

    for (const row of rows) {
      const balanceBefore = running;
      const balanceAfter = running + (row.amount as number);
      running = balanceAfter;

      await sql`
        UPDATE credit_transaction
        SET balance_before = ${balanceBefore}, balance_after = ${balanceAfter}
        WHERE id = ${row.id}
      `;
    }

    console.log(`  Org ${orgId}: backfill complete, final balance = ${running}`);
  }

  console.log("Backfill complete.");
}

backfillRunningBalances().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
