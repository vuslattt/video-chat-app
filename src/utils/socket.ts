import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://9b03-2a02-4e0-2d35-c87-2472-e8b7-9147-c554.ngrok-free.app";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  timeout: 10000,
});

export default socket;
