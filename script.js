let currentRole = null;
let currentUser = null;
let overtimeRequests =
    JSON.parse(localStorage.getItem("overtimeRequests")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingTaskId = null;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("loginForm")
        .addEventListener("submit", handleLogin);
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        loginUser(userData.username, userData.role);
    }
});

function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById("roleSelect").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Simple validation (demo purposes)
    if (username && password && role) {
        loginUser(username, role);
    }
}

function loginUser(username, role) {
    currentUser = username;
    currentRole = role;
    localStorage.setItem("currentUser", JSON.stringify({ username, role }));

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    const roleDisplay =
        role === "teamleader"
            ? "Team Leader"
            : role === "operationalmanager"
            ? "Operational Manager"
            : role === "manager"
            ? "Team Manager"
            : role.charAt(0).toUpperCase() + role.slice(1);
    document.getElementById(
        "currentUser"
    ).textContent = `${roleDisplay}: ${username}`;
    document.getElementById("profileBtn").style.display =
        role === "employee" ? "inline-block" : "none";
    document.getElementById("analyticsBtn").style.display =
        role === "manager" || role === "operationalmanager"
            ? "inline-block"
            : "none";

    if (!document.getElementById("overtimeForm").hasEventListener) {
        document
            .getElementById("overtimeForm")
            .addEventListener("submit", submitOvertimeRequest);
        document
            .getElementById("taskForm")
            .addEventListener("submit", submitTask);
        document
            .getElementById("profileForm")
            .addEventListener("submit", updateProfile);
        document
            .getElementById("passwordForm")
            .addEventListener("submit", changePassword);
        document.getElementById("overtimeForm").hasEventListener = true;
    }
    loadProfile();
    updateView();
}

function logout() {
    currentUser = null;
    currentRole = null;
    localStorage.removeItem("currentUser");

    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
    document.getElementById("loginForm").reset();
}

function updateView() {
    document
        .getElementById("employeeView")
        .classList.toggle("active", currentRole === "employee");
    document
        .getElementById("managerView")
        .classList.toggle(
            "active",
            currentRole === "manager" ||
                currentRole === "teamleader" ||
                currentRole === "operationalmanager"
        );
    document.getElementById("profileView").classList.remove("active");
    document.getElementById("analyticsView").classList.remove("active");

    if (currentRole === "employee") {
        displayEmployeeTasks();
        displayEmployeeRequests();
    } else {
        displayPendingRequests();
    }
}

function showProfile() {
    document.getElementById("employeeView").classList.remove("active");
    document.getElementById("managerView").classList.remove("active");
    document.getElementById("analyticsView").classList.remove("active");
    document.getElementById("profileView").classList.add("active");
}

function showAnalytics() {
    document.getElementById("employeeView").classList.remove("active");
    document.getElementById("managerView").classList.remove("active");
    document.getElementById("profileView").classList.remove("active");
    document.getElementById("analyticsView").classList.add("active");
    generateAnalytics();
}

function backToMain() {
    updateView();
}

function loadProfile() {
    const profile =
        JSON.parse(localStorage.getItem(`profile_${currentUser}`)) || {};
    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";
    document.getElementById("profileDept").value = profile.department || "";
}

function updateProfile(e) {
    e.preventDefault();
    const profile = {
        name: document.getElementById("profileName").value,
        email: document.getElementById("profileEmail").value,
        department: document.getElementById("profileDept").value,
    };
    localStorage.setItem(`profile_${currentUser}`, JSON.stringify(profile));
    alert("Profile updated successfully!");
}

function changePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }

    // In a real app, you'd validate current password
    localStorage.setItem(`password_${currentUser}`, newPassword);
    document.getElementById("passwordForm").reset();
    alert("Password changed successfully!");
}

function submitOvertimeRequest(e) {
    e.preventDefault();

    const request = {
        id: Date.now(),
        user: currentUser,
        date: document.getElementById("overtimeDate").value,
        hours: parseFloat(document.getElementById("overtimeHours").value),
        reason: document.getElementById("overtimeReason").value,
        status: "pending",
        submittedAt: new Date().toISOString(),
    };

    overtimeRequests.push(request);
    localStorage.setItem("overtimeRequests", JSON.stringify(overtimeRequests));

    document.getElementById("overtimeForm").reset();
    displayEmployeeRequests();
    alert("Overtime request submitted successfully!");
}

function displayEmployeeRequests() {
    const container = document.getElementById("employeeRequests");
    container.innerHTML = "";

    overtimeRequests.forEach((request) => {
        const card = createRequestCard(request, false);
        container.appendChild(card);
    });
}

function displayPendingRequests() {
    const container = document.getElementById("pendingRequests");
    container.innerHTML = "";

    let pendingRequests;
    if (currentRole === "teamleader") {
        pendingRequests = overtimeRequests.filter(
            (req) => req.status === "pending"
        );
    } else if (currentRole === "manager") {
        pendingRequests = overtimeRequests.filter(
            (req) => req.status === "team-approved"
        );
    } else if (currentRole === "operationalmanager") {
        pendingRequests = overtimeRequests.filter(
            (req) => req.status === "manager-approved"
        );
    }

    pendingRequests.forEach((request) => {
        const card = createRequestCard(request, true);
        container.appendChild(card);
    });
}

function createRequestCard(request, showApprovalButtons) {
    const card = document.createElement("div");
    card.className = "request-card";

    const employeeTasks = showApprovalButtons
        ? getEmployeeTasksForDate(request.user || "Unknown", request.date)
        : "";

    card.innerHTML = `
        <div class="request-header">
            <strong>${request.date}</strong>
            <span class="status ${
                request.status
            }">${request.status.toUpperCase()}</span>
        </div>
        <p><strong>Employee:</strong> ${request.user || "Unknown"}</p>
        <p><strong>Hours:</strong> ${request.hours}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p><strong>Submitted:</strong> ${new Date(
            request.submittedAt
        ).toLocaleDateString()}</p>
        ${employeeTasks}
        ${
            showApprovalButtons
                ? `
            <div class="approval-buttons">
                <button class="approve" onclick="approveRequest(${request.id})">Approve</button>
                <button class="reject" onclick="rejectRequest(${request.id})">Reject</button>
            </div>
        `
                : ""
        }
    `;

    return card;
}

function approveRequest(id) {
    const request = overtimeRequests.find((req) => req.id === id);
    if (request) {
        if (currentRole === "teamleader") {
            request.status = "team-approved";
            alert(
                "Request approved by team leader. Awaiting team manager approval."
            );
        } else if (currentRole === "manager") {
            request.status = "manager-approved";
            alert(
                "Request approved by team manager. Awaiting operational manager approval."
            );
        } else if (currentRole === "operationalmanager") {
            request.status = "approved";
            alert("Request finally approved!");
        }
        localStorage.setItem(
            "overtimeRequests",
            JSON.stringify(overtimeRequests)
        );
        displayPendingRequests();
    }
}

function rejectRequest(id) {
    const request = overtimeRequests.find((req) => req.id === id);
    if (request) {
        request.status = "rejected";
        localStorage.setItem(
            "overtimeRequests",
            JSON.stringify(overtimeRequests)
        );
        displayPendingRequests();
        alert("Request rejected!");
    }
}

function generateAnalytics() {
    const monthlyData = getMonthlyData();
    const statusData = getStatusData();

    displayMonthlyChart(monthlyData);
    displayStatusChart(statusData);
    displayTimeline();
}

function getMonthlyData() {
    const months = {};
    overtimeRequests.forEach((req) => {
        if (req.status === "approved") {
            const month = new Date(req.date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
            });
            months[month] = (months[month] || 0) + req.hours;
        }
    });
    return months;
}

function getStatusData() {
    const status = {
        pending: 0,
        "team-approved": 0,
        "manager-approved": 0,
        approved: 0,
        rejected: 0,
    };
    overtimeRequests.forEach((req) => {
        status[req.status] = (status[req.status] || 0) + 1;
    });
    return status;
}

function displayMonthlyChart(data) {
    const container = document.getElementById("monthlyChart");
    const maxHours = Math.max(...Object.values(data), 1);

    container.innerHTML = Object.entries(data)
        .map(
            ([month, hours]) => `
        <div class="bar-item">
            <div class="bar" style="height: ${(hours / maxHours) * 100}%"></div>
            <span class="bar-label">${month}</span>
            <span class="bar-value">${hours}h</span>
        </div>
    `
        )
        .join("");
}

function displayStatusChart(data) {
    const container = document.getElementById("statusChart");
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;

    container.innerHTML = Object.entries(data)
        .map(
            ([status, count]) => `
        <div class="status-item">
            <div class="status-bar ${status}" style="width: ${
                (count / total) * 100
            }%"></div>
            <span>${status}: ${count}</span>
        </div>
    `
        )
        .join("");
}

function displayTimeline() {
    const container = document.getElementById("timelineChart");
    const recent = overtimeRequests.slice(-10).reverse();

    container.innerHTML = recent
        .map(
            (req) => `
        <div class="timeline-item">
            <div class="timeline-date">${new Date(
                req.submittedAt
            ).toLocaleDateString()}</div>
            <div class="timeline-content">
                <strong>${req.hours}h</strong> - ${req.reason.substring(
                0,
                30
            )}...
                <span class="status ${req.status}">${req.status}</span>
            </div>
        </div>
    `
        )
        .join("");
}

function submitTask(e) {
    e.preventDefault();

    const task = {
        id: editingTaskId || Date.now(),
        date: document.getElementById("taskDate").value,
        time: document.getElementById("taskTime").value,
        hours: parseFloat(document.getElementById("taskHours").value),
        details: document.getElementById("taskDetails").value,
        user: currentUser,
    };

    if (editingTaskId) {
        const index = tasks.findIndex((t) => t.id === editingTaskId);
        tasks[index] = task;
        editingTaskId = null;
        document.querySelector("#taskForm button").textContent = "Add Task";
    } else {
        tasks.push(task);
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    document.getElementById("taskForm").reset();
    displayEmployeeTasks();
}

function displayEmployeeTasks() {
    const container = document.getElementById("employeeTasks");
    const userTasks = tasks.filter((task) => task.user === currentUser);

    container.innerHTML = userTasks
        .map((task) => {
            const isLocked = isTaskLocked(task.date);
            return `
            <div class="task-card ${isLocked ? "locked" : ""}">
                <div class="task-header">
                    <strong>${task.date} at ${task.time}</strong>
                    <div>
                        ${
                            !isLocked
                                ? `
                            <button onclick="editTask(${task.id})">Edit</button>
                            <button onclick="deleteTask(${task.id})">Delete</button>
                        `
                                : '<span class="locked-text">Locked</span>'
                        }
                    </div>
                </div>
                <p><strong>Hours:</strong> ${task.hours}</p>
                <p><strong>Details:</strong> ${task.details}</p>
            </div>
        `;
        })
        .join("");
}

function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        document.getElementById("taskDate").value = task.date;
        document.getElementById("taskTime").value = task.time;
        document.getElementById("taskHours").value = task.hours;
        document.getElementById("taskDetails").value = task.details;
        editingTaskId = id;
        document.querySelector("#taskForm button").textContent = "Update Task";
    }
}

function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    displayEmployeeTasks();
}

function getEmployeeTasksForDate(username, date) {
    const userTasks = tasks.filter(
        (task) => task.user === username && task.date === date
    );

    if (userTasks.length === 0) {
        return "<p><strong>Tasks for this date:</strong> No tasks recorded</p>";
    }

    const taskList = userTasks
        .map(
            (task) =>
                `<div class="task-summary">${task.time} - ${task.hours}h: ${task.details}</div>`
        )
        .join("");

    return `<div class="employee-tasks"><strong>Tasks for this date:</strong>${taskList}</div>`;
}

function isTaskLocked(date) {
    return overtimeRequests.some(
        (req) =>
            req.user === currentUser &&
            req.date === date &&
            req.status === "approved"
    );
}
