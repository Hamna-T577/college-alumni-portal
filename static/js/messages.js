let currentChatUserId = null;
const socket = io();
let isTyping = false;
let typingTimeout;

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
});

function initializeChat() {
    // Check URL for direct chat link
    const urlParams = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');
    const otherUserId = pathParts[pathParts.length - 1];

    if (otherUserId && !isNaN(otherUserId)) {
        openChat(parseInt(otherUserId), '');
    } else {
        loadConversations();
    }

    // Join user's room when connected
    socket.on('connect', () => {
        const userId = getCurrentUserId();
        if (userId) {
            socket.emit('join', { userId });
        }
    });

    // Setup socket listeners
    setupSocketListeners();
}

function setupSocketListeners() {
    // Handle incoming messages
    socket.on('new_message', (message) => {
        handleIncomingMessage(message);
    });

    // Handle message confirmation
    socket.on('message_confirmed', (confirmedMessage) => {
        updateTempMessage(confirmedMessage);
    });

    // Handle typing indicators
    socket.on('user_typing', (data) => {
        if (data.sender_id === currentChatUserId) {
            showTypingIndicator(data.sender_id);
        }
    });

    // Handle application status updates
    socket.on('application_status_update', (data) => {
        if (data.job_id) {
            updateApplicationStatusUI(data);
        }
    });
}

function setupEventListeners() {
    // Message input events
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        messageInput.addEventListener('input', () => {
            handleTyping();
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchUsers, 300));
    }

    // Responsive menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
}

async function openChat(userId, userName) {
    try {
        currentChatUserId = userId;
        
        // Mark messages as read when opening chat
        if (userId) {
            await markMessagesAsRead(userId);
        }

        // Try to get user details if userName not provided
        if (!userName) {
            const userResponse = await fetch(`/get-user/${userId}`);
            if (!userResponse.ok) {
                throw new Error('Failed to load user info');
            }
            const user = await userResponse.json();
            userName = user.full_name;
        }
        
        // Update UI
        updateChatUI(userName);
        
        // Load messages
        await loadMessages(userId);
        
        // Scroll to bottom
        scrollToBottom();
        
    } catch (error) {
        console.error('Error opening chat:', error);
        showError('Failed to open chat', error.message);
    }
}

function updateChatUI(userName) {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;

    chatArea.innerHTML = `
        <div class="chat-header">
            <img src="/static/images/default_profile.png" 
                 alt="${userName}" class="user-avatar small">
            <h3>${userName}</h3>
            <div class="typing-indicator" id="typingIndicator" style="display: none;">
                <span>typing...</span>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="message-input-container">
            <input type="text" class="message-input" id="messageInput" placeholder="Message...">
            <button class="send-button" onclick="sendMessage()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;
}

async function loadMessages(userId) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    try {
        const messagesResponse = await fetch(`/get-messages/${userId}`);
        if (!messagesResponse.ok) {
            throw new Error('Failed to load messages');
        }
        const messages = await messagesResponse.json();
        
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const type = msg.sender_id === getCurrentUserId() ? 'sent' : 'received';
            appendMessage(msg, type);
        });
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load messages</p>
            </div>
        `;
    }
}

function appendMessage(message, type) {
    const container = document.getElementById('chatMessages');
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
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function handleIncomingMessage(message) {
    // Check if this message belongs to current chat
    if (currentChatUserId && 
        (currentChatUserId === message.sender_id || currentChatUserId === message.receiver_id)) {
        const type = message.sender_id === getCurrentUserId() ? 'sent' : 'received';
        appendMessage(message, type);
        scrollToBottom();
        
        // Mark as read if it's the current chat
        if (currentChatUserId === message.sender_id) {
            markMessagesAsRead(currentChatUserId);
        }
    }
    
    // Update conversation list to show new message
    updateConversationPreview(message);
    
    // Refresh conversation list
    loadConversations();
}

function updateConversationPreview(message) {
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => {
        const itemUserId = parseInt(item.getAttribute('data-userid'));
        if (itemUserId === message.sender_id || itemUserId === message.receiver_id) {
            const preview = item.querySelector('.conversation-preview');
            if (preview) {
                preview.textContent = message.message.length > 30 ? 
                    message.message.substring(0, 30) + '...' : 
                    message.message;
                
                // Highlight unread messages
                if (message.sender_id === itemUserId && message.receiver_id === getCurrentUserId()) {
                    item.classList.add('unread');
                    const unreadCount = item.querySelector('.unread-count') || 
                                        document.createElement('div');
                    unreadCount.className = 'unread-count';
                    unreadCount.textContent = parseInt(unreadCount.textContent || '0') + 1;
                    if (!item.contains(unreadCount)) {
                        item.appendChild(unreadCount);
                    }
                }
            }
        }
    });
}

async function markMessagesAsRead(userId) {
    try {
        await fetch(`/mark-messages-read/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // Update UI to remove unread indicators
        const conversationItem = document.querySelector(`.conversation-item[data-userid="${userId}"]`);
        if (conversationItem) {
            conversationItem.classList.remove('unread');
            const unreadCount = conversationItem.querySelector('.unread-count');
            if (unreadCount) {
                unreadCount.remove();
            }
        }
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message && currentChatUserId) {
        // Create temporary message (will be replaced when server confirms)
        const tempId = 'temp-' + Date.now();
        const tempMessage = {
            id: tempId,
            sender_id: getCurrentUserId(),
            receiver_id: currentChatUserId,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        // Display message immediately
        appendMessage(tempMessage, 'sent');
        scrollToBottom();
        input.value = '';
        
        // Reset typing indicator
        resetTyping();
        
        // Send to server
        socket.emit('send_message', {
            receiver_id: currentChatUserId,
            message: message
        });
    }
}

function updateTempMessage(confirmedMessage) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Find and replace temporary message
    const tempMessages = messagesContainer.querySelectorAll('[data-temp-id]');
    tempMessages.forEach(tempElement => {
        if (tempElement.getAttribute('data-temp-id') === confirmedMessage.tempId) {
            const newMessage = document.createElement('div');
            newMessage.className = 'message message-sent';
            newMessage.innerHTML = `
                <div class="message-content">${confirmedMessage.message}</div>
                <div class="message-time">${new Date(confirmedMessage.timestamp).toLocaleTimeString()}</div>
            `;
            tempElement.replaceWith(newMessage);
        }
    });
}

function handleTyping() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !currentChatUserId) return;
    
    if (messageInput.value.length > 0 && !isTyping) {
        isTyping = true;
        socket.emit('typing', {
            receiver_id: currentChatUserId,
            isTyping: true
        });
    } else if (messageInput.value.length === 0 && isTyping) {
        resetTyping();
    }
    
    // Reset the typing timeout
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(resetTyping, 2000);
}

function resetTyping() {
    if (isTyping && currentChatUserId) {
        isTyping = false;
        socket.emit('typing', {
            receiver_id: currentChatUserId,
            isTyping: false
        });
        hideTypingIndicator();
    }
}

function showTypingIndicator(userId) {
    if (userId === currentChatUserId) {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'block';
            setTimeout(hideTypingIndicator, 3000);
        }
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function loadConversations() {
    const container = document.getElementById('conversationList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading conversations...</div>';
    
    fetch('/get-conversations')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(conversations => {
            if (!Array.isArray(conversations)) {
                throw new Error('Invalid data format received');
            }
            
            renderConversationList(conversations, container);
        })
        .catch(error => {
            console.error('Error loading conversations:', error);
            showErrorInContainer(container, error);
        });
}

function renderConversationList(conversations, container) {
    if (conversations.length === 0) {
        container.innerHTML = '<div class="no-conversations">No conversations yet</div>';
        return;
    }
    
    let html = '';
    conversations.forEach(conv => {
        const lastMsg = conv.last_message ? 
            (conv.last_message.length > 30 ? 
             conv.last_message.substring(0, 30) + '...' : 
             conv.last_message) : 
            'No messages yet';
        
        const unreadClass = conv.unread_count > 0 ? 'unread' : '';
        
        html += `
        <div class="conversation-item ${unreadClass}" data-userid="${conv.user_id}" 
             onclick="openChat(${conv.user_id}, '${escapeHtml(conv.full_name)}')">
            <img src="${conv.profile_image || '/static/images/default_profile.png'}" 
                 alt="${escapeHtml(conv.full_name)}" class="user-avatar">
            <div class="conversation-info">
                <h3 class="conversation-name">${escapeHtml(conv.full_name)}</h3>
                <p class="conversation-preview">${escapeHtml(lastMsg)}</p>
            </div>
            ${conv.unread_count > 0 ? `<div class="unread-count">${conv.unread_count}</div>` : ''}
        </div>
        `;
    });
    
    container.innerHTML = html;
}

function searchUsers() {
    const searchInput = document.getElementById('searchUsers');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (query.length < 2) return;
    
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    fetch(`/search-users?name=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Search failed');
            }
            return response.json();
        })
        .then(users => {
            if (users.error) {
                throw new Error(users.error);
            }
            
            if (users.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No users found</div>';
                return;
            }
            
            let html = '<div class="search-results-list">';
            users.forEach(user => {
                html += `
                <div class="search-result-item" onclick="openChat(${user.id}, '${escapeHtml(user.full_name)}')">
                    <img src="/static/images/default_profile.png" alt="${escapeHtml(user.full_name)}" class="user-avatar small">
                    <div class="search-result-info">
                        <h4>${escapeHtml(user.full_name)}</h4>
                        <p>${user.role} • Class of ${user.graduation_year || 'N/A'}</p>
                    </div>
                </div>
                `;
            });
            html += '</div>';
            
            resultsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${error.message || 'Search failed'}</p>
                </div>
            `;
        });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showError(title, message) {
    // Implement your error display logic here
    console.error(title, message);
    alert(`${title}: ${message}`);
}

function showErrorInContainer(container, error) {
    if (!container) return;
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${error.message || 'Failed to load data'}</p>
            <button onclick="loadConversations()">Try Again</button>
        </div>
    `;
}

function getCurrentUserId() {
    // Implement based on your authentication system
    // This might come from a meta tag, global variable, or API call
    return document.body.dataset.userId || null;
}

function updateApplicationStatusUI(data) {
    // Implement this based on your application status UI
    const appElement = document.querySelector(`.application[data-id="${data.application_id}"]`);
    if (appElement) {
        const statusElement = appElement.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = data.new_status;
            statusElement.className = `status ${data.new_status}`;
        }
    }
}