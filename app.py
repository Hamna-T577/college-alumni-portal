from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_mysqldb import MySQL
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from flask_session import Session
import random
import os
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
import docx
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_socketio import SocketIO, emit, join_room, leave_room
import MySQLdb
db = MySQLdb.connect(host="localhost", user="root", password="maluk", database="alumni_portal")

app = Flask(__name__)

socketio = SocketIO(app, cors_allowed_origins="*")  # Enable real-time communication


# ✅ Session Configuration
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.secret_key = '65f2138c59d81efa6126b710b676daf1'
Session(app)

# ✅ MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'maluk'
app.config['MYSQL_DB'] = 'alumni_portal'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'  # ✅ Use dictionary cursor

mysql = MySQL(app)
# ✅ Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'alumniportal123@gmail.com'
app.config['MAIL_PASSWORD'] = 'rlzh sluy emuj imqv'

mail = Mail(app)

# ======================== FRONTEND ROUTES ========================

@app.route('/')
def home():
    return render_template('index.html')



@app.route('/login-page')
def login_page():
    return render_template('login.html')

@app.route('/register-page')
def register_page():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/jobs-page')
def jobs_page():
    return render_template('jobs.html')

# ======================== OTP & REGISTRATION ========================

def generate_new_otp(email):
    otp = str(random.randint(100000, 999999))
    session['otp'] = otp
    session['email'] = email
    return otp

def send_otp(email):
    otp = generate_new_otp(email)
    msg = Message('Your OTP for Registration', sender=app.config['MAIL_USERNAME'], recipients=[email])
    msg.body = f'Your OTP is: {otp}'

    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        return False

@app.route('/send-otp', methods=['POST'])
def request_otp():
    data = request.json
    email = data.get('email')

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT graduation_year FROM allowed_emails WHERE email = %s", (email,))
    allowed_user = cursor.fetchone()
    cursor.close()

    if not allowed_user:
        return jsonify({'error': 'Email is not registered with the college'}), 400

    if send_otp(email):
        return jsonify({'message': 'OTP sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()

    email = data.get('email')
    entered_otp = data.get('otp')
    full_name = data.get('full_name')
    password = data.get('password')

    # ✅ 1. Check if OTP and email are in session
    if 'otp' not in session or 'email' not in session:
        return jsonify({"error": "Session expired or invalid. Please request OTP again."}), 400

    if session['email'] != email:
        return jsonify({"error": "Email mismatch. Use the email where OTP was sent."}), 400

    if session['otp'] != entered_otp:
        return jsonify({"error": "Invalid OTP. Please try again."}), 400

    # ✅ 2. Check if user already exists
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        return jsonify({"error": "User already registered. Please log in."}), 400

    # ✅ 3. Fetch graduation year & role from allowed_emails table
    cursor.execute("SELECT graduation_year, role FROM allowed_emails WHERE email = %s", (email,))
    allowed_data = cursor.fetchone()

    if not allowed_data:
        cursor.close()
        return jsonify({"error": "Email not allowed for registration."}), 400

    graduation_year = allowed_data['graduation_year']
    role = allowed_data['role']

    # ✅ 4. Hash the password and insert the user
    hashed_password = generate_password_hash(password)

    cursor.execute("""
        INSERT INTO users (full_name, email, password, graduation_year, role)
        VALUES (%s, %s, %s, %s, %s)
    """, (full_name, email, hashed_password, graduation_year, role))
    
    mysql.connection.commit()
    cursor.close()

    # ✅ 5. Clear OTP from session after success
    session.pop('otp', None)
    session.pop('email', None)

    return jsonify({"success": True, "message": "User registered successfully."}), 200



# ======================== LOGIN SYSTEM ========================

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    cursor = mysql.connection.cursor()

    # ✅ Step 1: Check if user exists in `users` table and validate password
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user['password'], password):
        cursor.close()
        return jsonify({'error': 'Incorrect email or password'}), 400

    # ✅ Step 2: Fetch the role from `allowed_emails` table
    cursor.execute("SELECT role FROM allowed_emails WHERE email = %s", (email,))
    allowed_user = cursor.fetchone()
    cursor.close()

    if not allowed_user:
        return jsonify({'error': 'User role not found. Please contact admin.'}), 400

    role = allowed_user['role']  # ✅ Get the role from `allowed_emails`

    # ✅ Step 3: Store session and redirect based on role
    session['user_id'] = user['id']
    session['role'] = role

    return jsonify({'message': 'Login successful', 'redirect': f"/dashboard/{role}"}), 200


@app.route('/logout')
def logout():
    # Clear the user session
    session.clear()
    # Redirect to index.html
    return redirect(url_for('home'))
# ======================== DASHBOARDS ========================

@app.route('/dashboard/admin')
def admin_dashboard():
      
    return render_template('admin_dashboard.html')

@app.route('/dashboard/alumni')
def alumni_dashboard():
 
    return render_template('alumni_dashboard.html')

@app.route('/dashboard/student')
def student_dashboard():
   
       return render_template('student_dashboard.html')

# ======================== JOB SYSTEM ========================

@app.route('/post-job-page')
def post_job_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))  # ✅ Redirect if not logged in
    return render_template('post_job.html')


@app.route('/post-job', methods=['POST'])
def post_job():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please log in first!'}), 401

    data = request.json
    title = data.get('title')
    description = data.get('description')
    company = data.get('company')
    location = data.get('location')
    skills_required = data.get('skills_required')

    if not (title and description and company and location and skills_required):
        return jsonify({'error': 'All fields are required!'}), 400

    user_id = session['user_id']

    cursor = mysql.connection.cursor()
    cursor.execute("""
        INSERT INTO jobs (title, description, company, location, skills_required, posted_by)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (title, description, company, location, skills_required, user_id))

    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Job posted successfully!'}), 201

@app.route('/get-jobs', methods=['GET'])
def get_jobs():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT j.id, j.title, j.company, j.location, j.skills_required, 
                   u.full_name AS posted_by, u.id AS posted_by_id, j.posted_at 
            FROM jobs j
            JOIN users u ON j.posted_by = u.id
            ORDER BY j.posted_at DESC
        """)
        jobs = cursor.fetchall()
        cursor.close()

        job_list = []
        for job in jobs:
            job_list.append({
                'id': job['id'],
                'title': job['title'],
                'company': job['company'],
                'location': job['location'],
                'skills_required': job['skills_required'],
                'posted_by': job['posted_by'],
                'posted_by_id': job['posted_by_id'],
                'posted_at': job['posted_at'].strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify(job_list), 200  # ✅ Always return JSON

    except Exception as e:
        print(f"❌ Error fetching jobs: {str(e)}")  # ✅ Debugging
        return jsonify({'error': 'Failed to fetch jobs'}), 500  # ✅ Return JSON even on error

@app.route('/delete-job/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized access. Please login first.'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT posted_by FROM jobs WHERE id = %s", (job_id,))
    job = cursor.fetchone()

    if not job or user_id != job['posted_by']:
        return jsonify({'error': 'You can only delete jobs you posted!'}), 403

    cursor.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Job deleted successfully!'}), 200

# ======================== JOB APPLICATION SYSTEM ========================

@app.route('/my-applications', methods=['GET'])
def my_applications():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized access.'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT ja.id, j.title, j.company, j.location, ja.application_date, ja.status
        FROM job_applications ja
        JOIN jobs j ON j.id = ja.job_id
        WHERE ja.applicant_id = %s
        ORDER BY ja.application_date DESC
    """, (user_id,))

    applications = cursor.fetchall()
    cursor.close()
    return jsonify(applications), 200
from flask import jsonify
from datetime import datetime

@app.route('/get-applications', methods=['GET'])
def get_applications():
    try:
        # 🧠 Ensure user is logged in
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized access'}), 403

        user_id = session['user_id']
        role = session.get('role')

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        if role == 'admin':
            # Admin can see all applications
            cursor.execute("""
                SELECT 
                    a.id AS application_id,
                    a.status,
                    u.full_name AS applicant_name,
                    u.email AS applicant_email,
                    j.title AS job_title,
                    j.company,
                    j.posted_by
                FROM job_applications a
                JOIN users u ON a.applicant_id = u.id
                JOIN jobs j ON a.job_id = j.id
                ORDER BY a.id DESC
            """)
        elif role == 'alumni':
            # Alumni can only see applications for jobs they posted
            cursor.execute("""
                SELECT 
                    a.id AS application_id,
                    a.status,
                    u.full_name AS applicant_name,
                    u.email AS applicant_email,
                    j.title AS job_title,
                    j.company,
                    j.posted_by
                FROM job_applications a
                JOIN users u ON a.applicant_id = u.id
                JOIN jobs j ON a.job_id = j.id
                WHERE j.posted_by = %s  -- Only jobs posted by this alumni
                ORDER BY a.id DESC
            """, (user_id,))
        else:
            # Students can only see their own applications
            cursor.execute("""
                SELECT 
                    a.id AS application_id,
                    a.status,
                    j.title AS job_title,
                    j.company,
                    j.posted_by,
                    u.full_name as posted_by_name
                FROM job_applications a
                JOIN jobs j ON a.job_id = j.id
                JOIN users u ON j.posted_by = u.id
                WHERE a.applicant_id = %s  -- Only applications by this student
                ORDER BY a.id DESC
            """, (user_id,))
            
        rows = cursor.fetchall()
        cursor.close()

        applications = []
        for row in rows:
            application_data = {
                'application_id': row['application_id'],
                'status': row['status'],
                'job_title': row['job_title'],
                'company': row['company']
            }
            
            if role in ['admin', 'alumni']:
                application_data.update({
                    'applicant_name': row['applicant_name'],
                    'applicant_email': row['applicant_email']
                })
            else:  # For students
                application_data['posted_by_name'] = row['posted_by_name']
                
            applications.append(application_data)

        return jsonify(applications), 200

    except Exception as e:
        print(f"❌ Error fetching applications: {str(e)}")
        return jsonify({'error': 'Failed to fetch applications'}), 500



@app.route('/update-application/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized access.'}), 401

    user_id = session['user_id']
    role = session['role']
    data = request.json
    new_status = data.get('status')

    if new_status not in ['accepted', 'rejected', 'pending']:
        return jsonify({'error': 'Invalid status!'}), 400

    cursor = mysql.connection.cursor()

    try:
        # Get job_id and applicant_id from job_applications
        cursor.execute("""
            SELECT a.job_id, a.applicant_id, j.posted_by 
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = %s
        """, (app_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Application not found!'}), 404

        job_id = result['job_id']
        applicant_id = result['applicant_id']
        job_poster_id = result['posted_by']

        # Authorization checks
        if role == 'alumni' and job_poster_id != user_id:
            return jsonify({'error': 'You can only update applications for your jobs!'}), 403
        elif role == 'student' and applicant_id != user_id:
            return jsonify({'error': 'You can only update your own applications!'}), 403

        # Update the status
        cursor.execute("""
            UPDATE job_applications 
            SET status = %s 
            WHERE id = %s
        """, (new_status, app_id))
        
        mysql.connection.commit()
        
        # Notify the applicant about status change
        if role in ['admin', 'alumni']:
            socketio.emit('application_status_update', {
                'application_id': app_id,
                'new_status': new_status,
                'job_id': job_id
            }, room=f"user_{applicant_id}")

        return jsonify({'message': 'Application status updated successfully!'}), 200

    except Exception as e:
        mysql.connection.rollback()
        print(f"Error updating application: {str(e)}")
        return jsonify({'error': 'Failed to update application'}), 500
    finally:
        cursor.close()

# --- STUDENT Applications Page ---
@app.route('/student/applications')
def student_applications():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
    return render_template('student_applications.html')

# --- ALUMNI Applications Page ---
@app.route('/alumni/applications')
def alumni_applications():
    if session.get('role') != 'alumni':
        return redirect(url_for('login'))
    return render_template('alumni_applications.html')

# --- ADMIN Applications Page ---
@app.route('/admin/applications')
def admin_applications():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))

    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT 
                a.id AS application_id,
                j.title AS job_title,
                j.company AS company,
                u.full_name AS applicant_name,
                u.email AS applicant_email,
                a.status
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.applicant_id = u.id
        """)
        applications = cur.fetchall()
        cur.close()

        app_list = []
        for app in applications:
            app_list.append({
                "application_id": app[0],
                "job_title": app[1],
                "company": app[2],
                "applicant_name": app[3],
                "applicant_email": app[4],
                "status": app[5]
            })

        return render_template("admin_applications.html", applications=app_list)

    except Exception as e:
        print("🔥 ERROR in /admin/applications:", e)
        return render_template("admin_applications.html", applications=[])


@app.route('/get-current-user', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT u.full_name, u.email, 
               COALESCE(a.graduation_year, 'Not Available') AS graduation_year, 
               u.skills 
        FROM users u
        JOIN allowed_emails a ON u.email = a.email
        WHERE u.id = %s
    """, (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if user:
        return jsonify(user), 200
    else:
        return jsonify({'error': 'User not found'}), 404


@app.route('/apply-job', methods=['POST'])
def apply_job():
    if 'user_id' not in session or session.get('role') not in ['student', 'alumni']:
        return jsonify({'error': 'Only students and alumni can apply for jobs.'}), 403

    data = request.json
    job_id = data.get('job_id')

    if not job_id:
        return jsonify({'error': 'Job ID is required!'}), 400

    user_id = session['user_id']

    # ✅ Check if user already applied
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM job_applications WHERE job_id = %s AND applicant_id = %s", (job_id, user_id))
    existing_application = cursor.fetchone()

    if existing_application:
        return jsonify({'error': 'You have already applied for this job.'}), 400

    # ✅ Insert new job application
    cursor.execute("INSERT INTO job_applications (job_id, applicant_id) VALUES (%s, %s)", (job_id, user_id))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Job application submitted successfully!'}), 201


@app.route('/profile')
def profile_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))  # Redirect to login if not logged in

    user_id = session['user_id']

    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT u.full_name, u.email, u.role AS user_role, u.skills, 
               a.graduation_year, a.role AS allowed_role 
        FROM users u
        JOIN allowed_emails a ON u.email = a.email
        WHERE u.id = %s
    """, (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if user:
        # ✅ Ensure both role and graduation_year are fetched properly
        user['role'] = user['user_role'] if user['user_role'] else user['allowed_role']

    return render_template('profile.html', user=user)

# ✅ Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/about')
def about():
    return render_template('about.html')  # Ensure 'about.html' exists

@app.route('/contact')
def contact():
    return render_template('contact.html')  # Ensure 'contact.html' exists in the 'templates' folder

@app.route('/messages')
def messages():
    return render_template('messages.html')

# ✅ Configure Upload Folder
UPLOAD_FOLDER = 'static/uploads/events'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ✅ Ensure Upload Directory Exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ✅ Function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ======================== EVENT MANAGEMENT ROUTES ========================

# ✅ Add New Event (Admins & Alumni Only)
@app.route('/add-event', methods=['POST'])
def add_event():
    if 'user_id' not in session or session.get('role') not in ['admin', 'alumni']:
        return jsonify({'error': 'Unauthorized access!'}), 403

    title = request.form.get('title')
    description = request.form.get('description')
    image = request.files.get('image')

    if not title or not description or not image:
        return jsonify({'error': 'All fields are required!'}), 400

    # ✅ Save Image
    if allowed_file(image.filename):
        filename = secure_filename(image.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath)
        image_url = f'static/uploads/events/{filename}'  # Save relative path
    else:
        return jsonify({'error': 'Invalid file type!'}), 400

    # ✅ Insert Event into Database
    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    cursor.execute("INSERT INTO events (title, description, image_path, created_by) VALUES (%s, %s, %s, %s)",
                   (title, description, image_url, user_id))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Event added successfully!', 'image_url': image_url}), 201

# ✅ Get All Events (For Homepage)
@app.route('/get-events', methods=['GET'])
def get_events():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT e.id, e.title, e.description, e.image_path, e.created_at, u.full_name AS posted_by "
                   "FROM events e JOIN users u ON e.created_by = u.id ORDER BY e.created_at DESC")
    events = cursor.fetchall()
    cursor.close()

    return jsonify(events), 200

@app.route('/events')
def events_page():
    return render_template('events.html')  # Make sure events.html exists in templates/


@app.route('/add-event-page')
def add_event_page():
    if 'user_id' not in session or session.get('role') not in ['admin', 'alumni']:
        return redirect(url_for('login_page'))
    return render_template('add_event.html')

@app.route('/my-events', methods=['GET'])
def my_events():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized access'}), 403

    user_id = session['user_id']
    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT id, title, description, image_path, created_at 
        FROM events WHERE created_by = %s ORDER BY created_at DESC
    """, (user_id,))

    events = cursor.fetchall()
    cursor.close()

    if not events:
        return jsonify([])  # Return empty list instead of error

    return jsonify(events), 200


@app.route('/delete-event/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized access'}), 403

    user_id = session['user_id']
    role = session['role']

    cursor = mysql.connection.cursor()

    # ✅ Check if the event exists and is created by the user
    cursor.execute("SELECT created_by FROM events WHERE id = %s", (event_id,))
    event = cursor.fetchone()

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # ✅ Admins can delete any event, but Alumni can only delete their own
    if role != 'admin' and event['created_by'] != user_id:
        return jsonify({'error': 'You can only delete your own events!'}), 403

    # ✅ Delete the event
    cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Event deleted successfully!'}), 200



@app.route('/profile-alumni')
def profile_alumni():
    if 'user_id' not in session or session.get('role') != 'alumni':
        return redirect(url_for('login_page'))  # Redirect if not logged in or not alumni

    user_id = session["user_id"]

    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT u.full_name, u.email, a.graduation_year, u.skills 
        FROM users u
        JOIN allowed_emails a ON u.email = a.email
        WHERE u.id = %s
    """, (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if not user or not user["graduation_year"]:
        user["graduation_year"] = "Not Available"  # Handle missing data

    return render_template('profile_alumni.html', user=user)


import pandas as pd

@app.route('/get-skills', methods=['GET'])
def get_skills():
    skills_df = pd.read_csv("static/data/skills.csv")
    skills_list = skills_df["Skill"].dropna().tolist()
    return jsonify(skills_list)

@app.route('/update-skills', methods=['POST'])
def update_skills():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.json
    new_skills = data.get('skills')

    if not new_skills:
        return jsonify({'error': 'No skills provided'}), 400

    user_id = session['user_id']

    # ✅ Update Database
    cursor = mysql.connection.cursor()
    cursor.execute("UPDATE users SET skills = %s WHERE id = %s", (new_skills, user_id))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Skills updated successfully!'}), 200

from flask import jsonify, session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@app.route('/recommend-jobs', methods=['GET'])
def recommend_jobs():
    if 'user_id' not in session or session.get('role') not in ['student', 'alumni']:
        return jsonify({'error': 'Unauthorized access'}), 403

    user_id = session['user_id']

    cursor = mysql.connection.cursor()

    # ✅ Fetch User's Skills
    cursor.execute("SELECT skills FROM users WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    user_skills = user_data['skills'] if user_data and user_data['skills'] else None

    if not user_skills:
        return jsonify([])  # No skills → No recommendations

    # ✅ Fetch All Jobs
    cursor.execute("SELECT id, title, description, skills_required, company, location, posted_by FROM jobs")
    jobs = cursor.fetchall()
    cursor.close()

    if not jobs:
        return jsonify([])  # No jobs available

    # ✅ Prepare Data for TF-IDF
    job_descriptions = [job['skills_required'] for job in jobs]
    job_ids = [job['id'] for job in jobs]

    job_descriptions.append(user_skills)  # Add user skills to TF-IDF corpus

    # ✅ Apply TF-IDF Vectorization
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(job_descriptions)

    # ✅ Compute Cosine Similarity
    similarity_scores = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]
    print("All similarity scores:", similarity_scores)

    # ✅ Filter & Sort Jobs (Only similarity > 0.5)
    job_recommendations = [
        (job_ids[i], similarity_scores[i]) 
        for i in range(len(job_ids)) 
        if similarity_scores[i] > 0.1
    ]
    job_recommendations.sort(key=lambda x: x[1], reverse=True)

    # ✅ Select Top 5 Matches
    recommended_jobs = []
    for job_id, score in job_recommendations[:5]:  # Pick top 5 jobs
        for job in jobs:
            if job['id'] == job_id:
                recommended_jobs.append({
                    'id': job['id'],
                    'title': job['title'],
                    'company': job['company'],
                    'location': job['location'],
                    'skills_required': job['skills_required'],
                    'posted_by': job['posted_by'],
                    'similarity_score': round(score, 2)
                })

    # ✅ If No Jobs Match, Show Latest 5 Jobs
    recommended_jobs = []
    for i, job in enumerate(jobs):
        recommended_jobs.append({
            'id': job['id'],
            'title': job['title'],
            'company': job['company'],
            'location': job['location'],
            'skills_required': job['skills_required'],
            'posted_by': job['posted_by'],
            'similarity_score': round(similarity_scores[i], 2)
        })
    # Sort by score anyway
    recommended_jobs.sort(key=lambda x: x['similarity_score'], reverse=True)
    recommended_jobs = recommended_jobs[:5]  # Still show top 5

    return jsonify(recommended_jobs), 200
@app.route('/search-users')
def search_users():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({'error': 'No name provided'}), 400

    cursor = mysql.connection.cursor()
    query = """
    SELECT id, full_name, role, graduation_year FROM users 
    WHERE full_name LIKE %s
    """
    cursor.execute(query, ('%' + name + '%',))
    users = cursor.fetchall()
    cursor.close()

    return jsonify(users)


@app.route('/profile-suggestion/<int:user_id>')
def profile_suggestion(user_id):
    cursor = mysql.connection.cursor()
    query = "SELECT id, full_name, department, graduation_year,skills,role FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    cursor.close()

    if not user:
        return "User not found", 404

    return render_template("profile_suggestion.html", user=user)

def get_db_connection():
    return MySQLdb.connect(host="localhost", user="root", password="maluk", database="alumni_portal")

# ======================== CONNECTION MANAGEMENT ROUTES ========================

from datetime import datetime  # Add this import at the top of app.py

@app.route('/send-connection-request', methods=['POST'])
def send_connection_request():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login first!'}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        receiver_id = data.get('receiver_id')
        if not receiver_id:
            return jsonify({'error': 'Receiver ID is required'}), 400

        sender_id = session['user_id']
        
        # Prevent self-connection
        if sender_id == receiver_id:
            return jsonify({'error': 'You cannot connect with yourself!'}), 400

        cursor = mysql.connection.cursor()
        
        try:
            # Check if connection already exists
            cursor.execute("""
                SELECT id, status, sender_id FROM connections 
                WHERE (sender_id = %s AND receiver_id = %s) 
                OR (sender_id = %s AND receiver_id = %s)
            """, (sender_id, receiver_id, receiver_id, sender_id))
            
            existing = cursor.fetchone()

            if existing:
                if existing['status'] == 'accepted':
                    return jsonify({'error': 'You are already connected with this user!'}), 400
                elif existing['status'] == 'pending':
                    if existing['sender_id'] == sender_id:
                        return jsonify({'error': 'Request already sent!'}), 400
                    else:
                        return jsonify({'error': 'This user already sent you a request!'}), 400
                elif existing['status'] == 'rejected':
                    return jsonify({'error': 'Previous request was rejected'}), 400

            # Insert new connection request
            cursor.execute("""
                INSERT INTO connections (sender_id, receiver_id, status) 
                VALUES (%s, %s, 'pending')
            """, (sender_id, receiver_id))
            
            mysql.connection.commit()
            
            # Get sender's name for notification
            cursor.execute("SELECT full_name FROM users WHERE id = %s", (sender_id,))
            sender = cursor.fetchone()
            sender_name = sender['full_name'] if sender else 'Unknown user'

            # Prepare response
            response = {
                'success': True,
                'message': 'Connection request sent successfully!',
                'request_id': cursor.lastrowid
            }
            
            return jsonify(response), 200

        except Exception as e:
            mysql.connection.rollback()
            print(f"Database error: {str(e)}")
            return jsonify({'error': 'Database operation failed'}), 500
        finally:
            cursor.close()

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get-pending-requests', methods=['GET'])
def get_pending_requests():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    
    try:
        # Get all pending requests where current user is the receiver
        cursor.execute("""
            SELECT c.id, u.id as sender_id, u.full_name, u.profile_image, c.created_at 
            FROM connections c
            JOIN users u ON c.sender_id = u.id
            WHERE c.receiver_id = %s AND c.status = 'pending'
            ORDER BY c.created_at DESC
        """, (user_id,))
        
        requests = cursor.fetchall()
        return jsonify(requests), 200
        
    except Exception as e:
        print(f"Error fetching pending requests: {str(e)}")
        return jsonify({'error': 'Failed to fetch requests'}), 500
    finally:
        cursor.close()

@app.route('/respond-to-request', methods=['POST'])
def respond_to_request():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    request_id = data.get('request_id')
    action = data.get('action')  # 'accept' or 'reject'
    
    if not request_id or not action:
        return jsonify({'error': 'Missing required fields'}), 400

    cursor = mysql.connection.cursor()
    
    try:
        # Verify the request exists and belongs to this user
        cursor.execute("""
            SELECT id, sender_id, receiver_id FROM connections 
            WHERE id = %s AND receiver_id = %s AND status = 'pending'
        """, (request_id, session['user_id']))
        
        connection = cursor.fetchone()
        if not connection:
            return jsonify({'error': 'Request not found'}), 404

        # Update status based on action
        new_status = 'accepted' if action == 'accept' else 'rejected'
        cursor.execute("""
            UPDATE connections SET status = %s 
            WHERE id = %s
        """, (new_status, request_id))
        
        mysql.connection.commit()
        
        # Notify the sender about the response
        socketio.emit('connection_request_response', {
            'request_id': request_id,
            'receiver_id': session['user_id'],
            'status': new_status,
            'timestamp': datetime.now().isoformat()
        }, room=f"user_{connection['sender_id']}")
        
        return jsonify({
            'success': True,
            'message': f'Request {new_status}'
        }), 200

    except Exception as e:
        mysql.connection.rollback()
        print(f"Error responding to request: {str(e)}")
        return jsonify({'error': 'Failed to process request'}), 500
    finally:
        cursor.close()


@app.route('/requests')
def requests_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('requests.html')



@app.route('/get-connections', methods=['GET'])
def get_connections():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    
    try:
        # Get all accepted connections
        cursor.execute("""
            SELECT 
                u.id, 
                u.full_name, 
                u.profile_image,
                u.department,
                u.graduation_year,
                CASE 
                    WHEN c.sender_id = %s THEN 'You sent request'
                    ELSE 'They sent request'
                END as connection_type,
                c.created_at as connected_since
            FROM connections c
            JOIN users u ON (c.sender_id = u.id OR c.receiver_id = u.id) AND u.id != %s
            WHERE (c.sender_id = %s OR c.receiver_id = %s) AND c.status = 'accepted'
            ORDER BY c.created_at DESC
        """, (user_id, user_id, user_id, user_id))
        
        connections = cursor.fetchall()
        return jsonify(connections), 200
        
    except Exception as e:
        print(f"Error fetching connections: {str(e)}")
        return jsonify({'error': 'Failed to fetch connections'}), 500
    finally:
        cursor.close()


# Get conversation with a specific user
@app.route('/get-messages/<int:other_user_id>', methods=['GET'])
def get_messages(other_user_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    
    # Verify connection exists
    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT id FROM connections 
        WHERE ((sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s))
        AND status = 'accepted'
    """, (user_id, other_user_id, other_user_id, user_id))
    
    if not cursor.fetchone():
        return jsonify({'error': 'You must be connected to message this user'}), 403

    # Get messages
    cursor.execute("""
        SELECT m.*, u.full_name as sender_name 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
        ORDER BY timestamp ASC
    """, (user_id, other_user_id, other_user_id, user_id))
    
    messages = cursor.fetchall()
    cursor.close()
    return jsonify(messages), 200

# Send a new message
@socketio.on('send_message')
def handle_send_message(data):
    if 'user_id' not in session:
        return
    
    sender_id = session['user_id']
    receiver_id = data['receiver_id']
    message_content = data['message']
    
    # Save to database
    cursor = mysql.connection.cursor()
    cursor.execute("""
        INSERT INTO messages (sender_id, receiver_id, message)
        VALUES (%s, %s, %s)
    """, (sender_id, receiver_id, message_content))
    mysql.connection.commit()
    
    # Get the inserted message
    message_id = cursor.lastrowid
    cursor.execute("""
        SELECT m.*, u.full_name as sender_name 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = %s
    """, (message_id,))
    message = cursor.fetchone()
    cursor.close()
    
    # Emit to receiver
    emit('new_message', message, room=f"user_{receiver_id}")
    
    # Confirm to sender
    emit('message_confirmed', message, room=f"user_{sender_id}")
# Get all conversations (like Instagram DM list)
@app.route('/get-conversations', methods=['GET'])
def get_conversations():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    
    try:
        # Simplified and corrected query
        cursor.execute("""
            SELECT 
                u.id as user_id, 
                u.full_name, 
                u.profile_image, 
                (SELECT message FROM messages 
                 WHERE (sender_id = %s AND receiver_id = u.id) OR 
                       (sender_id = u.id AND receiver_id = %s)
                 ORDER BY timestamp DESC LIMIT 1) as last_message,
                (SELECT timestamp FROM messages 
                 WHERE (sender_id = %s AND receiver_id = u.id) OR 
                       (sender_id = u.id AND receiver_id = %s)
                 ORDER BY timestamp DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM messages 
                 WHERE sender_id = u.id AND receiver_id = %s AND is_read = FALSE) as unread_count
            FROM connections c
            JOIN users u ON (c.sender_id = u.id OR c.receiver_id = u.id) AND u.id != %s
            WHERE (c.sender_id = %s OR c.receiver_id = %s) AND c.status = 'accepted'
            GROUP BY u.id, u.full_name, u.profile_image
        """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        
        conversations = cursor.fetchall()
        return jsonify(conversations), 200
        
    except Exception as e:
        print(f"Database error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/messages')
@app.route('/messages/<int:other_user_id>')
def messages_page(other_user_id=None):
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    if other_user_id:
        # Verify connection exists
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id FROM connections 
            WHERE ((sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s))
            AND status = 'accepted'
        """, (session['user_id'], other_user_id, other_user_id, session['user_id']))
        
        if not cursor.fetchone():
            return redirect(url_for('messages_page'))
        cursor.close()
    
    return render_template('messages.html')

@app.route('/get-connections-for-chat', methods=['GET'])
def get_connections_for_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()
    
    try:
        cursor.execute("""
            SELECT u.id, u.full_name, u.profile_image 
            FROM connections c
            JOIN users u ON (c.sender_id = u.id OR c.receiver_id = u.id) AND u.id != %s
            WHERE (c.sender_id = %s OR c.receiver_id = %s) AND c.status = 'accepted'
            ORDER BY u.full_name
        """, (user_id, user_id, user_id))
        
        connections = cursor.fetchall()
        return jsonify(connections), 200
        
    except Exception as e:
        print(f"Error fetching connections: {str(e)}")
        return jsonify({'error': 'Failed to fetch connections'}), 500
    finally:
        cursor.close()


@app.route('/get-user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("""
            SELECT id, full_name, profile_image, email 
            FROM users 
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify(user), 200
        
    except Exception as e:
        print(f"Error fetching user: {str(e)}")
        return jsonify({'error': 'Failed to fetch user'}), 500
    finally:
        cursor.close()

@app.route('/get-all-users-admin', methods=['GET'])
def get_all_users_for_admin():
    try:
        if 'user_id' not in session or session.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            SELECT id, full_name, email, role, graduation_year, skills
            FROM users
            ORDER BY full_name ASC
        """)
        users = cursor.fetchall()
        cursor.close()

        return jsonify(users), 200

    except Exception as e:
        print(f"❌ Error fetching users for admin: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@socketio.on('connect')
def handle_connect():
    if 'user_id' in session:
        join_room(f"user_{session['user_id']}")
        print(f"User {session['user_id']} connected to their room")

@socketio.on('disconnect')
def handle_disconnect():
    if 'user_id' in session:
        leave_room(f"user_{session['user_id']}")
        print(f"User {session['user_id']} disconnected")

# In app.py
@socketio.on('join')
def handle_join(data):
    user_id = data.get('userId')
    if user_id:
        join_room(f"user_{user_id}")
        print(f"User {user_id} joined their room")
#########################################################

# ======================== RUN FLASK APP ========================

if __name__ == '__main__':
    socketio.run(app, debug=True)
