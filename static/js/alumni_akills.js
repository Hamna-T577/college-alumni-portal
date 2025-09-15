document.addEventListener("DOMContentLoaded", function () {
    fetchUserSkills();
    document.getElementById("saveSkillsBtn").addEventListener("click", updateSkills);
});

// ✅ Fetch & Display User Skills
function fetchUserSkills() {
    fetch("/get-current-user")
        .then(response => response.json())
        .then(data => {
            if (data.skills) {
                document.getElementById("resume-skills").innerText = data.skills;
            } else {
                document.getElementById("resume-skills").innerText = "No skills found";
            }
        })
        .catch(error => console.error("Error loading skills:", error));
}

// ✅ Update User Skills
function updateSkills() {
    const manualSkills = document.getElementById("manual-skills").value;

    fetch("/update-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: manualSkills })
    })
    .then(response => response.json())
    .then(data => {
        if (data.skills) {
            document.getElementById("resume-skills").innerText = data.skills;
            document.getElementById("skills-update-message").innerText = "Skills updated successfully!";
        } else {
            document.getElementById("skills-update-message").innerText = data.error;
        }
    })
    .catch(error => console.error("Error updating skills:", error));
}
