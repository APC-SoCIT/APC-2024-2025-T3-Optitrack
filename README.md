# Optitrack - Overtime Management System

A simple web application for employees to file overtime requests and managers to approve them.

## Features

- **Employee Functions:**
  - File overtime requests with date, hours, and reason
  - View all submitted requests and their status

- **Manager Functions:**
  - View pending overtime requests
  - Approve or reject requests

## How to Use

1. Open `index.html` in a web browser
2. Use the "Switch Role" button to toggle between Employee and Manager views
3. As an Employee: Fill out the forms to submit overtime requests and task 
4. As a Manager: Review and approve/reject pending requests
5. As a Team Leader : Review and approve/reject pending requests if manager approved the pending request
6. As an Operation Manager : Review and approve/reject pending requests if team leader approved the pending request

## Data Storage

The application uses browser localStorage to persist data. All overtime requests are stored locally in the browser.

## Files

- `index.html` - Main application interface
- `styles.css` - Application styling
- `script.js` - Application logic and functionality
- `README.md` - This documentation file
