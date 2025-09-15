document.addEventListener("DOMContentLoaded", function () {
    function fetchRecommendedJobs() {
        let jobList = document.getElementById("recommended-jobs");

        // ✅ Check if job list container exists
        if (!jobList) {
            console.error("❌ Error: Recommended job container not found in HTML.");
            return;
        }

        fetch("/recommend-jobs")  // ✅ Fixed API route
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(jobs => {
                jobList.innerHTML = ""; // Clear previous content

                if (!Array.isArray(jobs) || jobs.length === 0) {
                    jobList.innerHTML = "<p>No recommended jobs at the moment.</p>";
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
                        <p><strong>Posted By:</strong> ${job.posted_by}</p>
                        <p><strong>Similarity Score:</strong> ${job.similarity_score}</p>
                        <button onclick="applyForJob(${job.id})" class="apply-btn">Apply Now</button>
                    `;

                    jobList.appendChild(jobCard);
                });
            })
            .catch(error => console.error("❌ Error fetching recommended jobs:", error));
    }

    fetchRecommendedJobs();

    window.applyForJob = function (jobId) {
        fetch("/apply-job", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: jobId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("❌ " + data.error);
            } else {
                alert("✅ " + data.message);
            }
        })
        .catch(error => console.error("❌ Error applying for job:", error));
    };
});
