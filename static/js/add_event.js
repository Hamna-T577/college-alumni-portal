document.getElementById("eventForm").addEventListener("submit", function(event) {
    event.preventDefault();
    let formData = new FormData(this);

    fetch("/add-event", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            window.location.href = "/";  // Redirect to homepage after adding event
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => console.error("Error:", error));
});
