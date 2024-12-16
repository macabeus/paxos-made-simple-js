import { Box } from "ink";
import { CommandInput } from "../components/CommandInput";
import { Logs } from "../components/Logs";
import { WorkersTable } from "../components/WorkersTable";
import { delay } from "../utils/helpers";
import { useWorkerPool } from "../hooks/useWorkerPool";
import { useLogs } from "../hooks/useLogs";
import type { ParsedCommand } from "../utils/command";

export const Main = () => {
  const { addRawLog, addRawLogs } = useLogs();
  const { workers, startWorker, workerPostMessage } = useWorkerPool();

  const onSubmitCommand = async (commands: ParsedCommand[]) => {
    for (const command of commands) {
      switch (command.action) {
        case "quit": {
          process.exit();
        }

        case "propose": {
          workerPostMessage(command.worker, {
            type: "propose",
            payload: {
              value: command.value,
            },
          });

          break;
        }

        case "add-worker": {
          startWorker(command.id, "custom", workers.length + 1, 10_000);

          break;
        }

        case "delay": {
          await delay(command.miliseconds);

          break;
        }

        case "off": {
          workerPostMessage(command.id, { type: "off" });

          break;
        }

        case "on": {
          workerPostMessage(command.id, { type: "on" });

          break;
        }

        case "help": {
          addRawLogs({
            logs: [
              "Available commands:",
              "- `proposal <worker id> <value>`: send a proposal request",
              "- `add-worker <worker id>`: add a new worker",
              "- `delay <miliseconds>`: wait for a time before running the next command",
              "- `on <worker id>`: turn on a worker",
              "- `off <worker id>`: turn off a worker",
              "- `quit`: quit the program",
              "Tip: Run multiple commands at once by splitting them with `;`",
            ],
          });

          break;
        }

        case "invalid": {
          addRawLog({ log: command.reason, color: "yellow" });

          break;
        }
      }
    }
  };

  return (
    <Box flexDirection="column" width={180}>
      <WorkersTable />

      <Logs />

      <CommandInput onSubmit={onSubmitCommand} />
    </Box>
  );
};
