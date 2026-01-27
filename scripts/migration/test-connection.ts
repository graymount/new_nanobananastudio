import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

dotenvConfig({ path: resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL!;
console.log('Testing with different SSL settings...');

async function testConnection(sslMode: boolean | 'require' | 'prefer') {
  console.log(`\nTesting with ssl=${sslMode}...`);

  const sql = postgres(dbUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
    ssl: sslMode,
  });

  try {
    const testResult = await sql`SELECT 1 as test`;
    console.log('SUCCESS!');

    // List tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('Tables:', tables.map(t => t.table_name).join(', '));

    await sql.end();
    return true;
  } catch (e: any) {
    console.log('Failed:', e.message);
    await sql.end().catch(() => {});
    return false;
  }
}

async function main() {
  // Try different SSL modes
  const modes: Array<boolean | 'require' | 'prefer'> = ['require', 'prefer', true, false];

  for (const mode of modes) {
    const success = await testConnection(mode);
    if (success) {
      console.log(`\nWorking SSL mode: ${mode}`);
      process.exit(0);
    }
  }

  console.log('\nAll modes failed');
  process.exit(1);
}

main();
