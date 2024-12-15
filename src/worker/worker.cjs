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
  proposalIdHasSameIndex,
} = require("./proposalId.cjs");

const { id, type, initialTotalWorkers } = workerData;

const state = new Proxy(
  {
    status: "idle",
    acceptedValue: null,
    minimumQuorum: 0,

    highestAcceptedId: `${id}:0`,
    highestPromiseId: null,

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

  // if the proposed value is the same of the current one, accept anyway
  if (state.acceptedValue === payload.proposalValue) {
    state.status = "promiseSent";
    state.highestPromiseId = payload.proposalId;

    sendResponse("proposalPromised", {
      proposalId: payload.proposalId,
      proposalValue: payload.proposalValue,
    });

    return;
  }

  // if the proposed id is lower than the current one, or the proposed index is the same as the approved one,
  // then the proposer might be outdated and needs to be updated with the latest status
  const idLowerThanAccepted =
    !proposalIdIsHigherThan(payload.proposalId, state.highestAcceptedId) ||
    proposalIdHasSameIndex(payload.proposalId, state.highestAcceptedId);
  if (idLowerThanAccepted) {
    sendResponse("overwriteProposer", {
      proposerId: id,
      highestProposalId: state.highestAcceptedId,
      acceptedValue: state.acceptedValue,
    });

    return;
  }

  // if the proposed id is lower than the promised one,
  // then the proposer might be outdated and needs to be updated with the latest status
  const idLowerThanPromised =
    payload.highestPromiseId &&
    !proposalIdIsHigherThan(payload.proposalId, state.highestPromiseId);
  if (idLowerThanPromised) {
    sendResponse("overwriteProposer", {
      proposerId: id,
      highestProposalId: state.highestPromiseId,
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
      // ...then the proposer need to be overthrown...
      sendResponse("overwriteProposer", {
        proposerId: payload.proposerId,
        highestProposalId: state.proposingId,
        acceptedValue: state.proposingValue,
      });

      // ...and it counts as a promise received
      state.proposalPromisesReceived += 1;

      sendAcceptsIfNeeded();

      return;
    } else {
      // Otherwise, this worker should follow this proposal
      state.proposingValue = payload.proposalValue;
    }
  }

  // accept the proposal
  state.status = "promiseSent";
  state.highestPromiseId = payload.proposalId;

  sendResponse("proposalPromised", {
    proposalId: payload.proposalId,
    proposalValue: payload.proposalValue,
  });
});

addBroadcastHandler("acceptResponse", async (payload, { sendResponse }) => {
  if (state.status === "off") {
    return;
  }

  // if this worker is already proposing and with a id higher tha the accepted one,
  // then it should only ignore the message
  if (
    (state.status === "proposing" || state.status === "sendingAccepts") &&
    proposalIdIsHigherThan(state.proposingId, payload.proposalId)
  ) {
    return;
  }

  state.status = "idle";
  state.acceptedValue = payload.acceptedValue;
  state.highestAcceptedId = payload.proposalId;
  state.proposingId = null;
  state.proposingValue = null;
  state.highestPromiseId = null;

  sendResponse("acceptConfirmed", {
    proposalId: payload.proposalId,
  });
});

addUiMessageHandler("propose", async (payload) => {
  state.status = "proposing";
  state.proposalPromisesReceived = 0;
  state.acceptsReceived = 0;
  state.proposingId = getNextProposalId(state.highestAcceptedId);
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
    sendAcceptsIfNeeded();
  }
});

const sendAcceptsIfNeeded = () => {
  if (
    state.status === "proposing" &&
    state.proposalPromisesReceived >= state.minimumQuorum
  ) {
    state.status = "sendingAccepts";

    broadcast("acceptResponse", {
      proposerId: id,
      proposalId: state.proposingId,
      acceptedValue: state.proposingValue,
    });
  }
};

addWorkerMessageHandler("overwriteProposer", (payload) => {
  // overwrite comes with a value that was already approved
  if (state.acceptedValue === payload.acceptedValue) {
    return;
  }

  state.proposingId = payload.highestProposalId;
  state.proposingValue = payload.acceptedValue;

  if (state.proposalPromisesReceived > 0) {
    state.status = "proposing";

    broadcast("proposingValue", {
      proposerId: payload.proposerId,
      proposalId: payload.highestProposalId,
      proposalValue: payload.acceptedValue,
    });
  } else {
    state.status = "promiseSent";
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
      state.highestAcceptedId = state.proposingId;
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
