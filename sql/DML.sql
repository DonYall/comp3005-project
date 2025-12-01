-- MEMBER
INSERT INTO
    Member (
        name,
        date_of_birth,
        gender,
        email,
        phone,
        address
    )
VALUES
    (
        'Alice Johnson',
        '1995-06-12',
        'Female',
        'alice@example.com',
        '555-1111',
        '12 King St'
    ),
    (
        'Bob Smith',
        '1990-04-20',
        'Male',
        'bob@example.com',
        '555-2222',
        '22 Queen St'
    ),
    (
        'Charlie Kim',
        '2001-09-08',
        'Male',
        'charlie@example.com',
        '555-3333',
        '33 Main St'
    );

-- TRAINER
INSERT INTO
    Trainer (name, email, phone, specialization, bio)
VALUES
    (
        'Sarah Wood',
        'sarahw@fit.com',
        '555-4444',
        'Strength Training',
        'Certified PT with 8 years experience'
    ),
    (
        'Marco Diaz',
        'marcod@fit.com',
        '555-5555',
        'Cardio',
        'Specialist in HIIT and endurance'
    ),
    (
        'Emily Park',
        'emilyp@fit.com',
        '555-6666',
        'Yoga',
        'Experienced yoga instructor'
    );

-- FITNESS GOAL
INSERT INTO
    FitnessGoal (
        member_id,
        goal_type,
        target_value,
        start_date,
        status
    )
VALUES
    (1, 'Weight Loss', 65.0, '2025-01-01', 'active'),
    (2, 'Muscle Gain', 75.0, '2025-02-01', 'active'),
    (
        3,
        'Body Fat Reduction',
        15.0,
        '2025-01-15',
        'active'
    );

-- HEALTH METRIC (history)
INSERT INTO
    HealthMetric (member_id, height, weight, heart_rate, body_fat)
VALUES
    (1, 165.0, 70.0, 72, 22.0),
    (2, 180.0, 82.0, 78, 18.0),
    (3, 175.0, 90.0, 85, 25.0);

-- ROOM
INSERT INTO
    Room (name, capacity, room_type)
VALUES
    ('Studio A', 20, 'Class'),
    ('Studio B', 15, 'Class'),
    ('PT Room 1', 2, 'Personal Training');

-- EQUIPMENT
INSERT INTO
    Equipment (room_id, name, status)
VALUES
    (1, 'Treadmill', 'working'),
    (1, 'Stationary Bike', 'working'),
    (2, 'Yoga Mats', 'working');

-- MAINTENANCE LOG
INSERT INTO
    MaintenanceLog (equipment_id, issue_description, repair_status)
VALUES
    (1, 'Belt slipping slightly', 'pending'),
    (2, 'Screen flickering', 'pending'),
    (3, 'Mat tear reported', 'pending');

-- CLASS
INSERT INTO
    Class (
        class_name,
        trainer_id,
        room_id,
        scheduled_time,
        capacity,
        duration
    )
VALUES
    ('Morning Yoga', 3, 1, '2025-03-02 09:00', 20, 60),
    ('HIIT Burn', 2, 1, '2025-03-02 11:00', 20, 45),
    ('Strength 101', 1, 2, '2025-03-03 10:00', 15, 60);

-- CLASS REGISTRATION
INSERT INTO
    ClassRegistration (member_id, class_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3);

-- PT SESSION
INSERT INTO
    PTSession (member_id, trainer_id, room_id, session_time)
VALUES
    (1, 1, 3, '2025-03-05 14:00'),
    (2, 2, 3, '2025-03-05 15:00'),
    (3, 1, 3, '2025-03-06 16:00');

-- TRAINER AVAILABILITY
INSERT INTO
    TrainerAvailability (trainer_id, start_time, end_time)
VALUES
    (1, '2025-03-05 14:00', '2025-03-05 18:00'),
    (2, '2025-03-05 15:00', '2025-03-05 19:00'),
    (3, '2025-03-02 09:00', '2025-03-02 12:00');

-- BILL
INSERT INTO
    Bill (member_id, amount, due_date, status)
VALUES
    (1, 100.00, '2025-03-10', 'unpaid'),
    (2, 120.00, '2025-03-10', 'unpaid'),
    (3, 90.00, '2025-03-10', 'unpaid');

-- PAYMENT
INSERT INTO
    Payment (bill_id, amount_paid, payment_method)
VALUES
    (1, 100.00, 'card'),
    (2, 120.00, 'cash'),
    (3, 50.00, 'card');