import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { registerSSEConnection } from "@/lib/sse-utils";

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Create a stream for this connection
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = registerSSEConnection(userId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'),
      );

      // Clean up on close
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
