const presets = [
  {
    name: "Simple",
    workers: [
      { id: "worker1", delay: 2000 },
      { id: "worker2", delay: 4000 },
      { id: "worker3", delay: 6000 },
    ],
    command: "propose worker1 foo",
  },
];

module.exports = { presets };
