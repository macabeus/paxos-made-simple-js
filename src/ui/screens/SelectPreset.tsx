import SelectInput from "ink-select-input";
import { useWorkerPool } from "../hooks/useWorkerPool";
import { presets } from "../../presets.cjs";
import { usePreset } from "../hooks/usePreset";

const presetItems = presets.map((item) => ({
  label: item.name,
  value: item,
  key: item.name,
}));

type Props = { onSelect: () => void };

export const SelectPreset = ({ onSelect }: Props) => {
  const { loadPreset } = usePreset();
  const { startWorker } = useWorkerPool();

  const handleSelect = (item: {
    label: string;
    value: (typeof presets)[0];
  }) => {
    for (const worker of item.value.workers) {
      startWorker(
        worker.id,
        "default",
        item.value.workers.length,
        worker.delay
      );
    }

    loadPreset({ defaultCommand: item.value.command });

    onSelect();
  };

  return <SelectInput items={presetItems} onSelect={handleSelect} />;
};
