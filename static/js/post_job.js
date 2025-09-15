document.addEventListener("DOMContentLoaded", function () {
    let form = document.getElementById("postJobForm");

    if (!form) {
        console.error("Error: Form not found! Make sure your form has id='postJobForm'");
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent page reload

        let formData = {
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            company: document.getElementById("company").value,
            location: document.getElementById("location").value,
            skills_required: document.getElementById("skills_required").value
        };

        fetch("/post-job", {  // ✅ Ensure this matches Flask API
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                document.getElementById("message").innerText = "Job posted successfully!";
                document.getElementById("message").style.color = "green";
                form.reset();  // ✅ Clear form fields after success
            } else {
                document.getElementById("message").innerText = "Error: " + data.error;
                document.getElementById("message").style.color = "red";
            }
        })
        .catch(error => console.error("Error:", error));
    });
});
