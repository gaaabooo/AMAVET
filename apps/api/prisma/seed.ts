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
  const password = 'Admin1234!';

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) {
    console.log('Admin ya existe:', email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      nombre: 'Administrador',
      email,
      telefono: '+56900000000',
      password: hash,
      rol: 'ADMIN',
    },
  });

  console.log('✓ Admin creado:', email, '/', password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
