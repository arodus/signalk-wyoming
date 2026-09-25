import { describe, expect, it, vi } from "vitest";
import { runPrePlaybackHook } from "../src/pre-playback.js";

describe("runPrePlaybackHook", () => {
  it("posts an empty parameterless request", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    await runPrePlaybackHook({
      host: "sat.local",
      port: 10800,
      timeoutMs: 1000,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://sat.local:10800/pre-playback",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl.mock.calls[0]?.[1]).not.toHaveProperty("body");
  });

  it("reports only generic HTTP and transport failures", async () => {
    await expect(
      runPrePlaybackHook({
        host: "sat.local",
        port: 10800,
        timeoutMs: 1000,
        fetchImpl: vi.fn(
          async () => new Response("secret output", { status: 503 }),
        ) as typeof fetch,
      }),
    ).rejects.toThrow("pre-playback hook failed (HTTP 503)");
    await expect(
      runPrePlaybackHook({
        host: "sat.local",
        port: 10800,
        timeoutMs: 1000,
        fetchImpl: vi.fn(async () => {
          throw new Error("secret command output");
        }) as typeof fetch,
      }),
    ).rejects.toThrow("pre-playback hook unavailable");
  });
});
