from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash
import sqlite3

register_bp = Blueprint('register', __name__)

@register_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not username or not password:
            flash("Please fill in all fields")
            return redirect(url_for('register.register'))

        hashed_password = generate_password_hash(password)

        try:
            conn = sqlite3.connect('prototype/database.db')
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
            conn.commit()
            conn.close()
            flash("Registration successful!")
            return redirect(url_for('register.register'))
        except sqlite3.IntegrityError:
            flash("Username already exists.")
            return redirect(url_for('register.register'))

    return render_template('register.html')
