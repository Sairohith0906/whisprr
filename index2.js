import {
  listenForMessages,
  sendMessageToFirebase,
  writeName,
  listenToUsers,
  leaving,
  getGroupName
} from './combine.js';

window.addEventListener("DOMContentLoaded", async () => {
  const groupName = await getGroupName();
  document.getElementById("group-name").textContent = groupName;

  const storedName = localStorage.getItem("Name");

  if (storedName) {
    // If name already stored, skip overlay and re-register
    const success = await writeName(storedName);
    console.log("writeName success?", success);
    if (success) {
  document.getElementById("overlay").style.display = "none";
  listenForMessages(); // ✅ only one place
}
  } else {
    // Handle name entry if not already stored
    document.getElementById("enter-btn").addEventListener("click", async () => {
      const name = document.getElementById("username").value.trim();
      if (!name) {
        alert("Please enter your name");
        return;
      }

      localStorage.setItem("Name", name);
      const success = await writeName(name);
      if (success) {
        document.getElementById("overlay").style.display = "none";
        listenForMessages();
      }
    });
  }

  // Handle leave
  document.getElementById("leave-button").addEventListener("click", () => {
    leaving();
  });

  // Handle send message
  const input = document.getElementById("message-input");
 input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const message = input.value.trim();
    if (message) {
      await sendMessageToFirebase(message);
      input.value = "";
    }
  }
});


  // Listen to users
  listenToUsers((user) => {
  const userList = document.getElementById("user-list");
  const id = user.Name.toLowerCase().replace(/\s+/g, '-');
  let userDiv = document.getElementById(id);

  const lastSeen = new Date(user.LastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = user.Online ? '🟢 Online' : `⚫ ${lastSeen}`;

  if (!userDiv) {
    userDiv = document.createElement("div");
    userDiv.id = id;
    userDiv.className = "user-entry";
    userList.appendChild(userDiv);
  }

  userDiv.innerHTML = `
  <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.Name)}&background=random" style="width:24px; border-radius:50%; vertical-align:middle;" />
  <strong style="margin-left:10px;">${user.Name}</strong>
  <span style="color: ${user.Online ? 'green' : 'gray'}; margin-left: 10px;">
    ${status}
  </span>
`;

});

  // Listen to messages
  listenForMessages((name, msg, time) => {
    console.log("Message received from Firebase:", name, msg, time);
    const isOwn = name === localStorage.getItem("Name");
    appendMessage(name, msg, time, isOwn);
  });
});

function appendMessage(name, msg, time, isOwn = false) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isOwn ? 'you' : 'other'}`;

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="sender-name">${name}</div>
      <span class="message-line">
        <span>${msg}</span>
        <span class="meta">${time}</span>
      </span>
    </div>`;

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Clear name when the tab is closed
window.addEventListener("unload", () => {
  localStorage.removeItem("Name");
});
