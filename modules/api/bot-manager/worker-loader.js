const { workerData, parentPort } = require('worker_threads');
// Load environment variables from .env file
require('dotenv').config();
require('ts-node').register();
require(workerData.scriptPath);