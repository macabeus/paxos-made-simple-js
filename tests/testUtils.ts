import { Worker } from "node:worker_threads";
import { presets } from "../src/presets";
import { commandParserMultiples } from "../src/ui/utils/command";
import { delay } from "../src/ui/utils/helpers";

type Presets = (typeof presets)[number];
type PresetFuncs = {
  runDefaultCommand: () => Promise<void>;
  getStatus: () => object;
};
export const loadPreset = async (
  presetName: Presets["name"]
): Promise<PresetFuncs> => {
  const workers = {} as Record<string, Worker>;
  const workerStatus = {} as Record<string, Record<string, any>>;

  const preset = presets.find((preset) => preset.name === presetName)!;
  const loadWorkerPromises = preset.workers.map((workerData) => {
    return new Promise<void>((resolve) => {
      const worker = new Worker("./src/worker/worker.cjs", {
        workerData: {
          id: `${presetName}#${workerData.id}`,
          type: "default",
          delay: workerData.delay,
          initialTotalWorkers: preset.workers.length,
        },
      });

      workers[workerData.id] = worker;
      workerStatus[workerData.id] = {};

      worker.on("message", (message) => {
        if (message.type === "workerConnected") {
          resolve();
        } else if (message.type === "workerStateChanged") {
          if (message.payload.prop === "proposalPromisesReceived") {
            return;
          }

          workerStatus[workerData.id][message.payload.prop] =
            message.payload.value;
        }
      });
    });
  });

  await Promise.all(loadWorkerPromises);

  const parsedDefaultCommand = commandParserMultiples(preset.command);

  return {
    runDefaultCommand: async () => {
      for (const command of parsedDefaultCommand) {
        switch (command.action) {
          case "propose": {
            workers[command.worker].postMessage({
              type: "propose",
              payload: {
                value: command.value,
              },
            });

            break;
          }

          case "off": {
            workers[command.id].postMessage({
              type: "off",
            });

            break;
          }

          case "on": {
            workers[command.id].postMessage({
              type: "on",
            });

            break;
          }

          case "delay": {
            await delay(command.miliseconds);

            break;
          }
        }
      }
    },

    getStatus: () => {
      return workerStatus;
    },
  };
};
