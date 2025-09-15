document.addEventListener("DOMContentLoaded", function () {
    const applicationsList = document.getElementById("applications-list");

    if (applicationsList) {
        fetchApplications();
    }

    function fetchApplications() {
        fetch("/get-applications")
            .then(response => response.json())
            .then(applications => {
                applicationsList.innerHTML = "";

                if (!Array.isArray(applications) || applications.length === 0) {
                    applicationsList.innerHTML = "<p>No job applications found.</p>";
                    return;
                }

                applications.forEach(app => {
                    const appItem = document.createElement("div");
                    appItem.classList.add("application-card");

                    appItem.innerHTML = `
                        <h3>${app.job_title} at ${app.company}</h3>
                        <p><strong>Applicant:</strong> ${app.applicant_name}</p>
                        <p><strong>Email:</strong> ${app.applicant_email}</p>
                        <p><strong>Status:</strong> <span class="status">${app.status}</span></p>
                        <button onclick="updateApplication(${app.application_id}, 'accepted')">✅ Accept</button>
                        <button onclick="updateApplication(${app.application_id}, 'rejected')" class="delete-btn">❌ Reject</button>
                    `;

                    applicationsList.appendChild(appItem);
                });
            })
            .catch(error => {
                console.error("❌ Error fetching applications:", error);
                applicationsList.innerHTML = "<p>❌ Failed to load applications.</p>";
            });
    }

    window.updateApplication = function (appId, status) {
        if (!confirm(`Are you sure you want to mark this application as ${status}?`)) return;

        fetch(`/update-application/${appId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchApplications(); // Refresh
        })
        .catch(error => console.error("❌ Error updating application:", error));
    };
});
