import { describe, it } from "vitest";
import { loadPreset } from "./testUtils";
import { delay } from "../src/ui/utils/helpers";

describe.concurrent("# Run Presets", () => {
  it("Simple", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset("Simple");

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Trying proposing with an obsoleted id", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Trying proposing with an obsoleted id"
    );

    await runDefaultCommand();
    await delay(15_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Two proposes at the same time", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Two proposes at the same time"
    );

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Three proposes at the same time", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Three proposes at the same time"
    );

    await runDefaultCommand();
    await delay(30_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Multiple proposes running sequentially", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Multiple proposes running sequentially"
    );

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Two proposes proposing the same value at the same time", async ({
    expect,
  }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Two proposes proposing the same value at the same time"
    );

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("Always without a majority", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "Always without a majority"
    );

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });

  it("No online majority initially", async ({ expect }) => {
    const { runDefaultCommand, getStatus } = await loadPreset(
      "No online majority initially"
    );

    await runDefaultCommand();
    await delay(25_000);

    const status = getStatus();
    expect(status).matchSnapshot();
  });
});
