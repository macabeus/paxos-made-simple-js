import { createContext, useContext } from "react";
import { useImmerReducer } from "use-immer";

type State = {
  logs: LogEntry[];
  addLogWorkerStatusChanged: (params: {
    workerId: string;
    prop: string;
    previousValue: string;
    newValue: string;
  }) => void;
  addRawLog: (params: { log: string; color?: string }) => void;
  addRawLogs: (params: { logs: string[]; color?: string }) => void;
};

const defaultState: State = {
  logs: [],
  addLogWorkerStatusChanged: () => null,
  addRawLog: () => null,
  addRawLogs: () => null,
};

const LogsContext = createContext(defaultState);

type Props = {
  children: React.ReactNode;
};

type LogsActions =
  | {
      type: "addLogWorkerStatusChanged";
      payload: {
        workerId: string;
        prop: string;
        previousValue: string;
        newValue: string;
      };
    }
  | { type: "addRawLog"; payload: { log: string; color?: string } }
  | { type: "addRawLogs"; payload: { logs: string[]; color?: string } };

function reducer(state: State, action: LogsActions) {
  switch (action.type) {
    case "addLogWorkerStatusChanged": {
      state.logs.push({
        type: "workerStatusChanged",
        payload: {
          workerId: action.payload.workerId,
          prop: action.payload.prop,
          previousValue: action.payload.previousValue,
          newValue: action.payload.newValue,
        },
      });

      return;
    }

    case "addRawLog": {
      state.logs.push({
        type: "raw",
        payload: { value: action.payload.log, color: action.payload.color },
      });

      return;
    }

    case "addRawLogs": {
      state.logs.push(
        ...action.payload.logs.map((value) => ({
          type: "raw" as const,
          payload: { value, color: action.payload.color },
        }))
      );
    }
  }
}

export function LogsProvider({ children }: Props) {
  const [state, dispatch] = useImmerReducer(reducer, defaultState);

  return (
    <LogsContext.Provider
      value={{
        logs: state.logs,
        addLogWorkerStatusChanged: (args) =>
          dispatch({ type: "addLogWorkerStatusChanged", payload: args }),
        addRawLog: (args) => dispatch({ type: "addRawLog", payload: args }),
        addRawLogs: (args) => dispatch({ type: "addRawLogs", payload: args }),
      }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export const useLogs = () => {
  return useContext(LogsContext);
};
