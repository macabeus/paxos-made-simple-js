import { createContext, useContext } from "react";
import { useImmerReducer } from "use-immer";

type State = {
  defaultCommand: string;
  loadPreset: (params: { defaultCommand: string }) => void;
};

const defaultState: State = {
  defaultCommand: "",
  loadPreset: () => null,
};

const PresetContext = createContext(defaultState);

type Props = {
  children: React.ReactNode;
};

type WorkersActions = {
  type: "loadPreset";
  payload: {
    defaultCommand: string;
  };
};

function reducer(state: State, action: WorkersActions) {
  switch (action.type) {
    case "loadPreset": {
      state.defaultCommand = action.payload.defaultCommand;

      return;
    }
  }
}

export function PresetProvider({ children }: Props) {
  const [state, dispatch] = useImmerReducer(reducer, defaultState);

  return (
    <PresetContext.Provider
      value={{
        defaultCommand: state.defaultCommand,
        loadPreset: (args) => dispatch({ type: "loadPreset", payload: args }),
      }}
    >
      {children}
    </PresetContext.Provider>
  );
}

export const usePreset = () => {
  return useContext(PresetContext);
};
