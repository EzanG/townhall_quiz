import type { Server as SocketIOServer } from "socket.io";
import { getAppState, setBroadcast } from "./game";

/** 与上一轮广播内容比较，有变化才 emit，减轻大屏与手机端渲染压力 */
let io: SocketIOServer | null = null;
let lastStateJson = "";

export function initSocketServer(server: SocketIOServer) {
  io = server;

  setBroadcast((state) => {
    lastStateJson = JSON.stringify(state);
    io?.emit("state:update", state);
  });

  io.on("connection", async (socket) => {
    socket.emit("state:update", await getAppState());
  });

  setInterval(async () => {
    if (!io || io.engine.clientsCount === 0) return;
    try {
      const state = await getAppState();
      const j = JSON.stringify(state);
      if (j !== lastStateJson) {
        lastStateJson = j;
        io.emit("state:update", state);
      }
    } catch {
      /* ignore */
    }
  }, 1000);
}
