from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# Initialize the database
def init_db():
    conn = sqlite3.connect('prototype/database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Home page – renders register.html
@app.route('/', methods=['GET'])
def home():
    return render_template('register.html')

# Register route
@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = generate_password_hash(request.form['password'])

    conn = sqlite3.connect('prototype/database.db')
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return "Username already exists. Please go back and try again."
    conn.close()
    return redirect(url_for('home'))

# Login route
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password_input = request.form['password']

    conn = sqlite3.connect('prototype/database.db')
    c = conn.cursor()
    c.execute('SELECT password FROM users WHERE username = ?', (username,))
    result = c.fetchone()
    conn.close()

    if result and check_password_hash(result[0], password_input):
        session['user'] = username
    else:
        session['user'] = None

    return redirect(url_for('home'))

# Run the app
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
