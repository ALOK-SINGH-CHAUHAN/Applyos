import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { ApplicationsService } from './apps/api/src/applications/applications.service';
import { OrchestrationService } from './apps/api/src/applications/orchestration.service';

async function run() {
  const prisma = new PrismaClient();
  const orchestration = new OrchestrationService(prisma as any);
  const service = new ApplicationsService(prisma as any, orchestration);
  
  const id = 'a3531a68-5754-4339-a29b-8a4a71f07baa'; // An existing application ID
  await prisma.application.update({ where: { id }, data: { status: 'TAILORING' } });
  
  try {
    const res = await service.getApplicationProgress(id);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

run().catch(console.error).finally(() => process.exit(0));
