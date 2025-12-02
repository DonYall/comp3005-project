function redirect(page) {
    window.location.href = page;
}

function todo(featureName) {
    alert(`The feature '${featureName}' is not yet implemented.`);
}

async function submitSignup() {
    const data = {
        name: document.getElementById('name').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        heartRate: document.getElementById('heartRate').value,
        bodyFat: document.getElementById('bodyFat').value,

        goalType: document.getElementById('goalType').value,
        targetValue: document.getElementById('targetValue').value
    };

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            window.location.href = 'member.html';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to server.');
    }
}

async function trainerLogin() {
    const username = document.getElementById('trainer-username').value;
    
    const response = await fetch('/api/login/trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
    });

    const result = await response.json();
    if (result.success) {
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
}

async function adminLogin() {
    const username = document.getElementById('admin-username').value;

    const response = await fetch('/api/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
    });

    const result = await response.json();
    if (result.success) {
        window.location.href = result.redirect;
    } else {
        alert(result.message);
    }
}

function saveRoomBooking() { todo('Save Room Booking'); }
function logMaintenance() { todo('Log Maintenance'); }
function createClass() { todo('Create Class'); }
function generateBill() { todo('Generate Bill'); }
function saveAvailability() { todo('Set Availability'); }

const CURRENT_MEMBER_ID = 1; 
const CURRENT_TRAINER_ID = 1; 

function redirect(page) {
    window.location.href = page;
}

if (window.location.pathname.includes('member.html')) {
    loadDashboard();
}

async function loadDashboard() {
    try {
        const res = await fetch(`/api/member/${CURRENT_MEMBER_ID}/dashboard`);
        const data = await res.json();
        
        if(data) {
            const display = document.getElementById('dashboard-stats');
            if (display) {
                display.innerHTML = `
                    <p><strong>Weight:</strong> ${data.latest_weight || 'N/A'} kg</p>
                    <p><strong>Goal:</strong> ${data.active_goal || 'None'}</p>
                    <p><strong>Next Session:</strong> ${data.next_pt_session ? new Date(data.next_pt_session).toLocaleString() : 'None'}</p>
                `;
            }
        }
    } catch (err) { console.error("Error loading dashboard", err); }
}

async function bookPTSession() {
    const trainerId = prompt("Enter Trainer ID (e.g., 1 for Sarah):", "1");
    const time = prompt("Enter Date/Time (YYYY-MM-DD HH:MM):", "2025-04-01 10:00");
    const roomId = prompt("Enter Room ID (e.g., 3 for PT Room):", "3");

    if (!trainerId || !time) return;

    const res = await fetch('/api/member/book-pt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: CURRENT_MEMBER_ID, trainerId, roomId, time })
    });
    
    const result = await res.json();
    alert(result.message);
    loadDashboard(); 
}


async function saveAvailability() {
    const start = prompt("Start Time (YYYY-MM-DD HH:MM):", "2025-04-01 09:00");
    const end = prompt("End Time (YYYY-MM-DD HH:MM):", "2025-04-01 17:00");

    if (!start) return;

    const res = await fetch('/api/trainer/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId: CURRENT_TRAINER_ID, startTime: start, endTime: end })
    });
    const result = await res.json();
    alert(result.message);
}

async function searchMembers() {
    const name = prompt("Enter member name to search:", "Alice");
    if (!name) return;

    const res = await fetch(`/api/trainer/search?name=${name}`);
    const result = await res.json();

    if (result.data && result.data.length > 0) {
        const m = result.data[0];
        alert(`Found: ${m.name}\nGoal: ${m.goal_type}\nWeight: ${m.weight}kg`);
    } else {
        alert("Member not found.");
    }
}


async function logMaintenance() {
    const eqId = prompt("Enter Equipment ID (e.g., 1 for Treadmill):", "1");
    const desc = prompt("Describe the issue:", "Belt is broken");

    if (!eqId) return;

    const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: eqId, description: desc })
    });
    const result = await res.json();
    alert(result.message);
}
