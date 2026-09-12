import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Connects to the same host the app is served from, on the API port (5000).
// In dev, Vite serves the client on :5173 and the API on :5000, so we point
// directly at the API origin for the websocket handshake.
//
// IMPORTANT: transports intentionally starts with "polling", not
// "websocket". Some campus/corporate networks and antivirus products block
// raw WebSocket upgrades (ws://) while still allowing normal HTTP traffic.
// Starting with polling lets the connection establish over plain HTTP first,
// then Socket.IO transparently upgrades to a real WebSocket if the network
// allows it - so the live alert feed still works even on restrictive
// networks, just slightly less efficiently.
export function getSocket(): Socket {
  if (!socket) {
    const apiOrigin = window.location.hostname
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : "http://localhost:5000";
    socket = io(apiOrigin, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
  }
  return socket;
}
