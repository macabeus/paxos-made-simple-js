const { workerData } = require("node:worker_threads");
const {
  broadcast,
  addBroadcastHandler,
  addUiMessageHandler,
  sendMessageToUIThread,
  addWorkerMessageHandler,
} = require("./message.cjs");
const {
  getNextProposalId,
  proposalIdIsHigherThan,
} = require("./proposalId.cjs");

const { id, type, initialTotalWorkers } = workerData;

const state = new Proxy(
  {
    status: "idle",
    highestProposalId: `${id}:0`,
    acceptedValue: null,
    minimumQuorum: 0,

    proposingId: null,
    proposingValue: null,
    proposalPromisesReceived: 0,

    acceptsReceived: 0,
  },
  {
    set(obj, prop, value) {
      sendMessageToUIThread("workerStateChanged", { id, prop, value });

      obj[prop] = value;

      return true;
    },
  }
);

addBroadcastHandler("proposingValue", async (payload, { sendResponse }) => {
  if (state.status === "off") {
    return;
  }

  // if the proposed id is lower than the current one, the proposer might be outdated and needs to be updated with the latest status
  const proposedIdIsHigher = proposalIdIsHigherThan(
    payload.proposalId,
    state.highestProposalId
  );
  if (!proposedIdIsHigher) {
    sendResponse("overwriteProposer", {
      proposerId: id,
      highestProposalId: state.highestProposalId,
      acceptedValue: state.acceptedValue,
    });

    return;
  }

  // if this worker is proposing...
  if (state.status === "proposing" || state.status === "sendingAccepts") {
    const proposerWorker = payload.proposerId.split(":")[0];
    const myIdIsHigherThanTheNewProposal = id.localeCompare(proposerWorker) < 0;

    // ...and my priority is higher...
    if (myIdIsHigherThanTheNewProposal) {
      // ...then the proposer need to be overthrown
      sendResponse("overwriteProposer", {
        proposerId: payload.proposerId,
        highestProposalId: state.proposingId,
        acceptedValue: state.proposingValue,
      });

      return;
    } else {
      // Otherwise, this worker should follow this proposal
      state.proposingValue = payload.proposalValue;
    }
  }

  //
  state.status = "promiseSent";
  state.highestProposalId = payload.proposalId;

  sendResponse("proposalPromised", {
    proposalId: payload.proposalId,
    proposalValue: payload.proposalValue,
  });
});

addBroadcastHandler("acceptResponse", async (payload, { sendResponse }) => {
  if (state.status === "off") {
    return;
  }

  if (
    (state.status === "proposing" || state.status === "sendingAccepts") &&
    state.proposingId === payload.proposalId &&
    id.localeCompare(payload.proposerId) < 0
  ) {
    return;
  }

  state.status = "idle";
  state.acceptedValue = payload.acceptedValue;
  state.proposingId = null;
  state.proposingValue = null;

  sendResponse("acceptConfirmed", {
    proposalId: payload.proposalId,
  });
});

addUiMessageHandler("propose", async (payload) => {
  state.status = "proposing";
  state.proposalPromisesReceived = 0;
  state.acceptsReceived = 0;
  state.proposingId = getNextProposalId(state.highestProposalId);
  state.proposingValue = payload.value;

  broadcast("proposingValue", {
    proposerId: id,
    proposalId: state.proposingId,
    proposalValue: state.proposingValue,
  });
});

addUiMessageHandler("off", async () => {
  state.status = "off";
});

addUiMessageHandler("on", async () => {
  state.status = "idle";
});

addWorkerMessageHandler("proposalPromised", async (payload) => {
  if (
    state.status === "proposing" &&
    state.proposingId === payload.proposalId &&
    state.proposingValue === payload.proposalValue
  ) {
    state.proposalPromisesReceived += 1;

    if (state.proposalPromisesReceived >= state.minimumQuorum) {
      state.status = "sendingAccepts";

      broadcast("acceptResponse", {
        proposerId: id,
        proposalId: state.proposingId,
        acceptedValue: state.proposingValue,
      });
    }
  }
});

addWorkerMessageHandler("overwriteProposer", (payload) => {
  if (state.proposalPromisesReceived > 0) {
    state.status = "proposing";
    state.proposingId = payload.highestProposalId;
    state.proposingValue = payload.acceptedValue;

    broadcast("proposingValue", {
      proposerId: payload.proposerId,
      proposalId: payload.highestProposalId,
      proposalValue: payload.acceptedValue,
    });
  } else {
    state.status = "idle";
    state.acceptedValue = payload.acceptedValue;
    state.highestProposalId = payload.highestProposalId;
    state.proposingId = null;
    state.proposingValue = null;
  }
});

addWorkerMessageHandler("acceptConfirmed", async (payload) => {
  if (
    state.status === "sendingAccepts" &&
    state.proposingId === payload.proposalId
  ) {
    state.acceptsReceived += 1;

    if (state.acceptsReceived >= state.minimumQuorum) {
      state.status = "idle";
      state.highestProposalId = state.proposingId;
      state.acceptedValue = state.proposingValue;
      state.proposingId = null;
      state.proposingValue = null;
    }
  }
});

sendMessageToUIThread("workerConnected", { id });

// count minimum quorum
let totalWorkers = initialTotalWorkers;

addBroadcastHandler("newWorker", () => {
  totalWorkers += 1;
  state.minimumQuorum = Math.floor(totalWorkers / 2);
});

state.minimumQuorum = Math.floor(totalWorkers / 2);

// if this worker was created by the user, we need to announce it to the other workers
if (type === "custom") {
  broadcast("newWorker", {});
}
