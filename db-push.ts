import { db } from './server/db';
import { migrate } from "drizzle-orm/postgres/migrator";

// Push the schema to the database
async function main() {
  console.log('Pushing schema to the database...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Schema pushed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error pushing schema:', err);
  process.exit(1);
});