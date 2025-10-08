let currentRole = null;
let currentUser = null;
let overtimeRequests =
    JSON.parse(localStorage.getItem("overtimeRequests")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingTaskId = null;
let currentPage = 1;
let itemsPerPage = 5;
let managerCurrentPage = 1;
let recommendations = JSON.parse(localStorage.getItem("recommendations")) || [];

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
    document.getElementById("recommendationBtn").style.display =
        role === "teamleader" || role === "operationalmanager"
            ? "inline-block"
            : "none";
    document.getElementById("workflowBtn").style.display =
        role === "teamleader" || role === "manager" || role === "operationalmanager"
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
        document
            .getElementById("recommendationForm")
            .addEventListener("submit", submitRecommendation);
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
    document.getElementById("recommendationView").classList.remove("active");
    document.getElementById("workflowView").classList.remove("active");

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
    document.getElementById("recommendationView").classList.remove("active");
    document.getElementById("workflowView").classList.remove("active");
    document.getElementById("profileView").classList.add("active");
}

function showAnalytics() {
    document.getElementById("employeeView").classList.remove("active");
    document.getElementById("managerView").classList.remove("active");
    document.getElementById("profileView").classList.remove("active");
    document.getElementById("recommendationView").classList.remove("active");
    document.getElementById("workflowView").classList.remove("active");
    document.getElementById("analyticsView").classList.add("active");
    generateAnalytics();
}

function showRecommendations() {
    document.getElementById("employeeView").classList.remove("active");
    document.getElementById("managerView").classList.remove("active");
    document.getElementById("profileView").classList.remove("active");
    document.getElementById("analyticsView").classList.remove("active");
    document.getElementById("workflowView").classList.remove("active");
    document.getElementById("recommendationView").classList.add("active");
    displayRecommendations();
}

function showWorkflow() {
    document.getElementById("employeeView").classList.remove("active");
    document.getElementById("managerView").classList.remove("active");
    document.getElementById("profileView").classList.remove("active");
    document.getElementById("analyticsView").classList.remove("active");
    document.getElementById("recommendationView").classList.remove("active");
    document.getElementById("workflowView").classList.add("active");
    displayWorkflow();
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
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;

    let filtered = overtimeRequests.filter((req) => req.user === currentUser);

    if (dateFrom) filtered = filtered.filter((req) => req.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((req) => req.date <= dateTo);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRequests = filtered.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const container = document.getElementById("employeeRequests");
    container.innerHTML = "";

    paginatedRequests.forEach((request) => {
        const card = createRequestCard(request, false);
        container.appendChild(card);
    });

    displayPagination("pagination", currentPage, totalPages, (page) => {
        currentPage = page;
        displayEmployeeRequests();
    });
}

function displayPendingRequests() {
    const dateFrom = document.getElementById("managerDateFrom").value;
    const dateTo = document.getElementById("managerDateTo").value;

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
            (req) => req.status === "pending" || req.status === "team-approved" || req.status === "manager-approved"
        );
    }

    if (dateFrom)
        pendingRequests = pendingRequests.filter((req) => req.date >= dateFrom);
    if (dateTo)
        pendingRequests = pendingRequests.filter((req) => req.date <= dateTo);

    const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);
    const startIndex = (managerCurrentPage - 1) * itemsPerPage;
    const paginatedRequests = pendingRequests.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const container = document.getElementById("pendingRequests");
    container.innerHTML = "";

    paginatedRequests.forEach((request) => {
        const card = createRequestCard(request, true);
        container.appendChild(card);
    });

    displayPagination(
        "managerPagination",
        managerCurrentPage,
        totalPages,
        (page) => {
            managerCurrentPage = page;
            displayPendingRequests();
        }
    );
}

function createRequestCard(request, showApprovalButtons) {
    const card = document.createElement("div");
    card.className = "request-card";

    const employeeTasks = showApprovalButtons
        ? getEmployeeTasksForDate(request.user || "Unknown", request.date)
        : "";

    const approverInfo =
        !showApprovalButtons &&
        (request.teamLeaderApprover ||
            request.managerApprover ||
            request.operationalManagerApprover)
            ? `<p><strong>Approved by:</strong> ${[
                  request.teamLeaderApprover,
                  request.managerApprover,
                  request.operationalManagerApprover,
              ]
                  .filter(Boolean)
                  .join(", ")}${request.directApproval ? " (Direct Approval)" : ""}</p>`
            : "";

    const approvalButtons = showApprovalButtons
        ? currentRole === "operationalmanager"
            ? `
            <div class="approval-buttons">
                <button class="approve" onclick="approveRequest(${request.id})">Normal Approve</button>
                <button class="direct-approve" onclick="directApprove(${request.id})">Direct Approve</button>
                <button class="reject" onclick="rejectRequest(${request.id})">Reject</button>
            </div>
        `
            : `
            <div class="approval-buttons">
                <button class="approve" onclick="approveRequest(${request.id})">Approve</button>
                <button class="reject" onclick="rejectRequest(${request.id})">Reject</button>
            </div>
        `
        : "";

    card.innerHTML = `
        <div class="request-header">
            <strong>${request.date}</strong>
            <span class="status ${request.status}">${
        request.status === "pending"
            ? "IN PROGRESS"
            : request.status.toUpperCase()
    }</span>
        </div>
        <p><strong>Employee:</strong> ${request.user || "Unknown"}</p>
        <p><strong>Hours:</strong> ${request.hours}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p><strong>Submitted:</strong> ${new Date(
            request.submittedAt
        ).toLocaleDateString()}</p>
        ${approverInfo}
        ${employeeTasks}
        ${approvalButtons}
    `;

    return card;
}

function approveRequest(id) {
    const request = overtimeRequests.find((req) => req.id === id);
    if (request) {
        if (currentRole === "teamleader") {
            request.status = "team-approved";
            request.teamLeaderApprover = currentUser;
            alert(
                "Request approved by team leader. Awaiting team manager approval."
            );
        } else if (currentRole === "manager") {
            request.status = "manager-approved";
            request.managerApprover = currentUser;
            alert(
                "Request approved by team manager. Awaiting operational manager approval."
            );
        } else if (currentRole === "operationalmanager") {
            request.status = "approved";
            request.operationalManagerApprover = currentUser;
            alert("Request finally approved!");
        }
        localStorage.setItem(
            "overtimeRequests",
            JSON.stringify(overtimeRequests)
        );
        displayPendingRequests();
    }
}

function directApprove(id) {
    const request = overtimeRequests.find((req) => req.id === id);
    if (request) {
        request.status = "approved";
        request.operationalManagerApprover = currentUser;
        request.directApproval = true;
        localStorage.setItem(
            "overtimeRequests",
            JSON.stringify(overtimeRequests)
        );
        displayPendingRequests();
        alert("Request directly approved by Operations Manager!");
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

function displayPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "<div class='pagination'>";

    if (currentPage > 1) {
        html += `<button onclick="(${onPageChange})(${
            currentPage - 1
        })">Previous</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${
            i === currentPage ? "active" : ""
        }" onclick="(${onPageChange})(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        html += `<button onclick="(${onPageChange})(${
            currentPage + 1
        })">Next</button>`;
    }

    html += "</div>";
    container.innerHTML = html;
}

function filterRequests() {
    currentPage = 1;
    displayEmployeeRequests();
}

function clearFilters() {
    document.getElementById("dateFrom").value = "";
    document.getElementById("dateTo").value = "";
    currentPage = 1;
    displayEmployeeRequests();
}

function filterPendingRequests() {
    managerCurrentPage = 1;
    displayPendingRequests();
}

function clearManagerFilters() {
    document.getElementById("managerDateFrom").value = "";
    document.getElementById("managerDateTo").value = "";
    managerCurrentPage = 1;
    displayPendingRequests();
}

function submitRecommendation(e) {
    e.preventDefault();

    const recommendeeUsername = document.getElementById(
        "recommendeeUsername"
    ).value;
    const type = document.getElementById("recommendationType").value;
    const reason = document.getElementById("recommendationReason").value;

    const recommendation = {
        id: Date.now(),
        recommendee: recommendeeUsername,
        recommender: currentUser,
        recommenderRole: currentRole,
        type: type,
        reason: reason,
        status: "pending",
        submittedAt: new Date().toISOString(),
    };

    recommendations.push(recommendation);
    localStorage.setItem("recommendations", JSON.stringify(recommendations));

    document.getElementById("recommendationForm").reset();
    displayRecommendations();
    alert("Recommendation submitted successfully!");
}

function displayRecommendations() {
    displayPendingRecommendations();
    displayMyRecommendations();
}

function displayPendingRecommendations() {
    const container = document.getElementById("pendingRecommendations");
    let pendingRecs = [];

    if (currentRole === "manager") {
        pendingRecs = recommendations.filter(
            (rec) =>
                rec.status === "pending" && rec.recommenderRole === "teamleader"
        );
    } else if (currentRole === "operationalmanager") {
        pendingRecs = recommendations.filter(
            (rec) =>
                rec.status === "pending" && rec.recommenderRole === "manager"
        );
    }

    container.innerHTML = pendingRecs
        .map(
            (rec) => `
        <div class="recommendation-card">
            <div class="rec-header">
                <strong>${rec.recommendee}</strong>
                <span class="status pending">In Progress</span>
            </div>
            <p><strong>Type:</strong> ${rec.type}</p>
            <p><strong>Recommended by:</strong> ${rec.recommender} (${
                rec.recommenderRole
            })</p>
            <p><strong>Reason:</strong> ${rec.reason}</p>
            <p><strong>Submitted:</strong> ${new Date(
                rec.submittedAt
            ).toLocaleDateString()}</p>
            <div class="approval-buttons">
                <button class="approve" onclick="approveRecommendation(${
                    rec.id
                })">Approve</button>
                <button class="reject" onclick="rejectRecommendation(${
                    rec.id
                })">Reject</button>
            </div>
        </div>
    `
        )
        .join("");
}

function displayMyRecommendations() {
    const container = document.getElementById("myRecommendations");
    const myRecs = recommendations.filter(
        (rec) => rec.recommender === currentUser
    );

    container.innerHTML = myRecs
        .map(
            (rec) => `
        <div class="recommendation-card">
            <div class="rec-header">
                <strong>${rec.recommendee}</strong>
                <span class="status ${
                    rec.status
                }">${rec.status.toUpperCase()}</span>
            </div>
            <p><strong>Type:</strong> ${rec.type}</p>
            <p><strong>Reason:</strong> ${rec.reason}</p>
            <p><strong>Submitted:</strong> ${new Date(
                rec.submittedAt
            ).toLocaleDateString()}</p>
        </div>
    `
        )
        .join("");
}

function approveRecommendation(id) {
    const rec = recommendations.find((r) => r.id === id);
    if (rec) {
        rec.status = "approved";
        rec.approver = currentUser;
        localStorage.setItem(
            "recommendations",
            JSON.stringify(recommendations)
        );
        displayRecommendations();
        alert("Recommendation approved!");
    }
}

function rejectRecommendation(id) {
    const rec = recommendations.find((r) => r.id === id);
    if (rec) {
        rec.status = "rejected";
        rec.approver = currentUser;
        localStorage.setItem(
            "recommendations",
            JSON.stringify(recommendations)
        );
        displayRecommendations();
        alert("Recommendation rejected!");
    }
}

function displayWorkflow() {
    const stats = getWorkflowStats();
    const requests = getWorkflowRequests();
    
    document.getElementById("workflowStats").innerHTML = `
        <div class="workflow-stats">
            <div class="stat-card">
                <h3>Total Requests</h3>
                <div class="stat-number">${stats.total}</div>
            </div>
            <div class="stat-card">
                <h3>Approved</h3>
                <div class="stat-number approved">${stats.approved}</div>
            </div>
            <div class="stat-card">
                <h3>Rejected</h3>
                <div class="stat-number rejected">${stats.rejected}</div>
            </div>
            <div class="stat-card">
                <h3>In Progress</h3>
                <div class="stat-number pending">${stats.pending}</div>
            </div>
        </div>
    `;
    
    document.getElementById("workflowRequests").innerHTML = requests.map(req => `
        <div class="workflow-request">
            <div class="request-header">
                <strong>${req.user} - ${req.date}</strong>
                <span class="status ${req.status}">${req.status.toUpperCase()}</span>
            </div>
            <p><strong>Hours:</strong> ${req.hours}</p>
            <p><strong>Reason:</strong> ${req.reason}</p>
            <p><strong>Submitted:</strong> ${new Date(req.submittedAt).toLocaleDateString()}</p>
        </div>
    `).join("");
}

function getWorkflowStats() {
    let visibleRequests = [];
    
    if (currentRole === "operationalmanager") {
        visibleRequests = overtimeRequests;
    } else if (currentRole === "manager") {
        visibleRequests = overtimeRequests.filter(req => 
            req.status === "pending" || req.status === "team-approved" || 
            req.status === "manager-approved" || req.status === "approved" || req.status === "rejected"
        );
    } else if (currentRole === "teamleader") {
        visibleRequests = overtimeRequests.filter(req => 
            req.status === "pending" || req.status === "team-approved" || 
            req.status === "approved" || req.status === "rejected"
        );
    }
    
    return {
        total: visibleRequests.length,
        approved: visibleRequests.filter(req => req.status === "approved").length,
        rejected: visibleRequests.filter(req => req.status === "rejected").length,
        pending: visibleRequests.filter(req => 
            req.status === "pending" || req.status === "team-approved" || req.status === "manager-approved"
        ).length
    };
}

function getWorkflowRequests() {
    if (currentRole === "operationalmanager") {
        return overtimeRequests.slice(-20);
    } else if (currentRole === "manager") {
        return overtimeRequests.filter(req => 
            req.status === "pending" || req.status === "team-approved" || 
            req.status === "manager-approved" || req.status === "approved" || req.status === "rejected"
        ).slice(-20);
    } else if (currentRole === "teamleader") {
        return overtimeRequests.filter(req => 
            req.status === "pending" || req.status === "team-approved" || 
            req.status === "approved" || req.status === "rejected"
        ).slice(-20);
    }
    return [];
}
