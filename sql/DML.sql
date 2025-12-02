-- ADMINS
INSERT INTO Admin (name, email, phone)
VALUES 
('System Admin', 'admin@club.com', '123-456-7890');

-- TRAINERS
INSERT INTO Trainer (name, email, phone, specialization, bio)
VALUES 
('John Trainer', 'john@club.com', '111-222-3333', 'Strength', 'Certified PT'),
('Sarah Coach', 'sarah@club.com', '222-333-4444', 'Cardio', 'Class Instructor');

-- ROOMS
INSERT INTO Room (name, capacity, room_type)
VALUES
('Studio A', 20, 'Classroom'),
('PT Room 1', 5, 'Personal Training');

-- SAMPLE CLASS
INSERT INTO Class (class_name, trainer_id, room_id, scheduled_time, capacity, duration)
VALUES
('Morning Yoga', 2, 1, NOW() + INTERVAL '1 day', 20, 60);

-- SAMPLE MEMBER
INSERT INTO Member (name, date_of_birth, gender, email, phone, address)
VALUES
('Alice Example', '2000-01-01', 'Female', 'alice@example.com', '555-444-3333', '123 Lane');
