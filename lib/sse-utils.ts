// Store active SSE connections
const sseConnections = new Map<
  number,
  Set<ReadableStreamDefaultController<Uint8Array>>
>();

export function registerSSEConnection(
  userId: number,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  if (!sseConnections.has(userId)) {
    sseConnections.set(userId, new Set());
  }
  const userConnections = sseConnections.get(userId)!;
  userConnections.add(controller);

  return () => {
    userConnections.delete(controller);
    if (userConnections.size === 0) {
      sseConnections.delete(userId);
    }
  };
}

export function broadcastUpdate(userId: number, event: string, data: unknown) {
  const connections = sseConnections.get(userId);
  if (!connections) return;

  const encoder = new TextEncoder();
  const message = encoder.encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );

  for (const controller of connections) {
    try {
      controller.enqueue(message);
    } catch {
      // Connection closed, will be cleaned up
    }
  }
}
