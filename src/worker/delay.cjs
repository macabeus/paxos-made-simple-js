const { workerData } = require("node:worker_threads");
const { defaultWorkers } = require("../constants.cjs");

const { id, type } = workerData;

const delayTime =
  type === "default"
    ? defaultWorkers.find((worker) => worker.id === id).delay
    : 10_000;

const delay = () => new Promise((res) => setTimeout(res, delayTime));

module.exports = { delay };
