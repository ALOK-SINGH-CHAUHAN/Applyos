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
  console.log('--- DRAINING BULLMQ QUEUES ---');
  for (const name of queues) {
    const q = new Queue(name, { connection });
    await q.obliterate({ force: true });
    console.log(`Queue [${name}] successfully obliterated.`);
  }
  console.log('All queues drained. Clean slate!');
}

main().catch(console.error).then(() => process.exit(0));
