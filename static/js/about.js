document.addEventListener("DOMContentLoaded", function () {
    const loggedIn = {{ logged_in | tojson | default(false) }}; // Get login status from Flask

    document.getElementById("events-link").addEventListener("click", function (event) {
        if (!loggedIn) {
            event.preventDefault();
            alert("Please Login/Signup to access Events.");
        } else {
            window.location.href = "{{ url_for('events_page') }}"; 
        }
    });

    document.getElementById("jobs-link").addEventListener("click", function (event) {
        if (!loggedIn) {
            event.preventDefault();
            alert("Please Login/Signup to access Jobs.");
        } else {
            window.location.href = "{{ url_for('jobs_page') }}"; 
        }
    });
});
