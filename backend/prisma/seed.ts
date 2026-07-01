/**
 * Script de seed para crear el primer usuario administrador.
 * Uso: npm run seed
 *
 * Variables de entorno requeridas:
 *   SEED_ADMIN_EMAIL    (default: admin@wot.com)
 *   SEED_ADMIN_PASSWORD (default: Admin123!)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin(email: string, passwordPlainText: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  El usuario "${email}" ya existe. No se creó uno nuevo.`);
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordPlainText, saltRounds);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'admin',
    },
    select: { id: true, email: true, role: true },
  });

  console.log('✅ Usuario administrador creado:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol:   ${user.role}`);
  console.log(`   ID:    ${user.id}`);
}

async function main() {
  // 1. Usuario configurado por entorno o valor por defecto
  const envEmail = process.env.SEED_ADMIN_EMAIL || 'admin@wot.com';
  const envPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  await createAdmin(envEmail, envPassword);

  // 2. Usuario administrador oficial WOT Energy
  const wotEmail = 'Wotenergyapp@gmail.com';
  const wotPassword = '1Wot2Energy2026*';
  await createAdmin(wotEmail, wotPassword);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
