document.addEventListener("DOMContentLoaded", function () {
    // ======================
    // 1. HELPER FUNCTIONS
    // ======================
    const safeTextContent = (elementId, text, fallback = "Not Available") => {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text || fallback;
    };

    const showMessage = (element, text, color) => {
        if (element) {
            element.textContent = text;
            element.style.color = color;
        }
    };

    const showToast = (message, type = "info") => {
        // Implement toast system or use console as fallback
        console.log(`${type.toUpperCase()}: ${message}`);
        // Example: Toastify({ text: message, className: type }).showToast();
    };

    // ======================
    // 2. PROFILE DATA FETCHING
    // ======================
    const fetchProfile = async () => {
        try {
            const response = await fetch("/get-current-user");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const user = await response.json();
            if (user.error) throw new Error(user.error);

            // Update profile fields
            safeTextContent("profile-name", user.full_name);
            safeTextContent("profile-email", user.email);
            safeTextContent("profile-year", user.graduation_year);
            safeTextContent("skills-display", user.skills);

            // Set selected skills if dropdown is ready
            if (user.skills) {
                const skillArray = user.skills.split(", ").map(s => s.trim());
                $("#skill-select").val(skillArray).trigger("change");
            }
        } catch (error) {
            console.error("❌ Profile fetch error:", error);
            showToast("Failed to load profile data", "error");
        }
    };

    // ======================
    // 3. SKILLS MANAGEMENT
    // ======================
    const initializeSkills = async () => {
        try {
            const response = await fetch("/get-skills");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const skills = await response.json();
            
            $("#skill-select").select2({
                data: skills.map(skill => ({ id: skill, text: skill })),
                placeholder: "Select skills...",
                allowClear: true,
                width: '100%'
            });

            await fetchProfile(); // Load profile after dropdown is ready
        } catch (error) {
            console.error("❌ Skills init error:", error);
            showToast("Failed to load skills list", "error");
        }
    };

    // ✅ Update Skills function (exported to window)
    window.updateSkills = async () => {
        const selectedSkills = $("#skill-select").val();
        const messageEl = document.getElementById("skills-update-message");
        
        if (!selectedSkills?.length) {
            showMessage(messageEl, "❌ Please select at least one skill", "red");
            return;
        }

        try {
            const response = await fetch("/update-skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skills: selectedSkills.join(", ") })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            showMessage(messageEl, `✅ ${data.message || "Skills updated!"}`, "green");
            await fetchProfile(); // Refresh profile
            
        } catch (error) {
            console.error("❌ Skills update error:", error);
            showMessage(messageEl, `❌ ${error.message}`, "red");
        }
    };

    // ======================
    // 4. RESUME UPLOAD
    // ======================
    const uploadResume = async () => {
        const fileInput = document.getElementById("resume-file");
        const messageEl = document.getElementById("resume-upload-message");
        const validTypes = new Set([
            "application/pdf", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]);

        if (!fileInput.files?.length) {
            showMessage(messageEl, "❌ Please select a file first!", "red");
            return;
        }

        const file = fileInput.files[0];
        if (!validTypes.has(file.type)) {
            showMessage(messageEl, "❌ Only PDF/DOCX files allowed!", "red");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("resume", file);

            const response = await fetch("/upload_resume", {
                method: "POST",
                body: formData
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            showMessage(messageEl, `✅ Resume uploaded! Skills: ${data.skills}`, "green");
            safeTextContent("skills-display", data.skills);
            
        } catch (error) {
            console.error("❌ Upload error:", error);
            showMessage(messageEl, `❌ Upload failed: ${error.message}`, "red");
        }
    };

    // ======================
    // 5. INITIALIZATION
    // ======================
    initializeSkills();
});
