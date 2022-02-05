const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeearConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "UnMute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeearConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeearConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (choose a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("joinRoom", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

//방장 순서 1
socket.on("welcome", async () => {
  const offer = await myPeearConnection.createOffer();
  myPeearConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

//참가자 순서 2
socket.on("offer", async (offer) => {
  myPeearConnection.setRemoteDescription(offer);
  const answer = await myPeearConnection.createAnswer();
  myPeearConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

//방장 순서 3
socket.on("answer", (answer) => {
  myPeearConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeearConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
  myPeearConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeearConnection.addEventListener("icecandidate", handleIce);

  //safari 작동 안함
  //myPeearConnection.addEventListener("addstream", handleAddStream);
  myPeearConnection.addEventListener("track", handleTrack);
  myStream
    .getTracks()
    .forEach((track) => myPeearConnection.addTrack(track, myStream));
}

function handleIce(data) {
  socket.emit("ice", data.candidate, roomName);
}

function handleTrack(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.streams[0];
}
