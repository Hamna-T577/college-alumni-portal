document.addEventListener("DOMContentLoaded", function () {
    const applicationsList = document.getElementById("applications-list");

    function fetchMyApplications() {
        fetch("/get-my-applications")
            .then(response => response.json())
            .then(applications => {
                applicationsList.innerHTML = "";

                if (applications.length === 0) {
                    applicationsList.innerHTML = "<p>No job applications found.</p>";
                    return;
                }

                applications.forEach(app => {
                    const appItem = document.createElement("div");
                    appItem.classList.add("application-card");

                    appItem.innerHTML = `
                        <h3>${app.title} at ${app.company}</h3>
                        <p><strong>Location:</strong> ${app.location}</p>
                        <p><strong>Skills Required:</strong> ${app.skills_required}</p>
                        <p><strong>Application Date:</strong> ${app.application_date}</p>
                        <p><strong>Status:</strong> <span class="status">${app.status}</span></p>
                    `;

                    applicationsList.appendChild(appItem);
                });
            })
            .catch(error => {
                console.error("❌ Error fetching applications:", error);
                applicationsList.innerHTML = "<p>❌ Failed to load applications.</p>";
            });
    }

    fetchApplications();
});
