const { workerData } = require("node:worker_threads");
const { workers } = require("../constants.cjs");

const { id } = workerData;

const delayTime = workers.find((worker) => worker.id === id).delay;
const delay = () => new Promise((res) => setTimeout(res, delayTime));

module.exports = { delay };
