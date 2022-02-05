import http from "http";
import { Server } from "socket.io";
import SocketIO from "socket.io";
import { instrument } from "@socket.io/admin-ui";
// import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.get("/", (req, res) => res.render("chat"));
app.get("/video", (req, res) => res.render("video"));
app.use("/public", express.static(__dirname + "/public"));

//존재하지않는 페이지 이동 redirect 처리
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

//chat socketIo

//⬇ socket.io admin 위한 작업
// const wsServer = new Server(httpServer, {
//   cors: {
//     origin: ["https://admin.socket.io"],
//     credentials: true,
//   },
// });

// instrument(wsServer, {
//   auth: false,
// });

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickName"] = "UnKnown";
  socket.onAny((event) => {
    console.log(`Socket Event:${event}`);
  });
  socket.on("enterRoom", (roomName, done) => {
    socket.join(roomName);
    done(countRoom(roomName));
    socket.to(roomName).emit("welcome", socket.nickName, countRoom(roomName));
    wsServer.sockets.emit("roomChange", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickName, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("roomChange", publicRooms());
  });
  socket.on("newMessage", (msg, room, done) => {
    socket.to(room).emit("newMessage", `${socket.nickName}: ${msg}`);
    done();
  });
  socket.on("nickName", (nickName) => (socket.nickName = nickName));
});

httpServer.listen(3000, handleListen);
