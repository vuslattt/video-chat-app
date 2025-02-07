const io = require("socket.io-client").io;
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://backend-emby.onrender.com/");
export default socket;
