import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const isProduction = window.location.hostname.includes("vercel.app");

    const apiOrigin = isProduction
      ? "https://aquaguard-ai-can0.onrender.com"
      : `${window.location.protocol}//${window.location.hostname}:5000`;

    socket = io(apiOrigin, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
  }

  return socket;
}
