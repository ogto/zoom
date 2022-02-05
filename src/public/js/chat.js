const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
const video = document.getElementById("video");

video.addEventListener("click", routeMoveVideoPage);

function routeMoveVideoPage() {
  location.href = "/video";
}

room.hidden = true;

let roomName;

function addMessage(msg) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerHTML = msg;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("newMessage", input.value, roomName, () => {
    addMessage(`<i style='float:right;'>${value} : You</i>`);
  });
  input.value = "";
}

function handleNickNameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("nickName", input.value);
  const name = document.getElementById("name");
  name.hidden = true;
}

function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount})`;
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNickNameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enterRoom", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount})`;
  addMessage(`${user} 접속!`);
});

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount})`;
  addMessage(`${left} 팅김 ㅠㅠ`);
});

socket.on("newMessage", addMessage);

socket.on("roomChange", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerHTML = room;
    roomList.append(li);
  });
});

//--- webSocket 사용
// const messageList = document.querySelector("ul");
// const nickForm = document.querySelector("#nick");
// const messageForm = document.querySelector("#message");

// // const socket = new WebSocket(`ws://${window.location.host}`);

// function makeMessage(type, payload) {
//   const msg = { type, payload };
//   return JSON.stringify(msg);
// }

// socket.addEventListener("open", () => {
//   console.log("Connect to Server ✔");
// });

// socket.addEventListener("message", (message) => {
//   const li = document.createElement("li");
//   li.innerText = message.data;
//   messageList.append(li);
// });

// socket.addEventListener("close", () => {
//   console.log("DisConnected from Server ❌");
// });

// function handleSubmit(event) {
//   event.preventDefault();
//   const input = messageForm.querySelector("input");
//   socket.send(makeMessage("new", input.value));
//   input.value = "";
// }

// function handleNickSubmit(event) {
//   event.preventDefault();
//   const input = nickForm.querySelector("input");
//   socket.send(makeMessage("nick", input.value));
//   input.value = "";
// }

// messageForm.addEventListener("submit", handleSubmit);
// nickForm.addEventListener("submit", handleNickSubmit);
