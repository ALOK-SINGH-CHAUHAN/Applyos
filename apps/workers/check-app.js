const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    include: {
      job: true,
      coverLetter: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`--- FOUND ${apps.length} APPLICATIONS ---`);
  for (const app of apps) {
    console.log(`Job: ${app.job.title} at ${app.job.company}`);
    console.log(`App ID: ${app.id}`);
    console.log(`Status: ${app.status}`);
    console.log(`Cover Letter ID: ${app.coverLetterId}`);
    console.log(`Cover Letter Text: ${app.coverLetter ? (app.coverLetter.content ? app.coverLetter.content.substring(0, 100) + '...' : 'EMPTY CONTENT') : 'NONE'}`);
    console.log('-----------------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
