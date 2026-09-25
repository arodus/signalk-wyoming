export interface PrePlaybackHookOptions {
  host: string;
  port: number;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

/**
 * Ask a satellite to run its locally configured wake command. The request
 * deliberately carries no executable, arguments, or environment: those are
 * trusted satellite configuration, never network input.
 */
export async function runPrePlaybackHook(
  options: PrePlaybackHookOptions,
): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(
      `http://${options.host}:${options.port}/pre-playback`,
      {
        method: "POST",
        signal: AbortSignal.timeout(options.timeoutMs),
      },
    );
    if (!response.ok) {
      throw new Error(`pre-playback hook failed (HTTP ${response.status})`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("pre-playback ")) {
      throw error;
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("pre-playback hook timed out", { cause: error });
    }
    throw new Error("pre-playback hook unavailable", { cause: error });
  }
}
