const { workerData } = require("node:worker_threads");
const {
  broadcast,
  addBroadcastHandler,
  addUiMessageHandler,
  sendMessageToUIThread,
  addWorkerMessageHandler,
} = require("./message.cjs");

const { id, type, initialTotalWorkers } = workerData;

const state = new Proxy(
  {
    status: "idle",
    highestProposalId: 0,
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

  if (state.highestProposalId < payload.proposalId) {
    state.status = "promiseSent";

    sendResponse("proposalPromised", {
      proposalId: payload.proposalId,
    });
  } else {
    sendResponse("overwriteProposer", {
      highestProposalId: state.highestProposalId,
      acceptedValue: state.acceptedValue,
    });
  }
});

addBroadcastHandler("acceptResponse", async (payload, { sendResponse }) => {
  if (state.status === "off") {
    return;
  }

  state.status = "idle";
  state.acceptedValue = payload.acceptedValue;
  state.highestProposalId = payload.proposalId;

  sendResponse("acceptConfirmed", {
    proposalId: payload.proposalId,
  });
});

addUiMessageHandler("propose", async (payload) => {
  state.status = "proposing";
  state.proposalPromisesReceived = 0;
  state.proposingId = state.highestProposalId + 1;
  state.proposingValue = payload.value;

  broadcast("proposingValue", {
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
    state.proposingId === payload.proposalId
  ) {
    state.proposalPromisesReceived += 1;

    if (state.proposalPromisesReceived >= state.minimumQuorum) {
      state.status = "sendingAccepts";

      broadcast("acceptResponse", {
        proposalId: state.proposingId,
        acceptedValue: state.proposingValue,
      });
    }
  }
});

addWorkerMessageHandler("overwriteProposer", (payload) => {
  state.status = "idle";
  state.proposingId = null;
  state.proposingValue = null;
  state.highestProposalId = payload.highestProposalId;
  state.acceptedValue = payload.acceptedValue;
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
