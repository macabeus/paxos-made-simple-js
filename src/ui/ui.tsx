import { useState } from "react";
import { render } from "ink";
import { Main } from "./screens/Main";
import { SelectPreset } from "./screens/SelectPreset";
import { WorkerPoolProvider } from "./hooks/useWorkerPool";
import { LogsProvider } from "./hooks/useLogs";
import { PresetProvider } from "./hooks/usePreset";

type Screen = "selectPreset" | "main";

const Ui = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("selectPreset");

  if (currentScreen === "selectPreset") {
    return <SelectPreset onSelect={() => setCurrentScreen("main")} />;
  }

  return <Main />;
};

const enterAltScreenCommand = "\x1b[?1049h";
const leaveAltScreenCommand = "\x1b[?1049l";
process.stdout.write(enterAltScreenCommand);
process.on("exit", () => {
  process.stdout.write(leaveAltScreenCommand);
});

render(
  <LogsProvider>
    <WorkerPoolProvider>
      <PresetProvider>
        <Ui />
      </PresetProvider>
    </WorkerPoolProvider>
  </LogsProvider>
);
