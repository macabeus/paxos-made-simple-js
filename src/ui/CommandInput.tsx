import { useState } from "react";
import { Text, Box, useInput } from "ink";

export type ParsedCommand =
  | { action: "invalid"; reason: string }
  | { action: "quit" }
  | { action: "help" }
  | { action: "propose"; worker: string; value: string }
  | { action: "add-worker"; id: string }
  | { action: "off"; id: string }
  | { action: "on"; id: string };

const commandParser = (raw: string): ParsedCommand => {
  const parts = raw.split(" ");

  if (parts[0] === "q" || parts[0] === "quit") {
    return { action: "quit" };
  }

  if (parts[0] === "h" || parts[0] === "help") {
    return { action: "help" };
  }

  if (parts[0] === "p" || parts[0] === "propose") {
    if (parts.length !== 3) {
      return {
        action: "invalid",
        reason:
          '"proposal" command needs exactly two parameters: `proposal workerId value`',
      };
    }

    return { action: "propose", worker: parts[1], value: parts[2] };
  }

  if (parts[0] === "a" || parts[0] === "add-worker") {
    if (parts.length !== 2) {
      return {
        action: "invalid",
        reason:
          '"add-worker" command needs exactly one parameter: `add-worker workerId`',
      };
    }

    return { action: "add-worker", id: parts[1] };
  }

  if (parts[0] === "off") {
    if (parts.length !== 2) {
      return {
        action: "invalid",
        reason: '"off" command needs exactly one parameter: `off workerId`',
      };
    }

    return { action: "off", id: parts[1] };
  }

  if (parts[0] === "on") {
    if (parts.length !== 2) {
      return {
        action: "invalid",
        reason: '"on" command needs exactly one parameter: `on workerId`',
      };
    }

    return { action: "on", id: parts[1] };
  }

  return { action: "invalid", reason: `Input "${raw}" is not a valid command` };
};

type Props = {
  onSubmit: (command: ParsedCommand) => void;
};

export const CommandInput = ({ onSubmit }: Props) => {
  const [inputValue, setInputValue] = useState("");

  useInput((input, key) => {
    if (key.delete) {
      setInputValue(inputValue.slice(0, -1));
    } else if (key.return) {
      setInputValue("");

      const parsedCommand = commandParser(inputValue);
      onSubmit(parsedCommand);
    } else {
      setInputValue(`${inputValue}${input}`);
    }
  });

  return (
    <Box borderStyle="round" borderColor="gray" width={181}>
      {inputValue ? (
        <Text>{inputValue}</Text>
      ) : (
        <Text italic>
          Type your command - send "help" to see the available commands
        </Text>
      )}
    </Box>
  );
};
