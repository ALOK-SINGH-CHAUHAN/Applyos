/**
 * prisma/seed.ts
 * Seed the database with a default workspace and one user per role for RBAC testing.
 *
 * Run: npx ts-node -P tsconfig.seed.json prisma/seed.ts
 * Or add "prisma": { "seed": "ts-node prisma/seed.ts" } to root package.json and run `prisma db seed`.
 */
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // ── 1. Workspace ──────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { id: 'ws-default-seed' },
    create: {
      id: 'ws-default-seed',
      name: 'AutoApply HQ',
      plan: 'pro',
    },
    update: { name: 'AutoApply HQ' },
  });
  console.log(`  ✓  Workspace: ${workspace.name} (${workspace.id})`);

  // ── 2. Users (one per role) ───────────────────────────────────────────────
  const seedUsers: Array<{ id: string; name: string; email: string; role: Role }> = [
    {
      id: 'user-owner-seed',
      name: 'Owner User',
      email: 'owner@autoapply.ai',
      role: Role.OWNER,
    },
    {
      id: 'user-admin-seed',
      name: 'Admin User',
      email: 'admin@autoapply.ai',
      role: Role.ADMIN,
    },
    {
      id: 'user-operator-seed',
      name: 'Operator User',
      email: 'operator@autoapply.ai',
      role: Role.OPERATOR,
    },
    {
      id: 'user-viewer-seed',
      name: 'Viewer User',
      email: 'viewer@autoapply.ai',
      role: Role.VIEWER,
    },
  ];

  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        workspaceId: workspace.id,
      },
      update: { role: u.role, name: u.name },
    });
    console.log(`  ✓  User [${user.role}]: ${user.name} <${user.email}> (${user.id})`);
  }

  console.log('\n✅  Seed complete.\n');
  console.log('Auth tokens you can use in the x-user-id / Authorization header:');
  console.log('  owner    →  owner@autoapply.ai  |  ID: user-owner-seed');
  console.log('  admin    →  admin@autoapply.ai   |  ID: user-admin-seed');
  console.log('  operator →  operator@autoapply.ai|  ID: user-operator-seed');
  console.log('  viewer   →  viewer@autoapply.ai  |  ID: user-viewer-seed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
