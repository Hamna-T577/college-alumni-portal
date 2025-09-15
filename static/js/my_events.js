document.addEventListener("DOMContentLoaded", function () {
    function fetchMyEvents() {
        let eventList = document.getElementById("my-events-list");
    
        // ✅ Check if container exists
        if (!eventList) {
            console.error("❌ Error: Events container not found in HTML.");
            return;
        }
    
        fetch("/my-events")
        .then(response => response.json())
        .then(events => {
            eventList.innerHTML = ""; // Clear previous content
            console.log("📢 Events Fetched:", events); // ✅ Debugging
    
            if (!Array.isArray(events) || events.length === 0) {
                eventList.innerHTML = "<p>You have not posted any events yet.</p>";
                return;
            }
    
            events.forEach(event => {
                let eventCard = document.createElement("div");
                eventCard.classList.add("event-card");
    
                eventCard.innerHTML = `
                    <img src="/${event.image_path}" alt="Event Image">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Posted On:</strong> ${new Date(event.created_at).toLocaleDateString()}</p>
                    <button onclick="deleteEvent(${event.id})" class="delete-btn">🗑️ Delete</button>
                `;
    
                eventList.appendChild(eventCard);
            });
        })
        .catch(error => console.error("❌ Error fetching events:", error));
    }
    
});

// ✅ Delete Event Function
function deleteEvent(eventId) {
    if (confirm("Are you sure you want to delete this event?")) {
        fetch(`/delete-event/${eventId}`, { method: "DELETE" })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(error => console.error("❌ Error deleting event:", error));
    }
}

// ✅ Edit Event Function
function editEvent(eventId) {
    window.location.href = `/edit-event/${eventId}`;
}
