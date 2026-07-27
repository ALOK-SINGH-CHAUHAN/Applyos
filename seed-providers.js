const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const providers = [
    { name: 'greenhouse', supportsAuth: true },
    { name: 'lever', supportsAuth: true },
    { name: 'ashby', supportsAuth: true },
    { name: 'remoteok', supportsAuth: false },
    { name: 'company_careers', supportsAuth: false }
  ];

  for (const p of providers) {
    await prisma.jobProviderConfiguration.upsert({
      where: { providerName: p.name },
      update: { enabled: true, credentialsJson: {} },
      create: {
        providerName: p.name,
        enabled: true,
        credentialsJson: {},
        boardsSynced: 0,
        jobsImported: 0
      }
    });
    console.log(`Enabled JobProviderConfiguration for: ${p.name}`);
  }
}

seed().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
