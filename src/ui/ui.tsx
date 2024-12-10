import { Worker } from "node:worker_threads";
import { Dispatch, useEffect } from "react";
import { render, Box } from "ink";
import { useImmerReducer } from "use-immer";
import { defaultWorkers } from "../constants.cjs";
import { CommandInput, ParsedCommand } from "./CommandInput";
import { Logs } from "./Logs";
import { WorkersTable } from "./WorkersTable";

type UIState = {
  workers: WorkerState[];
  logs: LogEntry[];
};
type WorkersActions =
  | { type: "workerConnected"; payload: { id: string } }
  | {
      type: "workerStateChanged";
      payload: { id: string; prop: string; value: string };
    }
  | { type: "addLog"; payload: { log: string; color?: string } }
  | { type: "addLogs"; payload: { logs: string[]; color?: string } };

const defaultUIState: UIState = {
  workers: [],
  logs: [],
};

function reducer(state: UIState, action: WorkersActions) {
  switch (action.type) {
    case "workerConnected": {
      state.workers.push({
        id: action.payload.id,
        status: "idle",
        highestProposalId: 0,
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

      state.logs.push({
        type: "workerStatusChanged",
        payload: {
          workerId: worker.id,
          prop: action.payload.prop,
          previousValue: worker[action.payload.prop],
          newValue: action.payload.value,
        },
      });

      worker[action.payload.prop] = action.payload.value;

      return;
    }

    case "addLog": {
      state.logs.push({
        type: "raw",
        payload: { value: action.payload.log, color: action.payload.color },
      });

      return;
    }

    case "addLogs": {
      state.logs.push(
        ...action.payload.logs.map((value) => ({
          type: "raw" as const,
          payload: { value, color: action.payload.color },
        }))
      );
    }
  }
}

const workerPool: Record<string, Worker> = {};

const startWorker = (
  id: string,
  type: "default" | "custom",
  initialTotalWorkers: number,
  dispatchUIState: Dispatch<WorkersActions>
) => {
  const worker = new Worker("./src/worker/worker.cjs", {
    workerData: { id, type, initialTotalWorkers },
  });

  worker.on("message", (message) => {
    dispatchUIState(message);
  });

  worker.on("error", (error) => {
    dispatchUIState({
      type: "addLog",
      payload: {
        log: `Error message from worker "${id}": ${error}`,
        color: "red",
      },
    });
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      dispatchUIState({
        type: "addLog",
        payload: {
          log: `Worker "${id}" exited with error ${code}`,
          color: "red",
        },
      });
    } else {
      dispatchUIState({
        type: "addLog",
        payload: { log: `Worker "${id}" exited with no error` },
      });
    }
  });

  workerPool[id] = worker;
};

const Counter = () => {
  const [uiState, dispatchUIState] = useImmerReducer(reducer, defaultUIState);

  useEffect(() => {
    for (const { id } of defaultWorkers) {
      startWorker(id, "default", defaultWorkers.length, dispatchUIState);
    }
  }, []);

  const onSubmitCommand = (commands: ParsedCommand[]) => {
    for (const command of commands) {
      switch (command.action) {
        case "quit": {
          process.exit();
        }

        case "propose": {
          workerPool[command.worker].postMessage({
            type: "propose",
            payload: {
              value: command.value,
            },
          });

          break;
        }

        case "add-worker": {
          startWorker(
            command.id,
            "custom",
            uiState.workers.length + 1,
            dispatchUIState
          );

          break;
        }

        case "off": {
          workerPool[command.id].postMessage({ type: "off" });

          break;
        }

        case "on": {
          workerPool[command.id].postMessage({ type: "on" });

          break;
        }

        case "help": {
          dispatchUIState({
            type: "addLogs",
            payload: {
              logs: [
                "Available commands:",
                "- `proposal <worker id> <value>`: send a proposal request",
                "- `add-worker <worker id>`: add a new worker",
                "- `off <worker id>`: turn off a worker",
                "- `on <worker id>`: turn on a worker",
                "- `quit`: quit the program",
                "Tip: Run multiple commands at once by splitting them with `;`",
              ],
            },
          });

          break;
        }

        case "invalid": {
          dispatchUIState({
            type: "addLog",
            payload: { log: command.reason, color: "yellow" },
          });

          break;
        }
      }
    }
  };

  return (
    <Box flexDirection="column" width={200}>
      <WorkersTable workers={uiState.workers} />

      <Logs logs={uiState.logs} />

      <CommandInput onSubmit={onSubmitCommand} />
    </Box>
  );
};

const enterAltScreenCommand = "\x1b[?1049h";
const leaveAltScreenCommand = "\x1b[?1049l";
process.stdout.write(enterAltScreenCommand);
process.on("exit", () => {
  process.stdout.write(leaveAltScreenCommand);
});

render(<Counter />);
