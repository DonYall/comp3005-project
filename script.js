function hideAll() {
    document.getElementById("home").classList.add("hidden");
    document.getElementById("member-login").classList.add("hidden");
    document.getElementById("trainer-login").classList.add("hidden");
    document.getElementById("admin-login").classList.add("hidden");
    document.getElementById("signup").classList.add("hidden");
}

function goHome() {
    hideAll();
    document.getElementById("home").classList.remove("hidden");
}

function openMemberLogin() {
    hideAll();
    document.getElementById("member-login").classList.remove("hidden");
}
function openTrainerLogin() {
    hideAll();
    document.getElementById("trainer-login").classList.remove("hidden");
}
function openAdminLogin() {
    hideAll();
    document.getElementById("admin-login").classList.remove("hidden");
}
function openSignup() {
    hideAll();
    document.getElementById("signup").classList.remove("hidden");
}

function submitMemberLogin() {
    alert("Member logged in: " + document.getElementById("member-username").value);
}
function submitTrainerLogin() {
    alert("Trainer logged in: " + document.getElementById("trainer-username").value);
}
function submitAdminLogin() {
    alert("Admin logged in: " + document.getElementById("admin-username").value);
}

function submitSignup() {
    let userData = {
        name: document.getElementById("name").value,
        dob: document.getElementById("dob").value,
        gender: document.getElementById("gender").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,

        height: document.getElementById("height").value,
        weight: document.getElementById("weight").value,
        heartRate: document.getElementById("heartRate").value,
        bodyFat: document.getElementById("bodyFat").value,

        goalType: document.getElementById("goalType").value,
        targetValue: document.getElementById("targetValue").value
    };

    alert("New Member Registered:\n\n" + JSON.stringify(userData, null, 2));
}