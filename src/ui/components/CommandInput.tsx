import { useState } from "react";
import { Text, Box, useInput } from "ink";
import { usePreset } from "../hooks/usePreset";
import { commandParserMultiples, ParsedCommand } from "../utils/command";

type Props = {
  onSubmit: (commands: ParsedCommand[]) => void;
};

export const CommandInput = ({ onSubmit }: Props) => {
  const { defaultCommand } = usePreset();
  const [inputValue, setInputValue] = useState(defaultCommand);

  useInput((input, key) => {
    if (key.delete) {
      setInputValue(inputValue.slice(0, -1));
    } else if (key.return) {
      setInputValue("");

      const parsedCommand = commandParserMultiples(inputValue);
      onSubmit(parsedCommand);
    } else {
      setInputValue(`${inputValue}${input}`);
    }
  });

  return (
    <Box borderStyle="round" borderColor="gray" width={177}>
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
