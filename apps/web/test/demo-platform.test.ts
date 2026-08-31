import { describe, expect, it } from "vitest";
import {
  createAgentFromTemplate,
  createMaskedApiKey,
  publishAgent,
  queryKnowledge,
  simulateCall,
  validateLogin,
} from "@/lib/demo-platform";
import { demoOrganizationId } from "@votell/shared-types";

describe("demo platform workflow", () => {
  it("accepts the seeded development credentials", () => {
    expect(validateLogin("owner@votell.local", "votell-demo-2026")).toBe(true);
    expect(validateLogin("owner@votell.local", "wrong-password")).toBe(false);
  });

  it("creates and publishes a structured agent from an industry template", () => {
    const draft = createAgentFromTemplate("motel");
    const published = publishAgent(draft);

    expect(draft.status).toBe("draft");
    expect(published.status).toBe("published");
    expect(published.version).toBe(draft.version + 1);
    expect(
      published.enabledTools.some((tool) => tool.confirmationRequired),
    ).toBe(true);
  });

  it("keeps knowledge retrieval tenant scoped", () => {
    const results = queryKnowledge(demoOrganizationId, "check-in");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.document.length > 0)).toBe(true);
    expect(queryKnowledge("org_demo_factory", "check-in")).toHaveLength(0);
  });

  it("generates a complete mock call with confirmation before tool completion", () => {
    const events = simulateCall("motel", "ava", "Northstar Inn");
    const started = events.findIndex((event) => event.type === "tool.started");
    const completed = events.findIndex(
      (event) => event.type === "tool.completed",
    );

    expect(events[0]?.type).toBe("call.started");
    expect(started).toBeGreaterThan(0);
    expect(completed).toBeGreaterThan(started);
    expect(events.at(-1)?.type).toBe("call.ended");
  });

  it("shows API keys once and keeps a masked display value", () => {
    const key = createMaskedApiKey("Operations");

    expect(key.secretOnce).toContain("votell_live_");
    expect(key.masked).toContain("...");
    expect(key.masked).not.toEqual(key.secretOnce);
  });
});
