// --- 1. ADMIN AUTHENTICATION ---
function verifyAdmin() {
    const passInput = document.getElementById('adminPass');
    const authBox = document.getElementById('authLock');
    const adminBox = document.getElementById('adminPanel');

    // Secure verification logic
    if (passInput.value === "admin123") {
        sessionStorage.setItem('adminAuth', 'true');
        authBox.classList.add('hidden');
        adminBox.classList.remove('hidden');
        loadAdminNotices();
    } else {
        alert("Access Denied: Incorrect Password");
        passInput.value = "";
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// --- 2. ADMIN UPLOAD LOGIC ---
let uploadedFile = null;
const fileInput = document.getElementById('fileInput');

if (fileInput) {
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('fileNameDisplay').innerText = "Selected: " + file.name;
            const reader = new FileReader();
            reader.onload = (ev) => { 
                uploadedFile = { data: ev.target.result, type: file.type }; 
            };
            reader.readAsDataURL(file);
        }
    };
}

function publishNotice() {
    const title = document.getElementById('noticeTitle').value;
    const dept = document.getElementById('targetDept').value;
    
    if (!title || !uploadedFile) return alert("Please provide a title and a file!");

    const notices = JSON.parse(localStorage.getItem('tsdc_notices') || '[]');
    
    notices.unshift({ 
        id: Date.now(), 
        title: title, 
        dept: dept, 
        data: uploadedFile.data, 
        type: uploadedFile.type, 
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
    });
    
    localStorage.setItem('tsdc_notices', JSON.stringify(notices));
    alert("Notice Broadcasted Successfully!");
    
    // Reset form
    document.getElementById('noticeTitle').value = '';
    document.getElementById('fileNameDisplay').innerText = "Tap to upload PDF or Image";
    uploadedFile = null;
    
    loadAdminNotices();
}

function loadAdminNotices() {
    const container = document.getElementById('adminNoticeList');
    if (!container) return;

    const notices = JSON.parse(localStorage.getItem('tsdc_notices') || '[]');
    
    if (notices.length === 0) {
        container.innerHTML = '<p class="text-center text-muted small py-3">No active notices.</p>';
        return;
    }

    container.innerHTML = notices.map(n => `
        <div class="admin-notice-row">
            <div>
                <div class="fw-bold small text-dark">${n.title}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${n.dept} • ${n.date}</div>
            </div>
            <button onclick="deleteNotice(${n.id})" class="delete-btn">Delete</button>
        </div>
    `).join('');
}

function deleteNotice(id) {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    
    let notices = JSON.parse(localStorage.getItem('tsdc_notices') || '[]');
    notices = notices.filter(n => n.id !== id);
    localStorage.setItem('tsdc_notices', JSON.stringify(notices));
    loadAdminNotices();
}

// --- 3. STUDENT LOGIN & SESSION ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const dept = document.getElementById('studentDept').value;
        const name = document.getElementById('studentName').value;

        if (dept && name) {
            sessionStorage.setItem('userDept', dept);
            sessionStorage.setItem('userName', name);
            window.location.href = 'board.html';
        }
    };
}

// --- 4. BOARD RENDERING ---
function renderBoard() {
    const userDept = sessionStorage.getItem('userDept');
    const container = document.getElementById('noticesList');
    
    if (!container) return;

    const allNotices = JSON.parse(localStorage.getItem('tsdc_notices') || '[]');
    const filtered = allNotices.filter(n => n.dept === userDept || n.dept === 'ALL');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="chalk-card text-center py-5">
                <div class="fs-1 mb-3">🗞️</div>
                <p class="text-muted m-0">No active notices for ${userDept} at the moment.</p>
                <small class="text-muted">Check back later for updates.</small>
            </div>`;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(n => {
        const isPDF = n.type === 'application/pdf';
        const card = document.createElement('div');
        card.className = 'notice-item';
        
        card.innerHTML = `
            <div class="notice-preview">
                ${isPDF ? 
                    `<iframe src="${n.data}#toolbar=0&navpanes=0"></iframe>` : 
                    `<img src="${n.data}" alt="Notice">`}
            </div>
            <div class="p-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge ${n.dept === 'ALL' ? 'bg-warning text-dark' : 'bg-success'} rounded-pill">${n.dept}</span>
                    <small class="text-muted fw-bold">${n.date}</small>
                </div>
                <h5 class="fw-bold text-dark mb-3">${n.title}</h5>
                <a href="${n.data}" download="${n.title}" class="btn-emerald" style="display: block; text-align: center; text-decoration: none; padding: 12px; font-size: 0.9rem;">Download Document</a>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterNotices() {
    const query = document.getElementById('noticeSearch').value.toLowerCase();
    const items = document.getElementsByClassName('notice-item');

    Array.from(items).forEach(item => {
        const title = item.querySelector('h5').innerText.toLowerCase();
        item.style.display = title.includes(query) ? 'block' : 'none';
    });
}

// Auto-load admin notices if authenticated logic
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminNoticeList') && sessionStorage.getItem('adminAuth') === 'true') {
        const authBox = document.getElementById('authLock');
        const adminBox = document.getElementById('adminPanel');
        if (authBox && adminBox) {
            authBox.classList.add('hidden');
            adminBox.classList.remove('hidden');
            loadAdminNotices();
        }
    }
});