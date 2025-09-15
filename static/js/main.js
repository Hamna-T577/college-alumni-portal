document.addEventListener("DOMContentLoaded", function () {
    /** =================== GLOBAL VARIABLES =================== **/
    const sendOtpBtn = document.getElementById("send-otp");
    const verifyOtpBtn = document.getElementById("verify-otp");
    const loginForm = document.getElementById("login-form");

    const emailInput = document.getElementById("email");
    const otpInput = document.getElementById("otp");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const fullNameInput = document.getElementById("full_name");

    const otpGroup = document.getElementById("otp-group");
    const otpSentMessage = document.getElementById("otp-sent-message");
    const notificationBox = document.getElementById("notification");
    const loginMessage = document.getElementById("login-message");

    /** ✅ Show Notification **/
    function showNotification(message, type) {
        if (!notificationBox) return;
        notificationBox.innerText = message;
        notificationBox.className = `notification-box ${type}`;
        notificationBox.style.display = "block";
        setTimeout(() => {
            notificationBox.style.display = "none";
        }, 3000);
    }

    /** ✅ Send OTP **/
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener("click", function () {
            const email = emailInput.value.trim();
            const fullName = fullNameInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // ✅ Field validation
            if (!email || !fullName || !password || !confirmPassword) {
                showNotification("Please fill in all fields before requesting OTP.", "error");
                return;
            }

            if (password !== confirmPassword) {
                showNotification("Passwords do not match!", "error");
                return;
            }


            // ✅ All good - send OTP
            fetch("/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === "OTP sent successfully") {
                    showNotification("OTP sent! Check your email.", "success");
                    otpSentMessage.style.display = "block";
                    otpGroup.style.display = "block";
                    verifyOtpBtn.style.display = "block";
                } else {
                    showNotification(data.error, "error");
                }
            })
            .catch(error => {
                console.error("Error sending OTP:", error);
                showNotification("Failed to send OTP. Try again later.", "error");
            });
        });
    }

    /** ✅ Verify OTP & Register **/
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener("click", function () {
            const email = emailInput.value.trim();
            const otp = otpInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const fullName = fullNameInput.value.trim();

            if (!otp || !password || !fullName) {
                showNotification("Please enter all required fields.", "error");
                return;
            }

            if (password !== confirmPassword) {
                showNotification("Passwords do not match!", "error");
                return;
            }

            fetch("/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp,
                    full_name: fullName,
                    password,
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification("Registration successful! Redirecting...", "success");
                    const successMessage = document.getElementById("success-message");
                    if (successMessage) successMessage.style.display = "block";
                    setTimeout(() => {
                        window.location.href = "/login-page";
                    }, 2000);
                } else {
                    showNotification(data.error, "error");
                }
            })
            .catch(error => {
                console.error("Error verifying OTP:", error);
                showNotification("Failed to verify OTP. Try again later.", "error");
            });
        });
    }

    

    /** ✅ Login **/
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            if (!email || !password) {
                showNotification("Please enter both email and password.", "error");
                return;
            }

            fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === "Login successful") {
                    showNotification("Login successful! Redirecting...", "success");
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 2000);
                } else {
                    if (loginMessage) {
                        loginMessage.innerText = data.error || "Invalid credentials.";
                        loginMessage.style.color = "red";
                        loginMessage.style.display = "block";
                    }
                }
            })
            .catch(error => {
                console.error("Error logging in:", error);
                if (loginMessage) {
                    loginMessage.innerText = "Something went wrong. Please try again.";
                    loginMessage.style.display = "block";
                }
            });
        });
    }
});
