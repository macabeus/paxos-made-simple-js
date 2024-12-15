const { workerData } = require("node:worker_threads");

const { delay: delayTime } = workerData;

const delay = () => new Promise((res) => setTimeout(res, delayTime));

module.exports = { delay };
