document.addEventListener("DOMContentLoaded", function () {
    const jobList = document.getElementById("job-list");
    const recommendedJobContainer = document.getElementById("recommended-jobs");

    // ✅ Only run fetchJobs() if `job-list` exists (to prevent errors)
    if (jobList) {
        fetchJobs();
    }

    // ✅ Only run fetchRecommendedJobs() if `recommended-jobs` exists
    if (recommendedJobContainer) {
        fetchRecommendedJobs();
    }

    // 🔹 Fetch all jobs (Only runs if `job-list` is present)
    function fetchJobs() {
        fetch("/get-jobs")
            .then(response => response.json())
            .then(jobs => {
                jobList.innerHTML = ""; // ✅ Clear previous content

                if (jobs.length === 0) {
                    jobList.innerHTML = "<p>No available jobs at the moment.</p>";
                    return;
                }

                jobs.forEach(job => {
                    let jobCard = document.createElement("div");
                    jobCard.classList.add("job-card");

                    jobCard.innerHTML = `
                        <h3>${job.title}</h3>
                        <p><strong>Company:</strong> ${job.company}</p>
                        <p><strong>Location:</strong> ${job.location}</p>
                        <p><strong>Required Skills:</strong> ${job.skills_required}</p>
                        <button onclick="applyJob(${job.id})" class="apply-btn">Apply Now</button>
                    `;

                    jobList.appendChild(jobCard);
                });
            })
            .catch(error => console.error("❌ Error fetching jobs:", error));
    }

    // 🔹 Fetch AI-recommended jobs (Only runs if `recommended-jobs` is present)
    function fetchRecommendedJobs() {
        fetch("/recommend-jobs")
            .then(response => response.json())
            .then(data => {
                console.log("🔍 Recommended Jobs API Response:", data);

                recommendedJobContainer.innerHTML = ""; // ✅ Clear previous data

                if (data.error) {
                    recommendedJobContainer.innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                if (data.length === 0) {
                    recommendedJobContainer.innerHTML = `<p>No recommended jobs available.</p>`;
                    return;
                }

                data.forEach(job => {
                    const jobElement = document.createElement("div");
                    jobElement.classList.add("job-card");
                    jobElement.innerHTML = `
                        <h3>${job.title}</h3>
                        <p><strong>Company:</strong> ${job.company}</p>
                        <p><strong>Location:</strong> ${job.location}</p>
                        <p><strong>Skills Required:</strong> ${job.skills_required}</p>
                        <button onclick="applyJob(${job.id})" class="apply-btn">📩 Apply</button>
                    `;
                    recommendedJobContainer.appendChild(jobElement);
                });
            })
            .catch(error => console.error("❌ Error fetching recommended jobs:", error));
    }

    // 🔹 Apply for a job
    window.applyJob = function (jobId) {
        if (!confirm("Do you want to apply for this job?")) return;

        fetch("/apply-job", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: jobId })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message ? `✅ ${data.message}` : `❌ Error: ${data.error}`);
        })
        .catch(error => console.error("❌ Error applying for job:", error));
    };

    // 🔹 Delete a job (Only admin should see delete option)
    window.deleteJob = function (jobId) {
        if (!confirm("Are you sure you want to delete this job?")) return;

        fetch(`/delete-job/${jobId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchJobs(); // ✅ Refresh job list after deleting
        })
        .catch(error => console.error("❌ Error deleting job:", error));
    };
});
function renderJobs(jobs) {
    const container = document.getElementById('job-list');
    container.innerHTML = '';
    
    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.description}</p>
            <div class="job-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <span><i class="fas fa-briefcase"></i> ${job.type}</span>
            </div>
            <button class="apply-btn">Apply Now</button>
        `;
        container.appendChild(card);
    });
}
