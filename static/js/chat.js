const socket = io();

// Join Chat Room
socket.emit("join_chat");

// Send Message
function sendMessage(receiverId) {
    let message = document.getElementById("message-input").value;
    
    socket.emit("send_message", {
        receiver_id: receiverId,
        message: message
    });

    document.getElementById("message-input").value = "";
}

// Receive Message
socket.on("receive_message", function(data) {
    let chatBox = document.getElementById("chat-box");
    chatBox.innerHTML += `<p><b>User ${data.sender_id}:</b> ${data.message}</p>`;
});

function sendMessage(friendId) {
    let messageInput = document.getElementById("messageInput");
    let messageText = messageInput.value.trim();

    if (messageText === "") return;

    fetch(`/send-message/${friendId}`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
        headers: { "Content-Type": "application/json" }
    }).then(response => {
        if (response.ok) {
            // Append message to chat box instantly
            let chatBox = document.getElementById("chat-box");
            let newMessage = document.createElement("div");
            newMessage.classList.add("message", "sent");
            newMessage.innerHTML = `<p>${messageText}</p><span>Just now</span>`;
            chatBox.appendChild(newMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    messageInput.value = "";
}

// Modify your openChat function to:
function openChat(userId, userName) {
    // ... existing code ...
    
    // Update UI
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatName').textContent = userName;
    document.getElementById('chatAvatar').src = '/static/images/default_profile.png';
    document.getElementById('messageInput').style.display = 'flex';
    document.getElementById('selectConversation').style.display = 'none';
    
    // Clear and prepare messages container
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    // ... rest of your existing code ...
    
    // Auto-scroll to bottom after messages load
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Add this to handle new messages
function appendMessage(message, type) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">${message.message}</div>
        <div class="message-time">${time}</div>
    `;
    
    container.appendChild(messageDiv);
    
    // Auto-scroll only if user is near bottom
    const isNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
    if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
    }
}