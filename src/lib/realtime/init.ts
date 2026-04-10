import { createServer } from "node:http";
import { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { decode } from "next-auth/jwt";
import { setIO } from "./socket-server";

const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? 3001);

let initialized = false;

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

    const secureCookieName = "__Secure-authjs.session-token";
    const devCookieName = "authjs.session-token";

    const cookieName = cookies[secureCookieName]
      ? secureCookieName
      : devCookieName;
    const cookieValue = cookies[cookieName];

    if (!cookieValue) return null;

    const decoded = await decode({
      token: cookieValue,
      secret: process.env.NEXTAUTH_SECRET ?? "",
      salt: cookieName,
    });

    if (!decoded) return null;

    const userId = (decoded.id as string | undefined) ?? decoded.sub;
    return userId ?? null;
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
      // Allow any origin on the local network — auth is still enforced via JWT cookie
      origin: (_origin, callback) => callback(null, true),
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

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
