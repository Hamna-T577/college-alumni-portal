// ✅ Function to search friends with improved logging & error handling
async function searchFriends() {
    let searchInput = document.getElementById("searchInput");
    if (!searchInput) {
        console.error("❌ ERROR: #searchInput not found in DOM");
        return;
    }
    
    let name = searchInput.value.trim();
    if (!name) {
        console.warn("⚠️ Skipping search because input is empty");
        return;
    }
    
    console.log(`🔍 Searching for users with name: ${name}`);
    
    try {
        let response = await fetch(`/search-users?name=${encodeURIComponent(name)}`);
        console.log(`📡 Request sent to /search-users?name=${name}`);
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        let users = await response.json();
        console.log("✅ Users received:", users);
        
        if (!Array.isArray(users)) {
            console.error("❌ Invalid response format:", users);
            return;
        }
        
        updateSearchResults(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
    }
}

// ✅ Function to update search results in DOM
// Updated sendConnection function
// Update the sendConnection function in search_friends.js
async function sendConnection(receiverId, receiverName) {
    const connectBtn = document.querySelector(`.connect-btn[data-userid="${receiverId}"]`);
    
    try {
        // Update button state
        connectBtn.disabled = true;
        connectBtn.textContent = 'Sending...';
        
        const response = await fetch("/send-connection-request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ receiver_id: receiverId }),
            credentials: "include"
        });

        // Check for HTTP errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        
        // Update UI on success
        connectBtn.textContent = 'Request Sent';
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-secondary');
        
        alert(`Connection request sent to ${receiverName}!`);

    } catch (error) {
        console.error("Connection error:", error);
        
        // Reset button state
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect';
        
        // Show user-friendly error
        alert(`Failed to send request: ${error.message}`);
    }
}
// Update your search results display to include connection buttons
function updateSearchResults(users) {
    let resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = "";

    users.forEach(user => {
        let item = document.createElement("div");
        item.className = "search-result-item d-flex justify-content-between align-items-center p-2";
        
        let nameSpan = document.createElement("span");
        nameSpan.textContent = user.full_name;
        nameSpan.style.cursor = "pointer";
        nameSpan.onclick = () => window.location.href = `/profile-suggestion/${user.id}`;
        
        let connectBtn = document.createElement("button");
        connectBtn.className = "btn btn-primary btn-sm connect-btn";
        connectBtn.textContent = "Connect";
        connectBtn.setAttribute("data-userid", user.id);
        connectBtn.onclick = (e) => {
            e.stopPropagation();
            sendConnection(user.id, user.full_name);
        };
        
        item.appendChild(nameSpan);
        item.appendChild(connectBtn);
        resultsContainer.appendChild(item);
    });
}




// ✅ Attach event listener when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    let searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => searchFriends());
    } else {
        console.error("❌ ERROR: #searchInput not found in DOM after page load");
    }
});


