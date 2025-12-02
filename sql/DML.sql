-- ROOMS
INSERT INTO Room (name, capacity, room_type)
VALUES
('Studio A', 20, 'class'),
('Studio B', 15, 'class'),
('PT Room 1', 5, 'pt'),
('PT Room 2', 5, 'pt');

-- EQUIPMENT
INSERT INTO Equipment (room_id, name, status)
VALUES
(1, 'Treadmill', 'working'),
(1, 'Rowing Machine', 'working'),
(2, 'Yoga Mats', 'working'),
(2, 'Spin Bikes', 'working'),
(3, 'Dumbbells Set', 'working'),
(4, 'Bench Press', 'working');
