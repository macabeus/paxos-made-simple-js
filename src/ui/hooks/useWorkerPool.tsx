import { createContext, useContext } from "react";
import { useImmerReducer } from "use-immer";
import { Worker } from "node:worker_threads";
import { useLogs } from "./useLogs";

type State = {
  workers: WorkerState[];
  startWorker: (
    id: string,
    type: "default" | "custom",
    initialTotalWorkers: number,
    delay: number
  ) => void;
  workerPostMessage: (id: string, payload: any) => void;
};

const defaultState: State = {
  workers: [] as WorkerState[],
  startWorker: () => null,
  workerPostMessage: () => null,
};

const WorkerPoolContext = createContext(defaultState);

type Props = {
  children: React.ReactNode;
};

type WorkersActions =
  | { type: "workerConnected"; payload: { id: string } }
  | {
      type: "workerStateChanged";
      payload: { id: string; prop: string; value: string };
    };

const workerPool: Record<string, Worker> = {};

export const WorkerPoolProvider = ({ children }: Props) => {
  const { addLogWorkerStatusChanged, addRawLog } = useLogs();
  const [state, dispatch] = useImmerReducer(reducer, defaultState);

  function reducer(state: State, action: WorkersActions) {
    switch (action.type) {
      case "workerConnected": {
        state.workers.push({
          id: action.payload.id,
          status: "idle",
          highestAcceptedId: `${action.payload.id}:0`,
          highestPromiseId: null,
          acceptedValue: null,
          proposingId: null,
          proposingValue: null,
          proposalPromisesReceived: 0,
          minimumQuorum: 0,
          acceptsReceived: 0,
        });
        return;
      }

      case "workerStateChanged": {
        const worker = state.workers.find(
          (worker) => worker.id === action.payload.id
        ) as any;

        if (worker[action.payload.prop] === action.payload.value) {
          return;
        }

        addLogWorkerStatusChanged({
          workerId: worker.id,
          prop: action.payload.prop,
          previousValue: worker[action.payload.prop],
          newValue: action.payload.value,
        });

        worker[action.payload.prop] = action.payload.value;

        return;
      }
    }
  }

  const startWorker = (
    id: string,
    type: "default" | "custom",
    initialTotalWorkers: number,
    delay: number
  ) => {
    const worker = new Worker("./src/worker/worker.cjs", {
      workerData: { id, type, delay, initialTotalWorkers },
    });

    worker.on("message", (message) => {
      dispatch(message);
    });

    worker.on("error", (error) => {
      addRawLog({
        log: `Error message from worker "${id}": ${error}`,
        color: "red",
      });
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        addRawLog({
          log: `Worker "${id}" exited with error ${code}`,
          color: "red",
        });
      } else {
        addRawLog({ log: `Worker "${id}" exited with no error` });
      }
    });

    workerPool[id] = worker;
  };

  const workerPostMessage = (id: string, payload: any) => {
    workerPool[id].postMessage(payload);
  };

  return (
    <WorkerPoolContext.Provider
      value={{
        workers: state.workers,
        startWorker,
        workerPostMessage,
      }}
    >
      {children}
    </WorkerPoolContext.Provider>
  );
};

export const useWorkerPool = () => {
  return useContext(WorkerPoolContext);
};
