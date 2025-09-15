// admin_dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Fetch all users when page loads
    fetchUsers();

    // Set up event listeners
    setupEventListeners();
});

function fetchUsers() {
    fetch('/admin/dashboard/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(users => {
            populateUsersTable(users);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            showAlert('Failed to load users. Please try again.', 'error');
        });
}

function populateUsersTable(users) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows

    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Determine role class
        let roleClass = '';
        if (user.role === 'admin') roleClass = 'role-admin';
        else if (user.role === 'alumni') roleClass = 'role-alumni';
        else if (user.role === 'student') roleClass = 'role-student';

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td class="${roleClass}">${user.role}</td>
            <td>${user.graduation_year || 'N/A'}</td>
            <td>
                <button class="edit-btn" data-id="${user.id}">Edit</button>
                <button class="delete-btn" data-id="${user.id}">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    // Edit button click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const userId = e.target.getAttribute('data-id');
            editUser(userId);
        }
        
        if (e.target.classList.contains('delete-btn')) {
            const userId = e.target.getAttribute('data-id');
            deleteUser(userId);
        }
    });
}

function editUser(userId) {
    // Find the user row
    const row = document.querySelector(`button[data-id="${userId}"]`).closest('tr');
    const cells = row.querySelectorAll('td');
    
    // Get current values
    const currentData = {
        id: userId,
        full_name: cells[1].textContent,
        email: cells[2].textContent,
        role: cells[3].textContent,
        graduation_year: cells[4].textContent
    };

    // Create edit form HTML
    const editForm = `
        <td>${currentData.id}</td>
        <td><input type="text" value="${currentData.full_name}" class="edit-field"></td>
        <td><input type="email" value="${currentData.email}" class="edit-field"></td>
        <td>
            <select class="edit-field role-select">
                <option value="admin" ${currentData.role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="alumni" ${currentData.role === 'alumni' ? 'selected' : ''}>Alumni</option>
                <option value="student" ${currentData.role === 'student' ? 'selected' : ''}>Student</option>
            </select>
        </td>
        <td><input type="number" value="${currentData.graduation_year === 'N/A' ? '' : currentData.graduation_year}" class="edit-field"></td>
        <td>
            <button class="save-btn" data-id="${userId}">Save</button>
            <button class="cancel-btn" data-id="${userId}">Cancel</button>
        </td>
    `;
    
    // Replace row content with edit form
    row.innerHTML = editForm;

    // Add event listeners for save and cancel
    row.querySelector('.save-btn').addEventListener('click', () => saveUser(userId));
    row.querySelector('.cancel-btn').addEventListener('click', () => fetchUsers());
}

function saveUser(userId) {
    const row = document.querySelector(`button[data-id="${userId}"]`).closest('tr');
    const inputs = row.querySelectorAll('.edit-field');
    const roleSelect = row.querySelector('.role-select');
    
    const updatedData = {
        id: userId,
        full_name: inputs[0].value,
        email: inputs[1].value,
        role: roleSelect.value,
        graduation_year: inputs[2].value || null
    };

    // Validate data
    if (!updatedData.full_name || !updatedData.email) {
        showAlert('Name and email are required fields', 'error');
        return;
    }

    // Send update to server
    fetch(`/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Update failed');
        }
        return response.json();
    })
    .then(data => {
        showAlert('User updated successfully', 'success');
        fetchUsers(); // Refresh the table
    })
    .catch(error => {
        console.error('Error updating user:', error);
        showAlert('Failed to update user', 'error');
    });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    fetch(`/admin/users/${userId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        return response.json();
    })
    .then(data => {
        showAlert('User deleted successfully', 'success');
        fetchUsers(); // Refresh the table
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user', 'error');
    });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.prepend(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}