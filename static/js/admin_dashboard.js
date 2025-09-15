document.addEventListener("DOMContentLoaded", function () {
    const adminUserList = document.getElementById("admin-user-list");

    function fetchAllUsersForAdmin() {
        fetch("/get-all-users-admin")
            .then(response => response.json())
            .then(users => {
                adminUserList.innerHTML = ""; // Clear previous content

                if (!Array.isArray(users) || users.length === 0) {
                    adminUserList.innerHTML = "<p>No users found.</p>";
                    return;
                }

                // Start table
                let tableHTML = `
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Graduation Year</th>
                                <th>Skills</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                users.forEach(user => {
                    tableHTML += `
                        <tr>
                            <td>${user.full_name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${user.graduation_year || '-'}</td>
                            <td>${user.skills || '-'}</td>
                        </tr>
                    `;
                });

                tableHTML += `
                        </tbody>
                    </table>
                `;

                adminUserList.innerHTML = tableHTML;
            })
            .catch(error => {
                console.error("❌ Error fetching admin users:", error);
                adminUserList.innerHTML = "<p>❌ Failed to load users.</p>";
            });
    }

    if (adminUserList) {
        fetchAllUsersForAdmin();
    }
});
