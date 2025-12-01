DROP TABLE IF EXISTS Payment CASCADE;

DROP TABLE IF EXISTS Bill CASCADE;

DROP TABLE IF EXISTS ClassRegistration CASCADE;

DROP TABLE IF EXISTS PTSession CASCADE;

DROP TABLE IF EXISTS TrainerAvailability CASCADE;

DROP TABLE IF EXISTS MaintenanceLog CASCADE;

DROP TABLE IF EXISTS Equipment CASCADE;

DROP TABLE IF EXISTS Class CASCADE;

DROP TABLE IF EXISTS HealthMetric CASCADE;

DROP TABLE IF EXISTS FitnessGoal CASCADE;

DROP TABLE IF EXISTS Room CASCADE;

DROP TABLE IF EXISTS Member CASCADE;

DROP TABLE IF EXISTS Trainer CASCADE;

-- MEMBER
CREATE TABLE Member (
    member_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRAINER
CREATE TABLE Trainer (
    trainer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    bio TEXT
);

-- FITNESS GOAL
CREATE TABLE FitnessGoal (
    goal_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES Member (member_id) ON
    DELETE
        CASCADE,
        goal_type VARCHAR(100) NOT NULL,
        target_value NUMERIC(10, 2),
        start_date DATE NOT NULL,
        end_date DATE,
);

-- HEALTH METRIC
CREATE TABLE HealthMetric (
    metric_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES Member (member_id) ON
    DELETE
        CASCADE,
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        height NUMERIC(5, 2),
        weight NUMERIC(5, 2),
        heart_rate INT,
        body_fat NUMERIC(5, 2),
        notes TEXT
);

-- ROOM
CREATE TABLE Room (
    room_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INT CHECK (capacity > 0),
);

-- EQUIPMENT
CREATE TABLE Equipment (
    equipment_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES Room (room_id) ON
    DELETE
    SET
        NULL,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'working'
);

-- MAINTENANCE LOG
CREATE TABLE MaintenanceLog (
    maintenance_id SERIAL PRIMARY KEY,
    equipment_id INT NOT NULL REFERENCES Equipment (equipment_id) ON
    DELETE
        CASCADE,
        issue_description TEXT NOT NULL,
        reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        repaired_at TIMESTAMP,
        repair_status VARCHAR(50) DEFAULT 'pending'
);

-- CLASS
CREATE TABLE Class (
    class_id SERIAL PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    trainer_id INT NOT NULL REFERENCES Trainer (trainer_id) ON
    DELETE
        CASCADE,
        room_id INT NOT NULL REFERENCES Room (room_id) ON
    DELETE
        CASCADE,
        scheduled_time TIMESTAMP NOT NULL,
        capacity INT CHECK (capacity > 0),
        duration INT CHECK (duration > 0) -- minutes
);

-- CLASS REGISTRATION
CREATE TABLE ClassRegistration (
    registration_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES Member (member_id) ON
    DELETE
        CASCADE,
        class_id INT NOT NULL REFERENCES Class (class_id) ON
    DELETE
        CASCADE,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (member_id, class_id)
);

-- PERSONAL TRAINING SESSION
CREATE TABLE PTSession (
    session_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES Member (member_id) ON
    DELETE
        CASCADE,
        trainer_id INT NOT NULL REFERENCES Trainer (trainer_id) ON
    DELETE
        CASCADE,
        room_id INT NOT NULL REFERENCES Room (room_id) ON
    DELETE
        CASCADE,
        session_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        UNIQUE (trainer_id, session_time),
        UNIQUE (member_id, session_time)
);

-- TRAINER AVAILABILITY
CREATE TABLE TrainerAvailability (
    availability_id SERIAL PRIMARY KEY,
    trainer_id INT NOT NULL REFERENCES Trainer (trainer_id) ON
    DELETE
        CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        CHECK (end_time > start_time)
);

-- BILLING
CREATE TABLE Bill (
    bill_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES Member (member_id) ON
    DELETE
        CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'unpaid'
);

-- PAYMENT
CREATE TABLE Payment (
    payment_id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES Bill (bill_id) ON
    DELETE
        CASCADE,
        amount_paid NUMERIC(10, 2) NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        method VARCHAR(50)
);

-- DASHBOARD VIEW
CREATE
OR REPLACE VIEW MemberDashboard AS
SELECT
    m.member_id,
    m.name AS member_name,
    (
        SELECT
            weight
        FROM
            HealthMetric hm
        WHERE
            hm.member_id = m.member_id
        ORDER BY
            hm.recorded_at DESC
        LIMIT
            1
    ) AS latest_weight,
    (
        SELECT
            height
        FROM
            HealthMetric hm
        WHERE
            hm.member_id = m.member_id
        ORDER BY
            hm.recorded_at DESC
        LIMIT
            1
    ) AS latest_height,
    (
        SELECT
            heart_rate
        FROM
            HealthMetric hm
        WHERE
            hm.member_id = m.member_id
        ORDER BY
            hm.recorded_at DESC
        LIMIT
            1
    ) AS latest_heart_rate,
    (
        SELECT
            recorded_at
        FROM
            HealthMetric hm
        WHERE
            hm.member_id = m.member_id
        ORDER BY
            hm.recorded_at DESC
        LIMIT
            1
    ) AS metric_recorded_at,
    (
        SELECT
            goal_type
        FROM
            FitnessGoal fg
        WHERE
            fg.member_id = m.member_id
            AND fg.status = 'active'
        ORDER BY
            fg.start_date DESC
        LIMIT
            1
    ) AS active_goal,
    (
        SELECT
            target_value
        FROM
            FitnessGoal fg
        WHERE
            fg.member_id = m.member_id
            AND fg.status = 'active'
        ORDER BY
            fg.start_date DESC
        LIMIT
            1
    ) AS target_value,
    (
        SELECT
            COUNT(*)
        FROM
            ClassRegistration cr
            JOIN Class c ON cr.class_id = c .class_id
        WHERE
            cr.member_id = m.member_id
            AND c .scheduled_time > NOW ()
    ) AS upcoming_classes,
    (
        SELECT
            session_time
        FROM
            PTSession pt
        WHERE
            pt.member_id = m.member_id
            AND pt.session_time > NOW ()
        ORDER BY
            pt.session_time
        LIMIT
            1
    ) AS next_pt_session
FROM
    Member m;

-- BILL UPDATE TRIGGER
CREATE
OR REPLACE FUNCTION update_bill_status() RETURNS TRIGGER AS $ $ BEGIN
    UPDATE
        Bill
    SET
        status = 'paid'
    WHERE
        bill_id = NEW .bill_id
        AND (
            SELECT
                COALESCE(SUM(amount_paid), 0)
            FROM
                Payment
            WHERE
                bill_id = NEW .bill_id
        ) >= (
            SELECT
                amount
            FROM
                Bill
            WHERE
                bill_id = NEW .bill_id
        );

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bill_status AFTER
INSERT
    ON Payment FOR EACH ROW EXECUTE FUNCTION update_bill_status();

-- TRAINER AVAILABILITY INDEX
CREATE INDEX idx_trainer_availability ON TrainerAvailability(trainer_id, start_time, end_time);