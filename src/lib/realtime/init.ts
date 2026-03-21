import { createServer } from "node:http";
import { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { setIO } from "./socket-server";

const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? 3001);

let initialized = false;

async function attachRedisAdapter(io: IOServer) {
  try {
    const { Redis } = await import("ioredis");
    const { createAdapter } = await import("@socket.io/redis-adapter");

    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        pubClient.once("ready", resolve);
        pubClient.once("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        subClient.once("ready", resolve);
        subClient.once("error", reject);
      }),
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log("[socket] Redis adapter connected");
  } catch (error) {
    console.warn(
      "[socket] Redis unavailable, falling back to in-memory adapter:",
      error instanceof Error ? error.message : error
    );
  }
}

async function authenticateSocket(socket: Socket): Promise<string | null> {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...rest] = c.trim().split("=");
        return [key, rest.join("=")];
      })
    );

    const sessionToken =
      cookies["__Secure-authjs.session-token"] ??
      cookies["authjs.session-token"] ??
      cookies["next-auth.session-token"];

    if (!sessionToken) return null;

    const { db } = await import("@/lib/db");

    const session = await db.session.findFirst({
      where: {
        sessionToken,
        expires: { gt: new Date() },
      },
      select: { userId: true },
    });

    return session?.userId ?? null;
  } catch (error) {
    console.error("[socket] Auth error:", error);
    return null;
  }
}

async function joinUserRooms(socket: Socket, userId: string) {
  try {
    const { db } = await import("@/lib/db");

    await socket.join(`user:${userId}`);

    const memberships = await db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    for (const { teamId } of memberships) {
      await socket.join(`team:${teamId}`);
    }

    console.log(
      `[socket] User ${userId} joined ${memberships.length + 1} rooms`
    );
  } catch (error) {
    console.error("[socket] Failed to join rooms:", error);
  }
}

export async function initializeRealtimeServer() {
  if (initialized) return;
  initialized = true;

  const httpServer = createServer();

  const io = new IOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.NEXTAUTH_URL ?? "",
      ].filter(Boolean),
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  await attachRedisAdapter(io);
  setIO(io);

  io.on("connection", async (socket) => {
    const userId = await authenticateSocket(socket);

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;
    await joinUserRooms(socket, userId);

    socket.on("disconnect", () => {
      console.log(`[socket] User ${userId} disconnected`);
    });
  });

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`[socket] Realtime server listening on port ${SOCKET_PORT}`);
  });
}
