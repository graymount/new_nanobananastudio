import postgres from 'postgres';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

dotenvConfig({ path: resolve(__dirname, '../../.env.local') });
dotenvConfig({ path: resolve(__dirname, '../../.env') });

const sql = postgres(process.env.DATABASE_URL || '', { ssl: 'require' });

async function check() {
  const email = process.argv[2] || 'wnfng.liu@gmail.com';

  // 查找老站用户
  const users = await sql`
    SELECT id, email, name FROM public.users WHERE email = ${email}
  `;
  console.log('=== 老站用户 ===');
  console.log(users[0] || 'Not found');

  if (users[0]) {
    const userId = users[0].id;

    // 老站 usage
    const oldUsage = await sql`
      SELECT * FROM public.usage WHERE user_id = ${userId}
    `;
    console.log('\n=== 老站 Usage ===');
    console.log('Plan:', oldUsage[0]?.plan);
    console.log('Quota Left:', oldUsage[0]?.quota_left);
    console.log('Expires At:', oldUsage[0]?.expires_at);

    // 新站用户
    const newUser = await sql`
      SELECT id, email, name FROM nanobananastudio_new."user" WHERE email = ${email}
    `;
    console.log('\n=== 新站用户 ===');
    console.log(newUser[0] || 'Not found');

    if (newUser[0]) {
      const newUserId = newUser[0].id;

      // 新站 credit
      const newCredits = await sql`
        SELECT id, credits, remaining_credits, status, expires_at, description
        FROM nanobananastudio_new.credit
        WHERE user_id = ${newUserId}
        ORDER BY created_at DESC
      `;
      console.log('\n=== 新站 Credit Records ===');
      if (newCredits.length === 0) {
        console.log('No credit records');
      } else {
        newCredits.forEach((c, i) => {
          console.log(`[${i + 1}] Credits: ${c.credits}, Remaining: ${c.remaining_credits}, Status: ${c.status}`);
          console.log(`    Expires: ${c.expires_at}, Desc: ${c.description}`);
        });
      }

      // 计算总余额
      const totalRemaining = newCredits
        .filter((c: any) => c.status === 'active')
        .reduce((sum: number, c: any) => sum + (c.remaining_credits || 0), 0);
      console.log('\n=== 新站总余额 (active) ===');
      console.log('Total Remaining Credits:', totalRemaining);
    }
  }

  await sql.end();
}

check().catch(console.error);
