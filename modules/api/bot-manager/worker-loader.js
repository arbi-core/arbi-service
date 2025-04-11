const { workerData, parentPort } = require('worker_threads');
require('dotenv').config();
require('ts-node').register();

const workerModule = require(workerData.scriptPath);
workerModule.startWorker().catch(error => {
  console.error(`Worker initialization error:`, error);
  if (parentPort) {
    parentPort.postMessage({
      type: "error",
      error: error.message
    });
  }
});