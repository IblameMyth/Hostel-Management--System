/* Ycce Hostel frontend demo. Data is stored in this browser's localStorage, not MySQL. */
const WARDEN_ACCOUNT = { email: 'warden123@gmail.com', password: 'warden123', role: 'warden', name: 'Hostel Warden' };
const USERS_KEY = 'havenHostelDemoUsers';
const SESSION_KEY = 'havenHostelDemoSession';
const REQUESTS_KEY = 'havenHostelRequests';
const ATTENDANCE_KEY = 'havenHostelAttendance';
const ANNOUNCEMENTS_KEY = 'havenHostelAnnouncements';
const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
function readUsers() { return read(USERS_KEY); }
function getAccounts() { return [WARDEN_ACCOUNT, ...readUsers()]; }
function getSession() { return read(SESSION_KEY, null); }
function goToRole(role) { window.location.href = role === 'warden' ? 'warden.html' : 'student.html'; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function setMessage(el, text, ok = true) { if (!el) return; el.textContent = text; el.className = `form-message ${ok ? 'success' : 'error'}`; }
function students() { return readUsers().filter(u => u.role === 'student'); }

const loginForm = document.querySelector('[data-login-form]');
if (loginForm) loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim().toLowerCase();
  const password = document.querySelector('#password').value;
  const account = getAccounts().find(u => String(u.email).toLowerCase() === email && u.password === password);
  const message = document.querySelector('#login-message');
  if (!account) { message.textContent = 'Incorrect email or password.'; message.hidden = false; return; }
  write(SESSION_KEY, { email: account.email, role: account.role, name: account.name || account.full_name || account.email });
  goToRole(account.role);
});

const currentPage = location.pathname.split('/').pop();
const activeSession = getSession();
if (currentPage === 'warden.html' && (!activeSession || activeSession.role !== 'warden')) location.replace('login.html');
if (currentPage === 'student.html' && (!activeSession || activeSession.role !== 'student')) location.replace('login.html');
document.querySelectorAll('[data-current-user]').forEach(el => { if (activeSession) el.textContent = activeSession.name || activeSession.email; });
document.querySelectorAll('.logout, .topbar-user').forEach(el => { if (el.getAttribute('href') === 'login.html') el.addEventListener('click', () => localStorage.removeItem(SESSION_KEY)); });

// Warden creates student accounts.
const studentForm = document.querySelector('[data-student-create-form]');
if (studentForm) studentForm.addEventListener('submit', event => {
  event.preventDefault();
  const session = getSession(), message = document.querySelector('#student-create-message');
  if (!session || session.role !== 'warden') { location.replace('login.html'); return; }
  const name = document.querySelector('#new-student-name').value.trim();
  const email = document.querySelector('#new-student-email').value.trim().toLowerCase();
  const password = document.querySelector('#new-student-password').value;
  if (!name || !email || !password) { setMessage(message, 'Complete all fields.', false); return; }
  if (getAccounts().some(u => String(u.email).toLowerCase() === email)) { setMessage(message, 'Email is already registered. Use another email.', false); return; }
  if (password.length < 6) { setMessage(message, 'Password must contain at least 6 characters.', false); return; }
  const users = readUsers(); users.push({ name, email, password, role: 'student' }); write(USERS_KEY, users);
  setMessage(message, `Student account created: ${email}`); studentForm.reset(); document.querySelector('#new-student-password').value = 'student123'; renderDemoStudents(); renderAttendanceRegister();
});
function renderDemoStudents() {
  const target = document.querySelector('#demo-student-list'); if (!target) return;
  const list = students();
  target.innerHTML = list.length ? list.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.email)}</td><td><span class="status-pill">Student</span></td></tr>`).join('') : '<tr><td colspan="3">No students added yet.</td></tr>';
}

// Student requests appear immediately in the Warden request list in this same browser.
const requestForm = document.querySelector('[data-student-request-form]');
if (requestForm) requestForm.addEventListener('submit', event => {
  event.preventDefault(); const session = getSession();
  if (!session || session.role !== 'student') { location.replace('login.html'); return; }
  const type = document.querySelector('#request-type').value;
  const subject = document.querySelector('#request-subject').value.trim();
  const details = document.querySelector('#request-details').value.trim();
  if (!type || !subject || !details) { setMessage(document.querySelector('#student-request-message'), 'Please complete every field.', false); return; }
  const list = read(REQUESTS_KEY); list.unshift({ id: Date.now(), studentEmail: session.email, studentName: session.name || session.email, type, subject, details, status: 'Pending', createdAt: new Date().toLocaleString() }); write(REQUESTS_KEY, list);
  requestForm.reset(); setMessage(document.querySelector('#student-request-message'), 'Request submitted. Your warden can now review it.'); renderWardenRequests();
});
function renderWardenRequests() {
  const target = document.querySelector('#warden-requests-list'); if (!target) return;
  const list = read(REQUESTS_KEY);
  if (!list.length) { target.innerHTML = '<div class="empty-state small-empty"><span class="empty-icon">▤</span><p>No requests to review yet.</p></div>'; return; }
  target.innerHTML = list.map(r => `<article class="request-card" style="border:1px solid var(--border,#e5e7eb);border-radius:12px;padding:14px;margin:10px 0"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>${escapeHtml(r.subject)}</strong><span class="status-pill">${escapeHtml(r.status)}</span></div><p class="muted">${escapeHtml(r.studentName)} · ${escapeHtml(r.studentEmail)} · ${escapeHtml(r.type)} · ${escapeHtml(r.createdAt)}</p><p>${escapeHtml(r.details)}</p><label for="request-status-${r.id}">Update status</label><select id="request-status-${r.id}"><option ${r.status==='Pending'?'selected':''}>Pending</option><option ${r.status==='Approved'?'selected':''}>Approved</option><option ${r.status==='Rejected'?'selected':''}>Rejected</option><option ${r.status==='Resolved'?'selected':''}>Resolved</option></select><button type="button" class="button secondary" data-save-request="${r.id}">Save status</button></article>`).join('');
  target.querySelectorAll('[data-save-request]').forEach(btn => btn.addEventListener('click', () => { const id = Number(btn.dataset.saveRequest), status = document.querySelector(`#request-status-${id}`).value; const updated = read(REQUESTS_KEY).map(r => r.id === id ? {...r, status} : r); write(REQUESTS_KEY, updated); renderWardenRequests(); }));
}

// Warden attendance register: choose date and mark each student present/absent/on leave.
function renderAttendanceRegister() {
  const target = document.querySelector('#warden-attendance-register'); if (!target) return;
  const list = students(); const dateEl = document.querySelector('#attendance-date');
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0,10);
  if (!list.length) { target.innerHTML = '<p class="muted">Create student accounts first to mark attendance.</p>'; return; }
  const date = dateEl?.value || new Date().toISOString().slice(0,10), records = read(ATTENDANCE_KEY);
  target.innerHTML = `<div class="table-scroll"><table><thead><tr><th>Student</th><th>Attendance</th></tr></thead><tbody>${list.map(s => { const rec = records.find(a => a.email === s.email && a.date === date); return `<tr><td>${escapeHtml(s.name)}<br><small>${escapeHtml(s.email)}</small></td><td><select aria-label="Attendance for ${escapeHtml(s.name)}" data-attendance-email="${escapeHtml(s.email)}"><option value="present" ${rec?.status==='present'?'selected':''}>Present</option><option value="absent" ${rec?.status==='absent'?'selected':''}>Absent</option><option value="leave" ${rec?.status==='leave'?'selected':''}>On leave</option></select></td></tr>`; }).join('')}</tbody></table></div><button type="button" class="button primary" id="save-attendance">Save attendance</button>`;
  target.querySelector('#save-attendance').addEventListener('click', () => {
    const date = dateEl?.value || new Date().toISOString().slice(0,10); let all = read(ATTENDANCE_KEY);
    target.querySelectorAll('[data-attendance-email]').forEach(sel => { const email = sel.dataset.attendanceEmail; all = all.filter(a => !(a.email === email && a.date === date)); all.push({ email, date, status: sel.value, markedBy: getSession()?.email || '' }); });
    write(ATTENDANCE_KEY, all); setMessage(document.querySelector('#attendance-message'), `Attendance saved for ${date}.`); renderStudentAttendance();
  });
}
document.querySelector('#attendance-date')?.addEventListener('change', renderAttendanceRegister);
function renderStudentAttendance() {
  const target = document.querySelector('#student-attendance-list'); if (!target) return;
  const session = getSession(), list = read(ATTENDANCE_KEY).filter(a => a.email === session?.email).sort((a,b) => b.date.localeCompare(a.date));
  target.innerHTML = list.length ? `<div class="table-scroll"><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>${list.map(a => `<tr><td>${escapeHtml(a.date)}</td><td>${escapeHtml(a.status[0].toUpperCase()+a.status.slice(1))}</td></tr>`).join('')}</tbody></table></div>` : '<span class="empty-icon">▦</span><h3>No attendance records yet</h3><p>Your attendance will appear here when recorded by the warden.</p>';
}

// Announcements published by the Warden are shown in the student portal.
const announcementForm = document.querySelector('[data-announcement-form]');
if (announcementForm) announcementForm.addEventListener('submit', event => {
  event.preventDefault(); const session = getSession();
  if (!session || session.role !== 'warden') { location.replace('login.html'); return; }
  const title = document.querySelector('#announcement-title').value.trim(), message = document.querySelector('#announcement-message').value.trim();
  if (!title || !message) { setMessage(document.querySelector('#announcement-form-message'), 'Enter a title and message.', false); return; }
  const list = read(ANNOUNCEMENTS_KEY); list.unshift({ id: Date.now(), title, message, author: session.name || session.email, publishedAt: new Date().toLocaleString() }); write(ANNOUNCEMENTS_KEY, list);
  announcementForm.reset(); setMessage(document.querySelector('#announcement-form-message'), 'Announcement published. Students can now see it.'); renderAnnouncements();
});
function renderAnnouncements() {
  const targets = [document.querySelector('#student-announcements-list'), document.querySelector('#warden-announcements-list')].filter(Boolean);
  const list = read(ANNOUNCEMENTS_KEY);
  targets.forEach(target => { target.innerHTML = list.length ? list.map(a => `<article style="border-bottom:1px solid var(--border,#e5e7eb);padding:12px 0"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.message)}</p><small class="muted">${escapeHtml(a.publishedAt)} · ${escapeHtml(a.author)}</small></article>`).join('') : '<div class="empty-state small-empty"><span class="empty-icon">▤</span><h3>No announcements yet</h3><p>New hostel notices will appear here.</p></div>'; });
}
if (document.querySelector('#demo-student-list')) renderDemoStudents();
if (document.querySelector('#warden-attendance-register')) renderAttendanceRegister();
if (document.querySelector('#warden-requests-list')) renderWardenRequests();
renderStudentAttendance(); renderAnnouncements();
