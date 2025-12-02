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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/signup", async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { name, dob, gender, email, phone, address, height, weight, heartRate, bodyFat, goalType, targetValue } = req.body;

        const memberQuery = `
            INSERT INTO Member (name, date_of_birth, gender, email, phone, address)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING member_id`;
        const memberValues = [name, dob, gender, email, phone, address];
        const memberRes = await client.query(memberQuery, memberValues);
        const memberId = memberRes.rows[0].member_id;

        if (weight || height) {
            const metricQuery = `
                INSERT INTO HealthMetric (member_id, height, weight, heart_rate, body_fat)
                VALUES ($1, $2, $3, $4, $5)`;
            await client.query(metricQuery, [memberId, height, weight, heartRate, bodyFat]);
        }

        if (goalType) {
            const goalQuery = `
                INSERT INTO FitnessGoal (member_id, goal_type, target_value, start_date, status)
                VALUES ($1, $2, $3, CURRENT_DATE, 'active')`;
            await client.query(goalQuery, [memberId, goalType, targetValue]);
        }

        await client.query("COMMIT");
        res.json({ success: true, message: "Member registered successfully!" });
    } catch (e) {
        await client.query("ROLLBACK");
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
});

app.post("/api/login/trainer", async (req, res) => {
    try {
        const { username } = req.body;
        const result = await pool.query("SELECT trainer_id, name FROM Trainer WHERE name = $1", [username]);

        if (result.rows.length > 0) {
            res.json({ success: true, redirect: "trainer.html" });
        } else {
            res.status(401).json({
                success: false,
                message: "Trainer not found",
            });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.post("/api/login/admin", (req, res) => {
    const { username } = req.body;
    if (username.toLowerCase() === "admin") {
        res.json({ success: true, redirect: "admin.html" });
    } else {
        res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.get("/api/member/:id/dashboard", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM MemberDashboard WHERE member_id = $1", [id]);
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/member/book-pt", async (req, res) => {
    const { memberId, trainerId, roomId, time } = req.body;
    try {
        const check = await pool.query("SELECT * FROM PTSession WHERE trainer_id = $1 AND session_time = $2", [trainerId, time]);
        if (check.rows.length > 0) {
            return res.json({
                success: false,
                message: "Trainer is already booked at this time.",
            });
        }

        await pool.query("INSERT INTO PTSession (member_id, trainer_id, room_id, session_time, status) VALUES ($1, $2, $3, $4, $5)", [
            memberId,
            trainerId,
            roomId,
            time,
            "scheduled",
        ]);
        res.json({ success: true, message: "Session booked successfully!" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/trainer/availability", async (req, res) => {
    const { trainerId, startTime, endTime } = req.body;
    try {
        await pool.query("INSERT INTO TrainerAvailability (trainer_id, start_time, end_time) VALUES ($1, $2, $3)", [trainerId, startTime, endTime]);
        res.json({ success: true, message: "Availability added." });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get("/api/trainer/search", async (req, res) => {
    const { name } = req.query;
    try {
        const query = `
            SELECT m.name, fg.goal_type, hm.weight, hm.body_fat 
            FROM Member m
            LEFT JOIN FitnessGoal fg ON m.member_id = fg.member_id
            LEFT JOIN HealthMetric hm ON m.member_id = hm.member_id
            WHERE m.name ILIKE $1
            ORDER BY hm.recorded_at DESC LIMIT 1`;

        const result = await pool.query(query, [`%${name}%`]);
        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post("/api/admin/maintenance", async (req, res) => {
    const { equipmentId, description } = req.body;
    try {
        await pool.query("INSERT INTO MaintenanceLog (equipment_id, issue_description, repair_status) VALUES ($1, $2, $3)", [
            equipmentId,
            description,
            "pending",
        ]);
        // Requirement: Update equipment status
        await pool.query("UPDATE Equipment SET status = $1 WHERE equipment_id = $2", ["maintenance", equipmentId]);

        res.json({ success: true, message: "Maintenance logged." });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
