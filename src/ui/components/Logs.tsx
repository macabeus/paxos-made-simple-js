import { Text, Box } from "ink";
import { ColoredText } from "./ColoredText";
import { useLogs } from "../hooks/useLogs";

export const Logs = () => {
  const { logs } = useLogs();

  return (
    <Box height={15} flexDirection="column">
      <Text bold>Logs</Text>

      {logs.slice(-15).map((log, index) => (
        <Box key={index}>
          {log.type === "workerStatusChanged" ? (
            <>
              <Box width={10}>
                <Text color="blue">{log.payload.workerId}</Text>
              </Box>

              <Box width={25}>
                <Text color="cyan">{log.payload.prop}</Text>
              </Box>

              <Box width={15}>
                <ColoredText value={log.payload.previousValue} />
              </Box>

              <Text>{" -> "}</Text>

              <Box width={15}>
                <ColoredText value={log.payload.newValue} />
              </Box>
            </>
          ) : (
            <Box width={65}>
              <Text color={log.payload.color}>{log.payload.value}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
