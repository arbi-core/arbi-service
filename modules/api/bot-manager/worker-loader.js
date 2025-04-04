const { workerData, parentPort } = require('worker_threads');
require('ts-node').register();
require(workerData.scriptPath);