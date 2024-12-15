import { Text, Box } from "ink";
import { ColoredText } from "./ColoredText";
import { useWorkerPool } from "../hooks/useWorkerPool";

export const WorkersTable = () => {
  const { workers } = useWorkerPool();
  const sortedWorkers = workers.toSorted((a, b) => a.id.localeCompare(b.id));

  return (
    <Box flexDirection="column" width={180} height={10}>
      <Box>
        <Box width="7%">
          <Text bold>ID</Text>
        </Box>

        <Box width="9%">
          <Text bold>Status</Text>
        </Box>

        <Box width="10%">
          <Text bold>Accepted Value</Text>
        </Box>

        <Box width="12%">
          <Text bold>Highest Accepted Id</Text>
        </Box>

        <Box width="12%">
          <Text bold>Highest Promise Id</Text>
        </Box>

        <Box width="10%">
          <Text bold>Proposing Id</Text>
        </Box>

        <Box width="10%">
          <Text bold>Proposing Value</Text>
        </Box>

        <Box width="15%">
          <Text bold>Promises Received / MQ</Text>
        </Box>

        <Box width="15%">
          <Text bold>Accepts Received / MQ</Text>
        </Box>
      </Box>

      {sortedWorkers.map((worker) => (
        <Box key={worker.id}>
          <Box width="7%">
            <Text color="blue">{worker.id}</Text>
          </Box>

          <Box width="9%">
            <Text>{worker.status}</Text>
          </Box>

          <Box width="10%">
            <ColoredText value={worker.acceptedValue} />
          </Box>

          <Box width="12%">
            <ColoredText value={worker.highestAcceptedId} />
          </Box>

          <Box width="12%">
            <ColoredText value={worker.highestPromiseId} />
          </Box>

          <Box width="10%">
            <ColoredText value={worker.proposingId} />
          </Box>

          <Box width="10%">
            <ColoredText value={worker.proposingValue} />
          </Box>

          <Box width="15%">
            <ColoredText value={worker.proposalPromisesReceived} />
            <Text>/</Text>
            <ColoredText value={worker.minimumQuorum} />
          </Box>

          <Box width="15%">
            <ColoredText value={worker.acceptsReceived} />
            <Text>/</Text>
            <ColoredText value={worker.minimumQuorum} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
