ALTER TABLE "credit_transaction" DROP CONSTRAINT "credit_transaction_batch_id_credit_batch_id_fk";
--> statement-breakpoint
ALTER TABLE "credit_transaction" ALTER COLUMN "balance_before" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transaction" ALTER COLUMN "balance_after" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transaction" DROP COLUMN "batch_id";