document.addEventListener("DOMContentLoaded", function() {
    // Login restriction for restricted buttons (Jobs, Events)
    if (typeof loggedIn !== "undefined" && !loggedIn) {
        document.querySelectorAll(".restricted").forEach(btn => {
            btn.addEventListener("click", function(event) {
                event.preventDefault();
                alert("Login/Signup");
            });
        });
    }

    // Show login message when batchmate search bar is focused
    const searchInput = document.getElementById("batchmate-search");
    const loginMessage = document.getElementById("login-message");

    if (!loggedIn && searchInput && loginMessage) {
        searchInput.addEventListener("focus", function() {
            loginMessage.style.display = "block";
        });
    }

    // Intersection Observer for principal section
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    });

    const princiSection = document.querySelector(".princi");
    if (princiSection) {
        observer.observe(princiSection);
    }

    // Alumni carousel hover effect
    const track = document.querySelector('.alumni-track');
    if (track) {
        track.addEventListener('mouseover', () => track.style.animationPlayState = 'paused');
        track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
    }

    // Testimonial scroll buttons
    const scrollContainer = document.getElementById('scrollContainer');
    if (scrollContainer) {
        document.querySelector('.arrow.left')?.addEventListener('click', () => scrollContainer.scrollBy({ left: -300, behavior: 'smooth' }));
        document.querySelector('.arrow.right')?.addEventListener('click', () => scrollContainer.scrollBy({ left: 300, behavior: 'smooth' }));
    }
});
