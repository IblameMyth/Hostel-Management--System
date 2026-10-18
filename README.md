# Ycce Hostel — HTML, CSS and SQL Mini Project

## Files
- `login.html` — shared login page for Warden and Students
- `warden.html` — create student accounts, student list, attendance, requests and announcements
- `student.html` — attendance, requests and announcements
- `css/style.css` — responsive layout and mobile menu
- `js/auth-demo.js` — browser-only demo login and student account creation
- `database.sql` — MySQL schema and starter Warden record

## Warden demo login
- Email: `warden123@gmail.com`
- Password: `warden123`

Open `login.html`. The same form sends the Warden to `warden.html` and accounts created by the Warden to `student.html`.

## Note
Student demo accounts are stored in this browser's localStorage, not MySQL. The SQL schema is included, but real database login and account creation require a server backend such as PHP. Do not use this frontend-only demo for production authentication.
