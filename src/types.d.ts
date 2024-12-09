type WorkerState = {
  id: string;
  status: "idle";
  highestProposalId: 0;
  acceptedValue: string | null;
  proposingId: string | null;
  proposingValue: string | null;
  proposalPromisesReceived: number;
  acceptsReceived: 0;
};

type LogEntry =
  | {
      type: "workerStatusChanged";
      payload: {
        workerId: string;
        prop: string;
        previousValue: string;
        newValue: string;
      };
    }
  | { type: "raw"; payload: { value: string; color?: string } };
