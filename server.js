const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = 3000;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "fitness_db",
    password: "don",
    port: 5432,
});

app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.post("/api/signup", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const { name, dob, gender, email, phone, address, height, weight, heartRate, bodyFat, goalType, targetValue } = req.body;

        const memberRes = await client.query(
            `INSERT INTO Member (name, date_of_birth, gender, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING member_id`,
            [name, dob, gender, email, phone, address]
        );
        const memberId = memberRes.rows[0].member_id;

        if (weight || height) {
            await client.query(`INSERT INTO HealthMetric (member_id, height, weight, heart_rate, body_fat) VALUES ($1, $2, $3, $4, $5)`, [
                memberId,
                height,
                weight,
                heartRate,
                bodyFat,
            ]);
        }
        if (goalType) {
            await client.query(
                `INSERT INTO FitnessGoal (member_id, goal_type, target_value, start_date, status) VALUES ($1, $2, $3, CURRENT_DATE, 'active')`,
                [memberId, goalType, targetValue]
            );
        }
        await client.query("COMMIT");
        res.json({ success: true, message: "Member registered!" });
    } catch (e) {
        await client.query("ROLLBACK");
        res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
});

app.post("/api/signup/trainer", async (req, res) => {
    const { name, email, phone, specialization, bio } = req.body;

    try {
        await pool.query(
            `INSERT INTO Trainer (name, email, phone, specialization, bio) 
     VALUES ($1, $2, $3, $4, $5)`,
            [name, email, phone, specialization, bio]
        );
        res.json({ success: true, message: "Trainer registered!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/signup/admin", async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        await pool.query(`INSERT INTO Admin (name, email, phone) VALUES ($1, $2, $3)`, [name, email, phone]);
        res.json({ success: true, message: "Admin registered!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/login/member", async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query("SELECT member_id FROM Member WHERE email = $1", [email]);

        if (result.rows.length > 0) {
            return res.json({
                success: true,
                memberId: result.rows[0].member_id,
                redirect: "member.html",
            });
        }

        res.status(401).json({ success: false, message: "Member not found" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/login/trainer", async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query("SELECT trainer_id FROM Trainer WHERE email = $1", [email]);
        if (result.rows.length > 0) res.json({ success: true, redirect: "trainer.html", trainerId: result.rows[0].trainer_id });
        else res.status(401).json({ success: false, message: "Trainer not found" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/login/admin", async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query("SELECT admin_id FROM Admin WHERE email = $1", [email]);
        if (result.rows.length > 0) res.json({ success: true, redirect: "admin.html", adminId: result.rows[0].admin_id });
        else res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get("/api/member/:id/dashboard", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM MemberDashboard WHERE member_id = $1", [req.params.id]);
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/member/metric", async (req, res) => {
    const { memberId, weight, heartRate } = req.body;
    try {
        await pool.query("INSERT INTO HealthMetric (member_id, weight, heart_rate, recorded_at) VALUES ($1, $2, $3, NOW())", [
            memberId,
            weight,
            heartRate,
        ]);
        res.json({ success: true, message: "Metric added!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/member/goal", async (req, res) => {
    const { memberId, type, target } = req.body;
    try {
        await pool.query(
            "INSERT INTO FitnessGoal (member_id, goal_type, target_value, start_date, status) VALUES ($1, $2, $3, CURRENT_DATE, 'active')",
            [memberId, type, target]
        );
        res.json({ success: true, message: "Goal set!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/member/book-pt", async (req, res) => {
    const { memberId, trainerId, roomId, time } = req.body;
    try {
        const roomConflict = await pool.query("SELECT * FROM PTSession WHERE room_id = $1 AND session_time = $2", [roomId, time]);
        if (roomConflict.rows.length > 0) return res.json({ success: false, message: "Room is booked!" });

        const check = await pool.query("SELECT * FROM PTSession WHERE trainer_id = $1 AND session_time = $2", [trainerId, time]);
        if (check.rows.length > 0) return res.json({ success: false, message: "Trainer busy!" });

        await pool.query("INSERT INTO PTSession (member_id, trainer_id, room_id, session_time, status) VALUES ($1, $2, $3, $4, $5)", [
            memberId,
            trainerId,
            roomId,
            time,
            "scheduled",
        ]);
        res.json({ success: true, message: "Session booked!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/member/register-class", async (req, res) => {
    const { memberId, classId } = req.body;
    try {
        const countRes = await pool.query("SELECT COUNT(*) FROM ClassRegistration WHERE class_id = $1", [classId]);

        const capRes = await pool.query("SELECT capacity FROM Class WHERE class_id = $1", [classId]);

        if (parseInt(countRes.rows[0].count) >= capRes.rows[0].capacity) {
            return res.json({ success: false, message: "Class is full" });
        }

        await pool.query("INSERT INTO ClassRegistration (member_id, class_id) VALUES ($1, $2)", [memberId, classId]);
        res.json({ success: true, message: "Registered for class!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/trainer/availability", async (req, res) => {
    const { trainerId, startTime, endTime } = req.body;
    try {
        const overlap = await pool.query(
            `SELECT * FROM TrainerAvailability 
     WHERE trainer_id = $1 
     AND NOT ($3 <= start_time OR $2 >= end_time)`,
            [trainerId, startTime, endTime]
        );

        if (overlap.rows.length > 0) return res.json({ success: false, message: "Overlapping availability!" });

        await pool.query("INSERT INTO TrainerAvailability (trainer_id, start_time, end_time) VALUES ($1, $2, $3)", [trainerId, startTime, endTime]);
        res.json({ success: true, message: "Availability set!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get("/api/trainer/search", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.name, fg.goal_type, hm.weight FROM Member m LEFT JOIN FitnessGoal fg ON m.member_id = fg.member_id LEFT JOIN HealthMetric hm ON m.member_id = hm.member_id WHERE m.name ILIKE $1 ORDER BY hm.recorded_at DESC LIMIT 1`,
            [`%${req.query.name}%`]
        );
        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get("/api/trainer/:id/schedule", async (req, res) => {
    try {
        const pt = await pool.query("SELECT 'PT' as type, session_time as time FROM PTSession WHERE trainer_id = $1", [req.params.id]);
        const classes = await pool.query("SELECT 'Class' as type, scheduled_time as time FROM Class WHERE trainer_id = $1", [req.params.id]);
        const schedule = [...pt.rows, ...classes.rows].sort((a, b) => new Date(a.time) - new Date(b.time));
        res.json({ success: true, data: schedule });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/admin/maintenance", async (req, res) => {
    try {
        await pool.query("INSERT INTO MaintenanceLog (equipment_id, issue_description, repair_status) VALUES ($1, $2, $3)", [
            req.body.equipmentId,
            req.body.description,
            "pending",
        ]);
        await pool.query("UPDATE Equipment SET status = 'maintenance' WHERE equipment_id = $1", [req.body.equipmentId]);
        res.json({ success: true, message: "Maintenance logged." });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/admin/create-class", async (req, res) => {
    const { className, trainerId, roomId, time } = req.body;
    try {
        const conflict = await pool.query("SELECT * FROM Class WHERE room_id = $1 AND scheduled_time = $2", [roomId, time]);
        if (conflict.rows.length > 0) return res.json({ success: false, message: "Room booked!" });

        await pool.query("INSERT INTO Class (class_name, trainer_id, room_id, scheduled_time, capacity, duration) VALUES ($1, $2, $3, $4, 20, 60)", [
            className,
            trainerId,
            roomId,
            time,
        ]);
        res.json({ success: true, message: "Class created & Room booked!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/admin/bill", async (req, res) => {
    try {
        await pool.query("INSERT INTO Bill (member_id, amount, due_date, status) VALUES ($1, $2, $3, 'unpaid')", [
            req.body.memberId,
            req.body.amount,
            req.body.dueDate,
        ]);
        res.json({ success: true, message: "Bill generated!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
