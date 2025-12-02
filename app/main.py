import psycopg2
import sys
from datetime import datetime

# --- DATABASE CONFIGURATION ---
DB_CONFIG = {
    "dbname": "fitness_db",
    "user": "postgres",
    "password": "don",
    "host": "localhost",
    "port": "5432"
}

def get_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

# --- UTILITY FUNCTIONS ---
def print_header(title):
    print("\n" + "="*40)
    print(f" {title}")
    print("="*40)

def get_input(prompt):
    return input(f"{prompt}: ").strip()

# --- MEMBER FUNCTIONS ---
def member_dashboard(member_id):
    conn = get_connection()
    cur = conn.cursor()
    while True:
        try:
            # Fetch Dashboard Stats
            cur.execute("SELECT * FROM MemberDashboard WHERE member_id = %s", (member_id,))
            cols = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            stats = dict(zip(cols, row)) if row else {}

            print_header(f"Member Dashboard: {stats.get('member_name', 'Unknown')}")
            print(f"Latest Weight: {stats.get('latest_weight', 'N/A')} kg")
            print(f"Current Goal:  {stats.get('active_goal', 'None')} (Target: {stats.get('target_value', 'N/A')})")
            print(f"Next Session:  {stats.get('next_pt_session', 'None')}")
            print("-" * 40)
            
            print("1. Add Health Metric")
            print("2. Set Fitness Goal")
            print("3. Book PT Session")
            print("4. Register for Class")
            print("5. View Health History")
            print("6. Update Profile")     # <--- NEW FEATURE
            print("7. Logout")
            
            choice = get_input("Select Option")

            if choice == '1':
                w = get_input("Weight (kg)")
                hr = get_input("Heart Rate (bpm)")
                # This INSERT satisfies "Log multiple metric entries; do not overwrite"
                cur.execute("INSERT INTO HealthMetric (member_id, weight, heart_rate, recorded_at) VALUES (%s, %s, %s, NOW())", 
                            (member_id, w, hr))
                conn.commit()
                print(">> Metric Added!")

            elif choice == '2':
                g_type = get_input("Goal Type (e.g. Weight Loss)")
                target = get_input("Target Value")
                cur.execute("INSERT INTO FitnessGoal (member_id, goal_type, target_value, start_date, status) VALUES (%s, %s, %s, CURRENT_DATE, 'active')",
                            (member_id, g_type, target))
                conn.commit()
                print(">> Goal Set!")

            elif choice == '3':
                tid = get_input("Trainer ID")
                rid = get_input("Room ID")
                time = get_input("Time (YYYY-MM-DD HH:MM:SS)")
                
                # Checks
                cur.execute("SELECT * FROM PTSession WHERE room_id = %s AND session_time = %s", (rid, time))
                if cur.fetchone():
                    print(">> Error: Room is booked!")
                    continue
                
                cur.execute("SELECT * FROM PTSession WHERE trainer_id = %s AND session_time = %s", (tid, time))
                if cur.fetchone():
                    print(">> Error: Trainer is busy!")
                    continue

                cur.execute("INSERT INTO PTSession (member_id, trainer_id, room_id, session_time, status) VALUES (%s, %s, %s, %s, 'scheduled')",
                            (member_id, tid, rid, time))
                conn.commit()
                print(">> Session Booked!")

            elif choice == '4':
                cid = get_input("Class ID")
                
                # Check Capacity
                cur.execute("SELECT COUNT(*) FROM ClassRegistration WHERE class_id = %s", (cid,))
                count = cur.fetchone()[0]
                cur.execute("SELECT capacity FROM Class WHERE class_id = %s", (cid,))
                res = cur.fetchone()
                if not res:
                    print(">> Class not found.")
                    continue
                capacity = res[0]
                
                if count >= capacity:
                    print(">> Error: Class is full!")
                    continue

                try:
                    cur.execute("INSERT INTO ClassRegistration (member_id, class_id) VALUES (%s, %s)", (member_id, cid))
                    conn.commit()
                    print(">> Registered!")
                except Exception as e:
                    conn.rollback()
                    print(f">> Error: {e}")
            
            elif choice == '5':
                # --- VIEW HEALTH HISTORY ---
                print_header("Health History")
                cur.execute("""
                    SELECT recorded_at, weight, heart_rate, body_fat, notes 
                    FROM HealthMetric 
                    WHERE member_id = %s 
                    ORDER BY recorded_at DESC
                """, (member_id,))
                
                rows = cur.fetchall()
                if not rows:
                    print("No records found.")
                else:
                    print(f"{'Date':<20} | {'Weight (kg)':<12} | {'Heart Rate':<10}")
                    print("-" * 50)
                    for r in rows:
                        date_str = r[0].strftime("%Y-%m-%d %H:%M")
                        weight = str(r[1]) if r[1] else "N/A"
                        hr = str(r[2]) if r[2] else "N/A"
                        print(f"{date_str:<20} | {weight:<12} | {hr:<10}")
                input("\nPress Enter to return...")

            elif choice == '6':
                # --- UPDATE PROFILE ---
                print_header("Update Profile")
                print("1. Update Name")
                print("2. Update Phone")
                print("3. Update Address")
                print("4. Update Email")
                print("5. Back")
                
                up_choice = get_input("Select Field")
                
                if up_choice == '1':
                    val = get_input("New Name")
                    cur.execute("UPDATE Member SET name = %s WHERE member_id = %s", (val, member_id))
                    conn.commit()
                    print(">> Name Updated!")
                elif up_choice == '2':
                    val = get_input("New Phone")
                    cur.execute("UPDATE Member SET phone = %s WHERE member_id = %s", (val, member_id))
                    conn.commit()
                    print(">> Phone Updated!")
                elif up_choice == '3':
                    val = get_input("New Address")
                    cur.execute("UPDATE Member SET address = %s WHERE member_id = %s", (val, member_id))
                    conn.commit()
                    print(">> Address Updated!")
                elif up_choice == '4':
                    val = get_input("New Email")
                    cur.execute("UPDATE Member SET email = %s WHERE member_id = %s", (val, member_id))
                    conn.commit()
                    print(">> Email Updated!")
            
            elif choice == '7':
                break
        except Exception as e:
            conn.rollback()
            print(f">> Error: {e}")
    conn.close()

def member_portal():
    print_header("Member Portal")
    print("1. Login")
    print("2. Register")
    print("3. Back")
    choice = get_input("Option")

    conn = get_connection()
    cur = conn.cursor()

    if choice == '1':
        email = get_input("Email")
        cur.execute("SELECT member_id FROM Member WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            member_dashboard(row[0])
        else:
            print(">> Member not found.")

    elif choice == '2':
        name = get_input("Name")
        email = get_input("Email")
        dob = get_input("DOB (YYYY-MM-DD)")
        cur.execute("INSERT INTO Member (name, email, date_of_birth) VALUES (%s, %s, %s) RETURNING member_id", (name, email, dob))
        mid = cur.fetchone()[0]
        conn.commit()
        print(f">> Registered! Your ID is {mid}")
        member_dashboard(mid)
    
    conn.close()

# --- TRAINER FUNCTIONS ---
def trainer_dashboard(trainer_id):
    conn = get_connection()
    cur = conn.cursor()
    while True:
        print_header("Trainer Dashboard")
        print("1. Set Availability")
        print("2. View Schedule")
        print("3. Search Member")
        print("4. Logout")
        choice = get_input("Option")

        if choice == '1':
            start = get_input("Start Time (YYYY-MM-DD HH:MM:SS)")
            end = get_input("End Time (YYYY-MM-DD HH:MM:SS)")
            
            # Overlap check
            cur.execute("""
                SELECT * FROM TrainerAvailability 
                WHERE trainer_id = %s AND NOT (%s <= start_time OR %s >= end_time)
            """, (trainer_id, end, start))
            
            if cur.fetchone():
                print(">> Error: Time overlaps with existing slot!")
            else:
                cur.execute("INSERT INTO TrainerAvailability (trainer_id, start_time, end_time) VALUES (%s, %s, %s)", 
                            (trainer_id, start, end))
                conn.commit()
                print(">> Availability Set!")

        elif choice == '2':
            print("\n--- Your Schedule ---")
            cur.execute("SELECT 'PT', session_time FROM PTSession WHERE trainer_id = %s UNION SELECT 'Class', scheduled_time FROM Class WHERE trainer_id = %s ORDER BY 2", (trainer_id, trainer_id))
            for row in cur.fetchall():
                print(f"{row[1]} - {row[0]}")
        
        elif choice == '3':
            name = get_input("Member Name Part")
            cur.execute("""
                SELECT m.name, fg.goal_type, hm.weight 
                FROM Member m 
                LEFT JOIN FitnessGoal fg ON m.member_id = fg.member_id 
                LEFT JOIN HealthMetric hm ON m.member_id = hm.member_id 
                WHERE m.name ILIKE %s LIMIT 1
            """, (f'%{name}%',))
            row = cur.fetchone()
            if row:
                print(f"Found: {row[0]} | Goal: {row[1]} | Weight: {row[2]}kg")
            else:
                print(">> Not found.")

        elif choice == '4':
            break
    conn.close()

def trainer_portal():
    print_header("Trainer Portal")
    print("1. Login")
    print("2. Register")
    print("3. Back")
    choice = get_input("Option")
    
    conn = get_connection()
    cur = conn.cursor()

    if choice == '1':
        email = get_input("Email")
        cur.execute("SELECT trainer_id FROM Trainer WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            trainer_dashboard(row[0])
        else:
            print(">> Not found.")

    elif choice == '2':
        name = get_input("Name")
        email = get_input("Email")
        cur.execute("INSERT INTO Trainer (name, email) VALUES (%s, %s) RETURNING trainer_id", (name, email))
        tid = cur.fetchone()[0]
        conn.commit()
        print(f">> Registered! Your ID is {tid}")
        trainer_dashboard(tid)
    conn.close()

# --- ADMIN FUNCTIONS ---
def admin_dashboard(admin_id):
    conn = get_connection()
    cur = conn.cursor()
    while True:
        print_header("Admin Dashboard")
        print("1. Create Class (Book Room)")
        print("2. Log Maintenance")
        print("3. Generate Bill")
        print("4. Logout")
        choice = get_input("Option")

        if choice == '1':
            name = get_input("Class Name")
            tid = get_input("Trainer ID")
            rid = get_input("Room ID")
            time = get_input("Time (YYYY-MM-DD HH:MM:SS)")
            
            # Room Conflict
            cur.execute("SELECT * FROM Class WHERE room_id = %s AND scheduled_time = %s", (rid, time))
            if cur.fetchone():
                print(">> Error: Room is booked!")
            else:
                cur.execute("INSERT INTO Class (class_name, trainer_id, room_id, scheduled_time, capacity, duration) VALUES (%s, %s, %s, %s, 20, 60)",
                            (name, tid, rid, time))
                conn.commit()
                print(">> Class Created & Room Booked!")

        elif choice == '2':
            eid = get_input("Equipment ID")
            desc = get_input("Issue Description")
            cur.execute("INSERT INTO MaintenanceLog (equipment_id, issue_description) VALUES (%s, %s)", (eid, desc))
            cur.execute("UPDATE Equipment SET status = 'maintenance' WHERE equipment_id = %s", (eid,))
            conn.commit()
            print(">> Maintenance Logged.")

        elif choice == '3':
            mid = get_input("Member ID")
            amt = get_input("Amount")
            due = get_input("Due Date (YYYY-MM-DD)")
            cur.execute("INSERT INTO Bill (member_id, amount, due_date, status) VALUES (%s, %s, %s, 'unpaid')", (mid, amt, due))
            conn.commit()
            print(">> Bill Generated.")

        elif choice == '4':
            break
    conn.close()

def admin_portal():
    print_header("Admin Portal")
    print("1. Login")
    print("2. Register")
    print("3. Back")
    choice = get_input("Option")
    
    conn = get_connection()
    cur = conn.cursor()

    if choice == '1':
        email = get_input("Email")
        cur.execute("SELECT admin_id FROM Admin WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            admin_dashboard(row[0])
        else:
            print(">> Not found.")
    elif choice == '2':
        name = get_input("Name")
        email = get_input("Email")
        cur.execute("INSERT INTO Admin (name, email) VALUES (%s, %s) RETURNING admin_id", (name, email))
        aid = cur.fetchone()[0]
        conn.commit()
        print(f">> Registered! Your ID is {aid}")
        admin_dashboard(aid)
    conn.close()

# --- MAIN LOOP ---
def main():
    while True:
        print_header("Health & Fitness Club Management System")
        print("1. Member Portal")
        print("2. Trainer Portal")
        print("3. Admin Portal")
        print("4. Exit")
        
        choice = get_input("Select Role")
        
        if choice == '1':
            member_portal()
        elif choice == '2':
            trainer_portal()
        elif choice == '3':
            admin_portal()
        elif choice == '4':
            print("Goodbye!")
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()
