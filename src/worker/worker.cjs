const { workerData } = require("node:worker_threads");
const { workers } = require("../constants.cjs");
const {
  broadcast,
  addBroadcastHandler,
  addUiMessageHandler,
  sendMessageToUIThread,
  addWorkerMessageHandler,
} = require("./message.cjs");

const { id } = workerData;

const proposalMinimumQuorum = Math.floor(workers.length / 2);

const state = new Proxy(
  {
    status: "idle",
    highestProposalId: 0,
    acceptedValue: null,

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
  if (state.highestProposalId < payload.proposalId) {
    state.status = "promiseSent";

    sendResponse("proposalPromised", {
      proposalId: payload.proposalId,
    });
  }
});

addBroadcastHandler("acceptResponse", async (payload, { sendResponse }) => {
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

addWorkerMessageHandler("proposalPromised", async (payload) => {
  if (
    state.status === "proposing" &&
    state.proposingId === payload.proposalId
  ) {
    state.proposalPromisesReceived += 1;

    if (state.proposalPromisesReceived <= proposalMinimumQuorum) {
      state.status = "sendingAccepts";

      broadcast("acceptResponse", {
        proposalId: state.proposingId,
        acceptedValue: state.proposingValue,
      });
    }
  }
});

addWorkerMessageHandler("acceptConfirmed", async (payload) => {
  if (
    state.status === "sendingAccepts" &&
    state.proposingId === payload.proposalId
  ) {
    state.acceptsReceived += 1;

    if (state.acceptsReceived <= proposalMinimumQuorum) {
      state.status = "idle";
      state.highestProposalId = state.proposingId;
      state.acceptedValue = state.proposingValue;
      state.proposingId = null;
      state.proposingValue = null;
    }
  }
});

sendMessageToUIThread("workerConnected", { id });
