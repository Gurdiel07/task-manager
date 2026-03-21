import type { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function setIO(server: IOServer) {
  io = server;
}

export function getIO(): IOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  try {
    io?.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    console.error(`[socket] Failed to emit ${event} to user ${userId}:`, error);
  }
}

export function emitToTeam(teamId: string, event: string, data: unknown) {
  try {
    io?.to(`team:${teamId}`).emit(event, data);
  } catch (error) {
    console.error(`[socket] Failed to emit ${event} to team ${teamId}:`, error);
  }
}

export function emitToAll(event: string, data: unknown) {
  try {
    io?.emit(event, data);
  } catch (error) {
    console.error(`[socket] Failed to broadcast ${event}:`, error);
  }
}
