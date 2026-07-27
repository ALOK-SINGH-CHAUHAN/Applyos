const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const queues = [
  'resume-parse',
  'job-process',
  'comparison-process',
  'tailoring-process',
  'cover-letter-process',
  'package-process',
  'application-submit',
  'shir-orchestrator',
];

async function main() {
  console.log('--- BULLMQ QUEUE STATUS ---');
  for (const name of queues) {
    const q = new Queue(name, { connection });
    const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    console.log(`Queue [${name}]:`);
    console.log(`  Waiting:   ${counts.waiting}`);
    console.log(`  Active:    ${counts.active}`);
    console.log(`  Completed: ${counts.completed}`);
    console.log(`  Failed:    ${counts.failed}`);
    console.log(`  Delayed:   ${counts.delayed}`);
  }
}

main().catch(console.error).then(() => process.exit(0));
