export type Preset = {
  name: string;
  workers: Array<{ id: string; delay: number }>;
  command: string;
};

export const presets = [
  {
    name: "Simple",
    workers: [
      { id: "worker1", delay: 2000 },
      { id: "worker2", delay: 4000 },
      { id: "worker3", delay: 6000 },
    ],
    command: "propose worker1 foo",
  } as const,
  {
    name: "Trying proposing with an obsoleted id",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 3000 },
      { id: "worker3", delay: 4000 },
    ],
    command:
      "off worker3; propose worker1 foo; delay 10000; on worker3; propose worker3 bar",
  } as const,
  {
    name: "Two proposes at the same time",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 1000 },
      { id: "worker3", delay: 3000 },
      { id: "worker4", delay: 4000 },
    ],
    command: "propose worker1 foo; propose worker2 bar",
  } as const,
  {
    name: "Three proposes at the same time",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 1000 },
      { id: "worker3", delay: 1000 },
      { id: "worker4", delay: 4000 },
      { id: "worker5", delay: 5000 },
    ],
    command: "propose worker1 foo; propose worker2 bar; propose worker3 baaz",
  } as const,
  {
    name: "Multiple proposes running sequentially",
    workers: [
      { id: "worker1", delay: 5000 },
      { id: "worker2", delay: 1000 },
      { id: "worker3", delay: 2000 },
      { id: "worker4", delay: 4000 },
      { id: "worker5", delay: 5000 },
    ],
    command: "propose worker1 foo; propose worker2 bar; propose worker3 baaz",
  } as const,
  {
    name: "Two proposes proposing the same value at the same time",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 1000 },
      { id: "worker3", delay: 3000 },
      { id: "worker4", delay: 4000 },
      { id: "worker5", delay: 5000 },
    ],
    command: "propose worker1 foo; propose worker2 foo",
  } as const,
  {
    name: "Always without a majority",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 2000 },
      { id: "worker3", delay: 3000 },
      { id: "worker4", delay: 4000 },
    ],
    command: "off worker4; off worker3; propose worker1 foo",
  } as const,
  {
    name: "No online majority initially",
    workers: [
      { id: "worker1", delay: 1000 },
      { id: "worker2", delay: 2000 },
      { id: "worker3", delay: 3000 },
      { id: "worker4", delay: 4000 },
    ],
    command:
      "off worker4; off worker3; propose worker1 foo; delay 5000; on worker3; propose worker3 bar",
  } as const,
] satisfies Preset[];
