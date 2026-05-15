/**
 * Next.js（同端口）+ Socket.io。
 * 首行加载 env，确保 `db.ts` 在求值前已读到 `DATABASE_PATH` 等变量。
 */
import "./src/lib/env-bootstrap";
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { initSocketServer } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*" },
  });

  initSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
