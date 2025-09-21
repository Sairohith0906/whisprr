import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onChildAdded,onChildChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAS8rUOHLnuzgzKc9fPI2O7HO99Xm5m-5g",
  authDomain: "whisprr-chatapplication.firebaseapp.com",
  databaseURL: "https://whisprr-chatapplication-default-rtdb.firebaseio.com",
  projectId: "whisprr-chatapplication",
  storageBucket: "whisprr-chatapplication.appspot.com",
  messagingSenderId: "481915383081",
  appId: "1:481915383081:web:d72b528c66f38ce280db38"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const groupRef = 'groups/';
let currentUserRef = null;

function getCurrentTimeAMPM() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

async function writeDataBase(groupId, groupName) {
  const snapshot = await get(ref(db, groupRef + groupId));
  if (snapshot.exists()) {
    alert("Group already exists.");
    return false;
  }

  await set(ref(db, groupRef + groupId), {
    GroupName: groupName,
    Time: getCurrentTimeAMPM()
  });

  localStorage.setItem("groupId", groupId);
  localStorage.setItem("groupName", groupName);
  localStorage.setItem("isCreated", "true");
  window.location.href = "./index2.html";
  return true;
}

async function joining_chat(groupId) {
  const snapshot = await get(ref(db, groupRef + groupId));
  if (!snapshot.exists()) {
    alert("Group code does not exist.");
    return false;
  }

  localStorage.setItem("groupId", groupId);
  window.location.href = "./index2.html";
  return true;
}

async function getGroupName() {
  const groupId = localStorage.getItem("groupId");
  const snapshot = await get(ref(db, groupRef + groupId));
  return snapshot.exists() ? snapshot.val().GroupName : "Unknown Group";
}

function appendMessage(name, time, msg) {
  if (!msg) return;
  document.querySelector('.placeholder')?.remove();
  const chatBox = document.getElementById('chat-box');
  const className = 'user-' + name.toLowerCase().replace(/\s+/g, '-');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
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

async function sendMessageToFirebase(msg) {
  if (!msg.trim()) return;
  const groupId = localStorage.getItem("groupId");
  const name = localStorage.getItem("Name");
  const chatRef = ref(db, groupRef + groupId + '/chats');
  await push(chatRef, {
    Name: name,
    Text: msg,
    timestamp: Date.now()
  });
}

const initializedListeners = new Set();

function listenForMessages() {
  const groupId = localStorage.getItem("groupId");
  const name = localStorage.getItem("Name");
  if (!groupId || !name) return;

  if (initializedListeners.has(groupId)) return;
  initializedListeners.add(groupId);

  const chatRef = ref(db, groupRef + groupId + '/chats');
  const renderedKeys = new Set();

  // 1. Fetch and render existing messages
  get(chatRef).then(snapshot => {
    if (snapshot.exists()) {
      const messages = snapshot.val();
      Object.entries(messages).forEach(([key, data]) => {
        if (!renderedKeys.has(key)) {
          renderedKeys.add(key);
          const time = new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          appendMessage(data.Name, time, data.Text);
        }
      });
    }
  });

  // 2. Listen for new messages
  onChildAdded(chatRef, (snapshot) => {
    const key = snapshot.key;
    if (renderedKeys.has(key)) return; // Avoid duplicates

    renderedKeys.add(key); // Mark as rendered
    const data = snapshot.val();
    const time = new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendMessage(data.Name, time, data.Text);
  });
}




async function writeName(Name) {
  const groupId = localStorage.getItem("groupId");
  if (!groupId || !Name) return false;

  const usersRef = ref(db, groupRef + groupId + '/users');
  const usersSnapshot = await get(usersRef);

  if (usersSnapshot.exists()) {
    const users = usersSnapshot.val();
    const nameAlreadyExists = Object.values(users).some(user => user.Name === Name);

    if (nameAlreadyExists && localStorage.getItem("Name") === Name) {
      console.log("Name reused in another tab. Continuing silently...");
      startPresenceTracking(groupId, Name);
      return true;
    }

    if (nameAlreadyExists) {
      alert("Name already exists in this group.");
      return false;
    }
  }

  currentUserRef = push(usersRef);
  const userData = {
    Name: Name,
    Online: true,
    LastSeen: Date.now(),
    Admin: false
  };

  if (localStorage.getItem("isCreated") === "true") {
    userData.Admin = true;
    localStorage.setItem("isCreated", "false");
  }

  await set(currentUserRef, userData);
  localStorage.setItem("Name", Name);
  startPresenceTracking(groupId, Name);
  return true;
}


function startPresenceTracking(groupId, name) {
  if (!currentUserRef) return;
  const interval = setInterval(() => {
    set(currentUserRef, {
      Name: name,
      Online: true,
      LastSeen: Date.now()
    });
  }, 60000);

  window.addEventListener("beforeunload", () => {
    set(currentUserRef, {
      Name: name,
      Online: false,
      LastSeen: Date.now()
    });
    clearInterval(interval);
  });
}

async function leaving() {
  const groupId = localStorage.getItem("groupId");
  const name = localStorage.getItem("Name");
  const usersRef = ref(db, groupRef + groupId + "/users/");
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const users = snapshot.val();
    const user = Object.values(users).find(user => user.Name === name && user.Admin);
    if (user) {
      window.location.href = "./index.html";
      return;
    }
  }
  alert("You are not admin.");
}

function listenToUsers(callback) {
  const groupId = localStorage.getItem("groupId");
  const usersRef = ref(db, groupRef + groupId + '/users');

  onChildAdded(usersRef, (snapshot) => {
    callback(snapshot.val());
  });

  onChildChanged(usersRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export {
  writeDataBase,
  joining_chat,
  getGroupName,
  writeName,
  listenForMessages,
  sendMessageToFirebase,
  listenToUsers,
  getCurrentTimeAMPM,
  leaving
};
