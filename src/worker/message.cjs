const {
  parentPort,
  threadId,
  BroadcastChannel,
  postMessageToThread,
} = require("node:worker_threads");
const { delay } = require("./delay.cjs");

// broadcast
const bc = new BroadcastChannel("bus");

const broadcast = (type, payload) => {
  bc.postMessage({ type, originThreadId: threadId, payload });
};

const broadcastHandlers = {};

bc.onmessage = async (message) => {
  if (!("type" in message.data) || !broadcastHandlers[message.data.type]) {
    return;
  }

  const { type, originThreadId, payload } = message.data;

  const sendResponse = (type, payload) => {
    postMessageToThread(originThreadId, { type, payload });
  };

  await delay();

  broadcastHandlers[type](payload, { sendResponse });
};

const addBroadcastHandler = (type, callback) => {
  broadcastHandlers[type] = callback;
};

// ui thread
const uiMessageHandlers = {};

parentPort.on("message", async (message) => {
  if (!("type" in message) || !uiMessageHandlers[message.type]) {
    return;
  }

  uiMessageHandlers[message.type](message.payload);
});

const addUiMessageHandler = (type, callback) => {
  uiMessageHandlers[type] = callback;
};

const sendMessageToUIThread = (type, payload) => {
  parentPort.postMessage({ type, payload });
};

// worker messages
const workerMessageHandlers = {};

process.on("workerMessage", async (message) => {
  if (!("type" in message) || !workerMessageHandlers[message.type]) {
    return;
  }

  await delay();

  workerMessageHandlers[message.type](message.payload);
});

const addWorkerMessageHandler = (type, callback) => {
  workerMessageHandlers[type] = callback;
};

// exports
module.exports = {
  broadcast,
  addBroadcastHandler,
  addUiMessageHandler,
  sendMessageToUIThread,
  addWorkerMessageHandler,
};
