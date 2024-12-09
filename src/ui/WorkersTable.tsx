import { Text, Box } from "ink";
import { ColoredText } from "./ColoredText";

type Props = {
  workers: WorkerState[];
};
export const WorkersTable = ({ workers }: Props) => {
  return (
    <Box flexDirection="column" width={200} height={10}>
      <Box>
        <Box width="10%">
          <Text bold>ID</Text>
        </Box>

        <Box width="10%">
          <Text bold>Status</Text>
        </Box>

        <Box width="10%">
          <Text bold>Accepted Value</Text>
        </Box>

        <Box width="15%">
          <Text bold>Highest Proposal Id</Text>
        </Box>

        <Box width="10%">
          <Text bold>Proposing Id</Text>
        </Box>

        <Box width="15%">
          <Text bold>Proposing Value</Text>
        </Box>

        <Box width="20%">
          <Text bold>Promises Received / Minimum Quorum</Text>
        </Box>

        <Box width="20%">
          <Text bold>Accepts Received / MQ</Text>
        </Box>
      </Box>

      {workers.map((worker) => (
        <Box key={worker.id}>
          <Box width="10%">
            <Text color="blue">{worker.id}</Text>
          </Box>

          <Box width="10%">
            <Text>{worker.status}</Text>
          </Box>

          <Box width="10%">
            <ColoredText value={worker.acceptedValue} />
          </Box>

          <Box width="15%">
            <ColoredText value={worker.highestProposalId} />
          </Box>

          <Box width="10%">
            <ColoredText value={worker.proposingId} />
          </Box>

          <Box width="15%">
            <ColoredText value={worker.proposingValue} />
          </Box>

          <Box width="20%">
            <ColoredText value={worker.proposalPromisesReceived} />
            <Text>/</Text>
            <ColoredText value={worker.minimumQuorum} />
          </Box>

          <Box width="20%">
            <ColoredText value={worker.acceptsReceived} />
            <Text>/</Text>
            <ColoredText value={worker.minimumQuorum} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
