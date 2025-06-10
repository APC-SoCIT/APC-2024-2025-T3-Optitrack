from flask import Flask
import os
import sqlite3

from register import register_bp

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Register blueprint
app.register_blueprint(register_bp)

# Initialize DB if not exists
def init_db():
    if not os.path.exists('prototype/database.db'):
        conn = sqlite3.connect('prototype/database.db')
        c = conn.cursor()
        c.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
