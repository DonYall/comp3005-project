/* -------------------------------------------
   GENERIC HELPERS
-------------------------------------------- */

function redirect(page) {
    window.location.href = page;
}

function todo(msg) {
    alert("TODO (Backend): " + msg);
}

/* -------------------------------------------
   MEMBER ACTIONS
-------------------------------------------- */

function memberLogin() {
    let username = document.getElementById("member-username").value;

    // TODO: Send login request to backend
    todo("Member login with username = " + username);

    redirect("member.html");
}

function submitSignup() {
    let newUser = {
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

    // TODO: Send signup data to backend
    todo("Register new member:\n" + JSON.stringify(newUser, null, 2));

    redirect("member.html");
}

/* -------------------------------------------
   TRAINER ACTIONS
-------------------------------------------- */

function trainerLogin() {
    let username = document.getElementById("trainer-username").value;

    // TODO backend trainer auth
    todo("Trainer login: " + username);

    redirect("trainer.html");
}

function saveAvailability() {
    // TODO backend save trainer availability
    todo("Save availability");
}

/* -------------------------------------------
   ADMIN ACTIONS
-------------------------------------------- */

function adminLogin() {
    let username = document.getElementById("admin-username").value;

    // TODO backend admin auth
    todo("Admin login: " + username);

    redirect("admin.html");
}

function createClass() {
    // TODO backend create class
    todo("Create class");
}

function saveRoomBooking() {
    todo("Room booking");
}

function logMaintenance() {
    todo("Equipment maintenance");
}

function generateBill() {
    todo("Generate bill");
}