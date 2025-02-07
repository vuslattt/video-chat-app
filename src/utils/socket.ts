import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://backend-emby.onrender.com/"); // Backend URL'sini kontrol et
export default socket;
