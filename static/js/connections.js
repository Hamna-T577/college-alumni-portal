// Load all connection-related data
function loadConnectionData() {
    // Load accepted connections
    fetch('/get-connections')
        .then(response => response.json())
        .then(connections => {
            const container = document.getElementById('connectionsList');
            container.innerHTML = '';
            
            if (connections.length === 0) {
                container.innerHTML = '<p>No connections yet</p>';
                return;
            }
            
            connections.forEach(conn => {
                const div = document.createElement('div');
                div.className = 'connection-item';
                div.innerHTML = `
                    <div class="connection-info">
                        <img src="${conn.profile_image || '/static/images/default-profile.png'}" 
                             alt="${conn.full_name}" class="connection-avatar">
                        <div>
                            <h4>${conn.full_name}</h4>
                            <p>${conn.department || 'No department'} • ${conn.graduation_year || 'No year'}</p>
                            <small>${conn.connected_since ? new Date(conn.connected_since).toLocaleDateString() : ''}</small>
                        </div>
                    </div>
                    <button class="btn-chat" data-userid="${conn.id}" data-username="${conn.full_name}">
                        <i class="fas fa-comment"></i> Chat
                    </button>
                `;
                container.appendChild(div);
            });
            
            // Add event listeners to chat buttons
            document.querySelectorAll('.btn-chat').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.getAttribute('data-userid');
                    const userName = e.currentTarget.getAttribute('data-username');
                    openChat(userId, userName);
                });
            });
        });
    
    // Load pending requests
    fetch('/get-pending-requests')
        .then(response => response.json())
        .then(requests => {
            const container = document.getElementById('pendingRequestsList');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (requests.length === 0) {
                container.innerHTML = '<p>No pending requests</p>';
                return;
            }
            
            requests.forEach(req => {
                const div = document.createElement('div');
                div.className = 'request-item';
                div.innerHTML = `
                    <div class="request-info">
                        <img src="${req.profile_image || '/static/images/default-profile.png'}" 
                             alt="${req.full_name}" class="request-avatar">
                        <div>
                            <h4>${req.full_name}</h4>
                            <small>${req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}</small>
                        </div>
                    </div>
                    <div class="request-actions">
                        <button class="btn-accept" data-requestid="${req.id}">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn-reject" data-requestid="${req.id}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                `;
                container.appendChild(div);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.btn-accept').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    respondToRequest(e.target.getAttribute('data-requestid'), 'accept');
                });
            });
            
            document.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    respondToRequest(e.target.getAttribute('data-requestid'), 'reject');
                });
            });
        });
}

// Function to respond to connection request
function respondToRequest(requestId, action) {
    fetch('/respond-to-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            request_id: requestId,
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Request ${action}ed`);
            loadConnectionData(); // Refresh the lists
        } else {
            alert(data.error || 'Failed to process request');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to process request');
    });
}

// Function to send connection request
function sendConnectionRequest(receiverId) {
    fetch('/send-connection-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            receiver_id: receiverId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Connection request sent!');
        } else {
            alert(data.error || 'Failed to send request');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to send request');
    });
}

// Initialize Socket.IO for real-time updates
const socket = io();

// Handle new connection requests
socket.on('new_connection_request', (data) => {
    // Show notification
    alert(`New connection request from ${data.sender_name}`);
    
    // Refresh pending requests if on requests page
    if (window.location.pathname.includes('requests')) {
        loadConnectionData();
    }
});

// Handle connection request responses
socket.on('connection_request_response', (data) => {
    const status = data.status === 'accepted' ? 'accepted' : 'rejected';
    alert(`Your connection request was ${status}`);
    loadConnectionData(); // Refresh connections list
});

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadConnectionData);