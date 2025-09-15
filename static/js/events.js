document.addEventListener("DOMContentLoaded", function() {
    let eventContainer = document.getElementById("event-list");

    if (!eventContainer) {
        console.error("❌ Error: 'event-list' not found in HTML!");
        return;
    }

    fetch("/get-events")
    .then(response => response.json())
    .then(events => {
        eventContainer.innerHTML = "";
        if (events.length === 0) {
            eventContainer.innerHTML = "<p>No upcoming events.</p>";
        } else {
            events.forEach(event => {
                eventContainer.innerHTML += `
                    <div class="event-card">
                        <img src="${event.image_path}" alt="${event.title}">
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                        <p><strong>Posted by:</strong> ${event.posted_by} on ${event.created_at}</p>
                    </div>
                `;
            });
        }
    })
    .catch(error => console.error("❌ Error fetching events:", error));
    
});
