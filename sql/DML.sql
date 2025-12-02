-- ROOMS
INSERT INTO Room (name, capacity, room_type)
VALUES
('Studio A', 20, 'Classroom'),
('PT Room 1', 5, 'Personal Training');

INSERT INTO Equipment (room_id, name, status)
VALUES
(1, 'Yoga Mats', 'working'),
(1, 'Sound System', 'working'),
(2, 'Dumbbells Set', 'working'),
(2, 'Treadmill', 'under maintenance');