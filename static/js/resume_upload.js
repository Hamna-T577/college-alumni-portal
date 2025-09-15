document.addEventListener("DOMContentLoaded", function () {
    const resumeForm = document.getElementById("resumeUploadForm");

    if (!resumeForm) return; // ✅ Exit if form is not found

    resumeForm.addEventListener("submit", function (event) {
        event.preventDefault();

        let formData = new FormData();
        let fileInput = document.getElementById("resume");

        if (fileInput.files.length === 0) {
            alert("Please select a file before uploading.");
            return;
        }

        formData.append("resume", fileInput.files[0]);

        fetch("/upload-resume", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById("uploadMessage").textContent = data.message || data.error;
        })
        .catch(error => console.error("❌ Error uploading resume:", error));
    });
});
