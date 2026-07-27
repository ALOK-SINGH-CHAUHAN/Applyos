import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Reload trigger: 2026-07-26 12:08
import * as http from 'http';
import { resumeParseWorker } from './worker';
import { jobProcessWorker } from './jobs.worker';
import { applicationProcessWorker } from './applications.worker';
import { applicationSubmitWorker } from './submissions.worker';
import { comparisonWorker, tailoringWorker } from './comparison.worker';
import { shirOrchestratorWorker } from './shir.worker';
import { coverLetterWorker } from './cover-letter.worker';
import { packageWorker } from './package.worker';
import { verificationWorker } from './verification.worker';
import { prepareOrchestratorParentWorker, submitOrchestratorParentWorker } from './orchestrators.worker';

const WORKER_PORT = process.env.WORKER_PORT || 4001;

// Reference the worker to ensure it is loaded and registered
const activeWorkers = [
  resumeParseWorker,
  jobProcessWorker,
  applicationProcessWorker,
  applicationSubmitWorker,
  comparisonWorker,
  tailoringWorker,
  shirOrchestratorWorker,
  coverLetterWorker,
  packageWorker,
  verificationWorker,
  prepareOrchestratorParentWorker,
  submitOrchestratorParentWorker
];

// Lightweight HTTP Health Check Server for Docker & Monitoring
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        app: 'workers',
        queuesActive: activeWorkers.map((w) => w.name),
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(WORKER_PORT, () => {
  console.log(`[Worker Service] Health server listening on port ${WORKER_PORT}`);
  console.log('[Worker Service] BullMQ Workers initialized and listening to Redis queue events.');
});
