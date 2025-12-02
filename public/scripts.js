const CURRENT_MEMBER_ID = localStorage.getItem("memberId");
const CURRENT_TRAINER_ID = localStorage.getItem("trainerId");

if (!CURRENT_MEMBER_ID && window.location.pathname.includes("member.html")) {
    alert("Please log in first.");
    window.location.href = "member-login.html";
}

if (!CURRENT_TRAINER_ID && window.location.pathname.includes("trainer.html")) {
    alert("Please log in first.");
    window.location.href = "trainer-login.html";
}

function redirect(page) {
    window.location.href = page;
}

if (window.location.pathname.includes("member.html")) {
    loadDashboard();
}

async function loadDashboard() {
    try {
        const res = await fetch(`/api/member/${CURRENT_MEMBER_ID}/dashboard`);
        const data = await res.json();
        const display = document.getElementById("dashboard-stats");

        if (display && data) {
            display.innerHTML = `
                <h3>My Progress</h3>
                <p><strong>Weight:</strong> ${data.latest_weight || "N/A"} kg</p>
                <p><strong>Goal:</strong> ${data.active_goal || "None"}</p>
                <p><strong>Next Session:</strong> ${data.next_pt_session ? new Date(data.next_pt_session).toLocaleString() : "None"}</p>
            `;
        }
    } catch (err) {
        console.error("Error loading dashboard", err);
    }
}

async function addHealthMetric() {
    const weight = prompt("Enter current weight (kg):");
    const hr = prompt("Enter heart rate (bpm):");

    if (!weight) return;

    await postData("/api/member/metric", {
        memberId: CURRENT_MEMBER_ID,
        weight: weight,
        heartRate: hr,
    });
    loadDashboard();
}

async function addFitnessGoal() {
    const type = prompt("Goal Type (Weight Loss, Muscle Gain, etc):");
    const target = prompt("Target Value (e.g., 70):");

    if (!type) return;

    await postData("/api/member/goal", {
        memberId: CURRENT_MEMBER_ID,
        type: type,
        target: target,
    });
    loadDashboard();
}

async function bookPTSession() {
    const trainerId = prompt("Enter Trainer ID (1, 2, or 3):", "1");
    const time = prompt("Enter Date/Time (YYYY-MM-DD HH:MM):", "2025-06-01 10:00");
    const roomId = prompt("Enter Room ID (1, 2, or 3):", "3");

    if (!time) return;

    await postData("/api/member/book-pt", {
        memberId: CURRENT_MEMBER_ID,
        trainerId: trainerId,
        roomId: roomId,
        time: time,
    });
    loadDashboard();
}

async function registerClass() {
    const classId = prompt("Enter Class ID to register (e.g., 1):", "1");

    if (!classId) return;

    await postData("/api/member/register-class", {
        memberId: CURRENT_MEMBER_ID,
        classId: classId,
    });
}

async function saveAvailability() {
    const start = prompt("Start Time (YYYY-MM-DD HH:MM):", "2025-04-01 09:00");
    const end = prompt("End Time (YYYY-MM-DD HH:MM):", "2025-04-01 17:00");

    if (!start) return;

    await postData("/api/trainer/availability", {
        trainerId: CURRENT_TRAINER_ID,
        startTime: start,
        endTime: end,
    });
}

async function searchMembers() {
    const name = prompt("Enter member name to search:", "Alice");

    if (!name) return;

    const res = await fetch(`/api/trainer/search?name=${name}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
        const m = result.data[0];
        alert(`Found: ${m.name}\nGoal: ${m.goal_type || "None"}\nWeight: ${m.weight || "N/A"}kg`);
    } else {
        alert("Member not found.");
    }
}

async function viewSchedule() {
    const res = await fetch(`/api/trainer/${CURRENT_TRAINER_ID}/schedule`);
    const result = await res.json();

    if (result.data.length === 0) {
        alert("No upcoming sessions.");
    } else {
        let msg = "Your Schedule:\n";
        result.data.forEach((item) => {
            msg += `${new Date(item.time).toLocaleString()} - ${item.type}\n`;
        });
        alert(msg);
    }
}

async function createClass() {
    const name = prompt("Class Name:", "Morning Yoga");
    const trainerId = prompt("Trainer ID:", "1");
    const roomId = prompt("Room ID (1=Studio A, 2=Studio B):", "1");
    const time = prompt("Date/Time (YYYY-MM-DD HH:MM):", "2025-05-10 09:00");

    if (!name) return;

    await postData("/api/admin/create-class", {
        className: name,
        trainerId: trainerId,
        roomId: roomId,
        time: time,
    });
}

async function saveRoomBooking() {
    alert("To book a room, please use 'Create Class' to assign a time and trainer to a room.");
    createClass();
}

async function logMaintenance() {
    const eqId = prompt("Enter Equipment ID (e.g., 1):", "1");
    const desc = prompt("Describe the issue:", "Broken screen");

    if (!eqId) return;

    await postData("/api/admin/maintenance", {
        equipmentId: eqId,
        description: desc,
    });
}

async function generateBill() {
    const memberId = prompt("Enter Member ID to bill:", "1");
    const amount = prompt("Amount ($):", "100.00");
    const date = prompt("Due Date (YYYY-MM-DD):", "2025-05-01");

    if (!memberId) return;

    await postData("/api/admin/bill", {
        memberId: memberId,
        amount: amount,
        dueDate: date,
    });
}

async function submitSignup() {
    const getValue = (id) => (document.getElementById(id) ? document.getElementById(id).value : "");

    const data = {
        name: getValue("name"),
        dob: getValue("dob"),
        gender: getValue("gender"),
        email: getValue("email"),
        phone: getValue("phone"),
        address: getValue("address"),

        height: getValue("height"),
        weight: getValue("weight"),
        heartRate: getValue("heartRate"),
        bodyFat: getValue("bodyFat"),

        goalType: getValue("goalType"),
        targetValue: getValue("targetValue"),
    };

    try {
        const response = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            window.location.href = "member.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to server.");
    }
}

async function submitTrainerSignup() {
    const trainer = {
        name: document.getElementById("t-name").value,
        email: document.getElementById("t-email").value,
        phone: document.getElementById("t-phone").value,
        specialization: document.getElementById("t-specialization").value,
        bio: document.getElementById("t-bio").value,
    };

    await postData("/api/signup/trainer", trainer);

    redirect("trainer-login.html");
}

async function submitAdminSignup() {
    const admin = {
        name: document.getElementById("a-name").value,
        email: document.getElementById("a-email").value,
        phone: document.getElementById("a-phone").value,
    };

    await postData("/api/signup/admin", admin);

    redirect("admin-login.html");
}

async function memberLogin() {
    const email = document.getElementById("member-username").value;

    const response = await fetch("/api/login/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (result.success) {
        localStorage.setItem("memberId", result.memberId);
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
}

async function trainerLogin() {
    const email = document.getElementById("trainer-username").value;

    const response = await fetch("/api/login/trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (result.success) {
        localStorage.setItem("trainerId", result.trainerId);
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
}

async function adminLogin() {
    const email = document.getElementById("admin-username").value;

    const response = await fetch("/api/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
    });

    const result = await response.json();
    if (result.success) {
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
}
async function postData(url, data) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        alert(result.message);
    } catch (e) {
        console.error(e);
        alert("Error connecting to server.");
    }
}

function todo(featureName) {
    alert(`The feature '${featureName}' is not yet implemented.`);
}
