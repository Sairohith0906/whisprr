import { writeDataBase, joining_chat } from './combine.js';

// Open popups
document.querySelector("#join").addEventListener("click", () => {
  document.querySelector(".popup-join-chat").classList.add("active");
  document.querySelector("#overlay-join").classList.add("active");
});
document.querySelector("#create-room").addEventListener("click", () => {
  document.querySelector(".popup-create-room").classList.add("active");
  document.querySelector("#overlay-create").classList.add("active");
});

// Close popups
document.querySelector(".popup-join-chat .close-btn").addEventListener("click", () => {
  document.querySelector(".popup-join-chat").classList.remove("active");
  document.querySelector("#overlay-join").classList.remove("active");
});
document.querySelector(".popup-create-room .close-btn").addEventListener("click", () => {
  document.querySelector(".popup-create-room").classList.remove("active");
  document.querySelector("#overlay-create").classList.remove("active");
});

// Create room
document.getElementById("creating_room").addEventListener("click", async () => {
  const groupId = document.getElementById("create-room-code").value.trim();
  const groupName = document.getElementById("group-name").value.trim();

  if (!groupId || !groupName) {
    alert("Please enter both group code and name.");
    return;
  }

  localStorage.setItem("groupId", groupId);
  localStorage.setItem("groupName", groupName);
  localStorage.setItem("isCreated", "true");

  await writeDataBase(groupId, groupName);
  window.location.href = "index2.html";
});

// Join room
document.getElementById("joining_chat").addEventListener("click", async () => {
  const groupId = document.getElementById("created-room-code").value.trim();

  if (!groupId) {
    alert("Please enter room code.");
    return;
  }

  localStorage.setItem("groupId", groupId);
  localStorage.setItem("isCreated", "false");

  await joining_chat(groupId);
  window.location.href = "index2.html";
});
