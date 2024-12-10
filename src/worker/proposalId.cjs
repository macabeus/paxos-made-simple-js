const { workerData } = require("node:worker_threads");

const { id } = workerData;

const getNextProposalId = (proposalId) => {
  const inc = proposalId.split(":")[1];
  return `${id}:${Number(inc) + 1}`;
};

const proposalIdIsHigherThan = (a, b) => {
  const [workerIdA, rawIncA] = a.split(":");
  const [workerIdB, rawIncB] = b.split(":");

  const incA = Number(rawIncA);
  const incB = Number(rawIncB);

  if (incA > incB) {
    return true;
  }

  if (workerIdA.localeCompare(workerIdB) < 0) {
    return true;
  }

  return false;
};

module.exports = { getNextProposalId, proposalIdIsHigherThan };
