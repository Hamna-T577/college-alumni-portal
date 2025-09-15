document.addEventListener("DOMContentLoaded", function () {
    // ✅ Fetch and display user profile
    function fetchProfile() {
        fetch("/get-current-user")
            .then(response => response.json())
            .then(user => {
                if (user.error) {
                    console.error("❌ Error fetching user data:", user.error);
                    return;
                }

                console.log("✅ User data received:", user); // Debugging

                // ✅ Update profile details
                document.getElementById("profile-name").textContent = user.full_name;
                document.getElementById("profile-email").textContent = user.email;
                document.getElementById("profile-year").textContent = user.graduation_year || "Not Available";
                document.getElementById("skills-display").textContent = user.skills || "No skills added.";

                // ✅ Set selected skills AFTER skills dropdown is populated
                setTimeout(() => {
                    let skillSelect = $("#skill-select");
                    if (user.skills && skillSelect.children().length > 0) {
                        let skillArray = user.skills.split(", ").map(skill => skill.trim());
                        skillSelect.val(skillArray).trigger("change");
                        console.log("✅ Skills set in dropdown:", skillArray); // Debugging
                    }
                }, 500);
            })
            .catch(error => console.error("❌ Error fetching profile:", error));
    }

    // ✅ Load skills from CSV & then fetch profile
    fetch("/get-skills")
        .then(response => response.json())
        .then(skills => {
            console.log("✅ Loaded skills from CSV:", skills); // Debugging

            $("#skill-select").select2({
                data: skills.map(skill => ({ id: skill, text: skill })), 
                placeholder: "Select skills...",
                allowClear: true,
                width: '100%' // ✅ Ensure dropdown is properly visible
            });

            // ✅ Ensure profile is fetched AFTER dropdown is ready
            setTimeout(fetchProfile, 500);
        })
        .catch(error => console.error("❌ Error loading skills:", error));

    // ✅ Update Skills Function
    window.updateSkills = function () {
        let selectedSkills = $("#skill-select").val();

        if (!selectedSkills || selectedSkills.length === 0) {
            alert("❌ Please select at least one skill.");
            return;
        }

        let skillsString = selectedSkills.join(", ");
        console.log("🛠️ Updating skills:", skillsString); // Debugging

        fetch("/update-skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills: skillsString })
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Server Response:", data); // Debugging
            if (data.message) {
                document.getElementById("skills-update-message").textContent = data.message;
                alert("✅ Skills updated successfully!");
                fetchProfile(); // ✅ Refresh profile after updating
            } else {
                alert("❌ Error: " + (data.error || "Unknown error"));
            }
        })
        .catch(error => console.error("❌ Error updating skills:", error));
    };

    // ✅ Fetch and display user's posted events
    function fetchMyEvents() {
        fetch("/my-events")
        .then(response => response.json())
        .then(events => {
            let eventList = document.getElementById("my-events-list");
            eventList.innerHTML = ""; // Clear previous content

            console.log("📢 Events Fetched:", events); // Debugging  

            if (events.length === 0) {
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

    // ✅ Delete Event Function
    window.deleteEvent = function(eventId) {
        if (!confirm("Are you sure you want to delete this event?")) return;

        fetch(`/delete-event/${eventId}`, { method: "DELETE" })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert("❌ " + data.error);
                } else {
                    alert("✅ " + data.message);
                    fetchMyEvents(); // ✅ Refresh event list
                }
            })
            .catch(error => console.error("❌ Error deleting event:", error));
    };

    // ✅ Call event fetch function when page loads
    fetchMyEvents();
   
    
// ✅ Resume Upload Function
function uploadResume() {
    const fileInput = document.getElementById('resume-file');
    const messageEl = document.getElementById('resume-upload-message');
    
    if (!fileInput.files[0]) {
        messageEl.textContent = "Please select a file first!";
        messageEl.style.color = "red";
        return;
    }

    const formData = new FormData();
    formData.append('resume', fileInput.files[0]);

    fetch('/upload_resume', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageEl.textContent = "✅ Resume uploaded successfully! Skills extracted: " + data.skills;
            messageEl.style.color = "green";
            
            // Optional: Auto-update skills display
            const skillsDisplay = document.getElementById('skills-display');
            if (skillsDisplay) {
                skillsDisplay.textContent = data.skills;
            }
        } else {
            messageEl.textContent = "❌ Error: " + data.error;
            messageEl.style.color = "red";
        }
    })
    .catch(error => {
        messageEl.textContent = "❌ Network error: " + error;
        messageEl.style.color = "red";
    });
}
    
});
