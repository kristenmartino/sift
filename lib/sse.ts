import { reportError } from "./observability";

/**
 * Parse Server-Sent Events from a fetch Response stream.
 * Yields {event, data} objects as they arrive.
 */
export async function* readSSE<T = unknown>(
  response: Response,
): AsyncGenerator<{ event: string; data: T }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on double-newline (SSE event boundary)
      const parts = buffer.split("\n\n");
      // Last element is incomplete — keep it in the buffer
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.trim()) continue;
        let event = "message";
        let dataStr = "";
        for (const line of part.split("\n")) {
          if (line.startsWith("event: ")) {
            event = line.slice(7);
          } else if (line.startsWith("data: ")) {
            dataStr += (dataStr ? "\n" : "") + line.slice(6);
          }
        }
        if (dataStr) {
          let data: T;
          try {
            data = JSON.parse(dataStr) as T;
          } catch (err) {
            // Skip the frame rather than abort the stream, but report it: a
            // dropped frame is silently missing search results or claims.
            reportError("sse.parseFrame", err, {
              level: "warning",
              extra: { event, dataPreview: dataStr.slice(0, 200) },
            });
            continue;
          }
          yield { event, data };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
