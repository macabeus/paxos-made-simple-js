import SelectInput from "ink-select-input";
import { useWorkerPool } from "../hooks/useWorkerPool";
import { presets } from "../../presets.cjs";

const presetItems = presets.map((item) => ({ label: item.name, value: item }));

type Props = { onSelect: () => void };

export const SelectPreset = ({ onSelect }: Props) => {
  const { startWorker } = useWorkerPool();

  const handleSelect = (item: {
    label: string;
    value: { workers: Array<{ id: string; delay: number }> };
  }) => {
    for (const worker of item.value.workers) {
      startWorker(
        worker.id,
        "default",
        item.value.workers.length,
        worker.delay
      );
    }

    onSelect();
  };

  return <SelectInput items={presetItems} onSelect={handleSelect} />;
};
