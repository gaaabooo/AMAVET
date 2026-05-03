import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const email = 'admin@amavet.cl';
  const nuevaPassword = 'Admin1234!';

  const hash = await bcrypt.hash(nuevaPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hash, rol: 'ADMIN' },
  });

  console.log('✓ Contraseña actualizada para:', email);
  console.log('  Nueva contraseña:', nuevaPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
