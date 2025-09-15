document.addEventListener('DOMContentLoaded', function() {
    loadRequests();
});

function loadRequests() {
    fetch('/get-pending-requests')
        .then(response => response.json())
        .then(requests => {
            const container = document.getElementById('requests-container');
            
            if (requests.length === 0) {
                container.innerHTML = '<p>No pending requests</p>';
                return;
            }
            
            let html = '';
            requests.forEach(request => {
                html += `
                <div class="request-card">
                    <img src="${request.profile_image || '/static/images/default_profile.png'}" 
                         alt="${request.full_name}" class="request-avatar">
                    <div class="request-info">
                        <h3>${request.full_name}</h3>
                        <p>Request sent on ${new Date(request.created_at).toLocaleString()}</p>
                    </div>
                    <div class="request-actions">
                        <button class="btn-accept" data-id="${request.id}">Accept</button>
                        <button class="btn-reject" data-id="${request.id}">Reject</button>
                    </div>
                </div>
                `;
            });
            
            container.innerHTML = html;
            
            // Add event listeners
            document.querySelectorAll('.btn-accept').forEach(btn => {
                btn.addEventListener('click', () => {
                    respondToRequest(btn.getAttribute('data-id'), 'accept');
                });
            });
            
            document.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', () => {
                    respondToRequest(btn.getAttribute('data-id'), 'reject');
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('requests-container').innerHTML = `
                <p class="error">Failed to load requests: ${error.message}</p>
            `;
        });
}

function respondToRequest(requestId, action) {
    fetch('/respond-to-request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            request_id: requestId,
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadRequests(); // Refresh the list
            alert(`Request ${action}ed successfully`);
        } else {
            throw new Error(data.error || 'Failed to process request');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}