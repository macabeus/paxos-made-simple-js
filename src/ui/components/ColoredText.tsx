import { Text } from "ink";

function isNumeric(value: string) {
  return /^-?\d+$/.test(value);
}

type Props = {
  value: string | number | null;
};

export const ColoredText = ({ value }: Props) => {
  if (!value) {
    return <Text color="magenta">null</Text>;
  }

  if (typeof value === "number" || isNumeric(value)) {
    return <Text color="blueBright">{value}</Text>;
  }

  return <Text color="green">{value}</Text>;
};
