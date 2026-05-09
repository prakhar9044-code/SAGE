// =========================================
// 1. SUPABASE INITIALIZATION (STRICT MODE)
// =========================================
// ⚠️ IMPORTANT: YOU MUST REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND KEY
const SUPABASE_URL = 'https://drojnekslofiziefxzfj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb2puZWtzbG9maXppZWZ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzAwMjksImV4cCI6MjA5Mzc0NjAyOX0.lsQthJKzC76q7uWMUm8aJm6gu9NVsaiReFWO-VH5WFk'; 

let dbClient = null; 
let currentUser = null;

try {
    if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
        console.error("🚨 SUPABASE NOT CONFIGURED: Please add your real URL and Key.");
    } else {
        dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Supabase init failed:", e);
}

// =========================================
// 2. CORE UTILITIES & GLOBAL STATE
// =========================================
lucide.createIcons();

const lenis = new Lenis({ smooth: true, duration: 1.2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

let isDark = localStorage.getItem('sage_theme') === 'dark';
if (isDark) document.documentElement.setAttribute('data-theme', 'dark');

let auth3DInitialized = false;
const toastContainer = document.getElementById('toast-container');
// =========================================
// ENHANCED NOTIFICATION ENGINE
// =========================================
const notifBadge = document.getElementById('notif-badge');
const notifPanel = document.getElementById('notification-panel');
const notifListContainer = document.getElementById('notif-list-container');
const btnToggleNotifs = document.getElementById('btn-toggle-notifs');
const btnMarkAllRead = document.getElementById('mark-all-read');

let notificationsHistory = [];
let unreadCount = 0;

// Upgraded showToast to handle Popups AND History
window.showToast = function(message, type = 'success', saveToHistory = true) {
    // 1. Create the Animated Popup (Toast)
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconStr = type === 'success' ? 'check' : (type === 'error' ? 'alert-circle' : 'info');
    const titleStr = type === 'success' ? 'Success' : (type === 'error' ? 'Error' : 'Notification');
    
    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${iconStr}" style="width: 16px; height: 16px;"></i></div>
        <div style="flex: 1;">
            <span style="display:block; font-weight: 700; font-size: 13px; margin-bottom: 2px;">${titleStr}</span>
            <span style="font-size: 12px; font-weight: 500; color: var(--text-gray);">${message}</span>
        </div>
    `;
    document.getElementById('toast-container').appendChild(toast);
    lucide.createIcons();

    // GSAP Spring Entrance Animation
    gsap.to(toast, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" });

    // Remove smoothly after 4 seconds
    setTimeout(() => { 
        gsap.to(toast, { 
            x: 100, opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.in", 
            onComplete: () => toast.remove() 
        });
    }, 4000);

    // 2. Save to Notification Center Panel
    if (saveToHistory) {
        const newNotif = {
            id: Date.now(),
            message: message,
            type: type,
            icon: iconStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };
        notificationsHistory.unshift(newNotif); // Add to top of list
        unreadCount++;
        updateNotificationUI();
    }
};

// Update the Notification Panel & Badge UI
function updateNotificationUI() {
    // Animate the Bell Icon if unread
    if (unreadCount > 0) {
        notifBadge.style.display = 'block';
        gsap.fromTo(btnToggleNotifs.querySelector('i'), { rotation: -20 }, { rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    } else {
        notifBadge.style.display = 'none';
    }

    // Update List HTML
    if (notificationsHistory.length === 0) {
        notifListContainer.innerHTML = `
            <div class="empty-notifs">
                <i data-lucide="bell-off"></i>
                <p>No new notifications</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    notifListContainer.innerHTML = '';
    notificationsHistory.forEach(n => {
        const colorMap = { 'success': '#10B981', 'error': '#EF4444', 'info': '#3B82F6' };
        const titleMap = { 'success': 'Action Successful', 'error': 'Action Required', 'info': 'System Update' };
        
        const item = document.createElement('div');
        item.className = `notif-item ${n.read ? '' : 'unread'}`;
        
        // Clicking a notification marks it as read
        item.onclick = () => { 
            if (!n.read) {
                n.read = true; 
                unreadCount = Math.max(0, unreadCount - 1); 
                updateNotificationUI(); 
            }
        };
        
        item.innerHTML = `
            <div class="notif-item-icon" style="background: ${colorMap[n.type]};">
                <i data-lucide="${n.icon}" style="width: 16px;"></i>
            </div>
            <div class="notif-content" style="flex: 1;">
                <h4>${titleMap[n.type]}</h4>
                <p>${n.message}</p>
                <span class="notif-time">${n.time}</span>
            </div>
        `;
        notifListContainer.appendChild(item);
    });
    lucide.createIcons();
}

// Toggle Dropdown Panel with GSAP
btnToggleNotifs?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = notifPanel.style.display === 'block';
    if (isVisible) {
        gsap.to(notifPanel, { y: 10, opacity: 0, duration: 0.2, onComplete: () => notifPanel.style.display = 'none' });
    } else {
        notifPanel.style.display = 'block';
        gsap.fromTo(notifPanel, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
    }
});

// Mark all as read
btnMarkAllRead?.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsHistory.forEach(n => n.read = true);
    unreadCount = 0;
    updateNotificationUI();
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
    if (notifPanel && notifPanel.style.display === 'block' && !e.target.closest('.header-actions')) {
        gsap.to(notifPanel, { y: 10, opacity: 0, duration: 0.2, onComplete: () => notifPanel.style.display = 'none' });
    }
});


// =========================================
// 3. PRELOADER & 3D SCENES
// =========================================
const initMainPreloader = () => {
    const canvas = document.getElementById('preloader-canvas');
    if (!canvas) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 6;
    const material = new THREE.MeshBasicMaterial({ color: isDark ? 0x6366F1 : 0x3B82F6, wireframe: true, transparent: true, opacity: 0.15 });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), material);
    scene.add(mesh);
    const animate = () => { requestAnimationFrame(animate); mesh.rotation.y += 0.003; mesh.rotation.x += 0.001; renderer.render(scene, camera); };
    animate();
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
    return { mesh, material };
};
const mainCore = initMainPreloader();

window.addEventListener('load', () => {
    const tl = gsap.timeline();
    tl.to('.loader-bar-fill', { width: '100%', duration: 1, ease: "power2.inOut" })
      .to(mainCore?.mesh.scale || {}, { x: 0, y: 0, z: 0, duration: 0.5 }, "-=0.2")
      .to('#preloader', { opacity: 0, duration: 0.4, onComplete: () => { document.getElementById('preloader').style.display = 'none'; }})
      .to('#main-content', { opacity: 1, duration: 0.4 }, "-=0.2")
      .to('.navbar', { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
      .from('.gs-reveal', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.2");
});

const initAuth3D = () => {
    const canvas = document.getElementById('auth-canvas');
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, (window.innerWidth / 2) / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    camera.position.z = 8;
    const blueGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x3B82F6, metalness: 0.1, roughness: 0.2, transmission: 0.9, thickness: 0.5 });
    const robotBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1), blueGlassMat); 
    const robotHead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), blueGlassMat); 
    robotHead.position.set(0, 1.6, 0);
    const robotGroup = new THREE.Group(); robotGroup.add(robotBody, robotHead); robotGroup.position.set(3, 2, -1); scene.add(robotGroup);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0x3B82F6, 2); light.position.set(5, 5, 5); scene.add(light);
    let time = 0;
    const animate = () => { requestAnimationFrame(animate); time += 0.01; robotGroup.rotation.x += 0.002; robotGroup.position.y = 2 + Math.sin(time) * 0.2; renderer.render(scene, camera); };
    animate();
};
// =========================================
// 4. AUTHENTICATION & SESSION MANAGEMENT
// =========================================
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const mainContent = document.getElementById('main-content');
const navbar = document.getElementById('navbar');

// Check Active Session on Load
if (dbClient) {
    dbClient.auth.getSession().then(({ data: { session } }) => {
        if (session) { currentUser = session.user; transitionToDashboard(true); }
    });
}

// Auth Tabs Logic
const tabs = document.querySelectorAll('.a-tab');
const headerText = document.getElementById('auth-header-text');
const fieldName = document.getElementById('field-name');
const submitText = document.getElementById('submit-text');

function switchAuthTab(mode) {
    tabs.forEach(t => t.classList.remove('active'));
    if(mode === 'login') {
        tabs[0].classList.add('active');
        headerText.innerHTML = `<h2>Welcome back 👋</h2><p>Log in to continue your learning journey</p>`;
        fieldName.style.display = 'none'; submitText.innerText = 'Log In';
    } else {
        tabs[1].classList.add('active');
        headerText.innerHTML = `<h2>Create an account ✨</h2><p>Join students learning smarter</p>`;
        fieldName.style.display = 'block'; submitText.innerText = 'Sign Up';
    }
}

if(tabs.length > 1) {
    tabs[0].addEventListener('click', () => switchAuthTab('login'));
    tabs[1].addEventListener('click', () => switchAuthTab('signup'));
}

// Email & Password Form Submit (WITH EMAILJS INTEGRATION)
document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dbClient) return showToast("Database not connected. Add Supabase keys.", "error");
    
    const isSignup = tabs[1].classList.contains('active');
    const email = document.getElementById('primary-input').value;
    const password = document.getElementById('password-input').value;
    const name = document.getElementById('name-input').value || 'Student';
    
    const submitIcon = document.getElementById('submit-icon');
    submitText.innerText = 'Authenticating...';
    submitIcon.setAttribute('data-lucide', 'loader');
    submitIcon.classList.add('animate-spin');
    lucide.createIcons();

    try {
        if (isSignup) {
            const { data, error } = await dbClient.auth.signUp({ email, password });
            if (error) throw error;
            if (data.user) { await dbClient.from('profiles').insert([{ id: data.user.id, full_name: name }]); }
            showToast(`Account created successfully!`, 'success');
            currentUser = data.user;

            // TRIGGER EMAILJS WELCOME EMAIL
            try {
                await emailjs.send("service_fm64zvj", "template_6z5h169", {
                    to_email: email,      
                    to_name: name,        
                    subject: "Welcome to SAGE Pro Learning! 🚀",
                });
                console.log("Welcome email sent successfully!");
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
            }

        } else {
            const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showToast(`Welcome back!`, 'success');
            currentUser = data.user;
        }
        transitionToDashboard();
    } catch (error) {
        showToast(error.message, 'error');
        submitText.innerText = isSignup ? 'Sign Up' : 'Log In';
        submitIcon.setAttribute('data-lucide', 'arrow-right');
        submitIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});

// SOCIAL OAUTH LOGIN (Google & GitHub)
document.querySelectorAll('.action-oauth').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const provider = e.currentTarget.getAttribute('data-provider').toLowerCase();
        
        if (!dbClient) return showToast("Database not connected.", "error");
        
        const originalContent = e.currentTarget.innerHTML;
        e.currentTarget.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 18px; margin-right: 8px;"></i> Connecting...`;
        lucide.createIcons();
        
        try {
            const { data, error } = await dbClient.auth.signInWithOAuth({ 
                provider: provider,
                options: {
                    redirectTo: window.location.origin + window.location.pathname 
                }
            });

            if (error) throw error;
            
        } catch (error) {
            console.error(`${provider} OAuth Error:`, error);
            showToast(`Failed to connect to ${provider}. Check console.`, "error");
            e.currentTarget.innerHTML = originalContent; 
        }
    });
});

// Auth Overlay Triggers
const openAuth = (isSignup = false) => {
    lenis.stop(); 
    if(isSignup) switchAuthTab('signup'); else switchAuthTab('login');
    gsap.to([mainContent, navbar], { opacity: 0, scale: 0.98, duration: 0.4, onComplete: () => {
        mainContent.style.display = 'none'; navbar.style.display = 'none'; authView.style.display = 'block';
        if(!auth3DInitialized && window.innerWidth > 1024) { initAuth3D(); auth3DInitialized = true; }
        gsap.to('#glass-mockup', { y: -15, rotationX: 2, rotationY: -2, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(authView, { opacity: 1, duration: 0.4 });
        gsap.fromTo('.gs-auth-anim', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.6, delay: 0.1 });
    }});
};

// Close Auth To Landing (WITH NAVBAR BLOCK FIX)
const closeAuthToLanding = () => {
    gsap.to(authView, { opacity: 0, duration: 0.4, onComplete: () => {
        authView.style.display = 'none'; 
        mainContent.style.display = 'block'; 
        navbar.style.display = 'block'; // FIXED LINE
        gsap.to([mainContent, navbar], { opacity: 1, scale: 1, duration: 0.4 }); lenis.start(); 
    }});
};

// Landing Page Button Bindings
document.getElementById('btn-open-auth')?.addEventListener('click', (e) => { e.preventDefault(); openAuth(false); });
document.getElementById('btn-nav-signup')?.addEventListener('click', (e) => { e.preventDefault(); openAuth(true); });
document.getElementById('btn-hero-start')?.addEventListener('click', (e) => { e.preventDefault(); openAuth(true); });
document.getElementById('btn-close-auth')?.addEventListener('click', closeAuthToLanding);

// Password Toggle
const pwInput = document.getElementById('password-input');
const pwToggle = document.getElementById('toggle-pw');
if(pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
        pwToggle.setAttribute('data-lucide', pwInput.type === 'password' ? 'eye-off' : 'eye');
        lucide.createIcons();
    });
}

// Global Logout Button (WITH NAVBAR BLOCK FIX)
document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if(dbClient) await dbClient.auth.signOut();
    currentUser = null;
    gsap.to(dashboardView, { opacity: 0, duration: 0.4, onComplete: () => {
        dashboardView.style.display = 'none'; 
        mainContent.style.display = 'block'; 
        navbar.style.display = 'block'; // FIXED LINE
        window.scrollTo(0,0);
        gsap.to([mainContent, navbar], { opacity: 1, scale: 1, duration: 0.4 }); lenis.start(); 
        document.getElementById('submit-text').innerText = 'Log In';
        document.getElementById('submit-icon').setAttribute('data-lucide', 'arrow-right');
        document.getElementById('submit-icon').classList.remove('animate-spin');
        lucide.createIcons();
    }});
});
// =========================================
// 5. DASHBOARD ROUTING & UI INTERACTIONS
// =========================================

// --- THE NEW SIDEBAR ROUTER ---
const navLinks = document.querySelectorAll('.dash-nav .nav-link');
const dashViews = document.querySelectorAll('.dash-view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetView = link.getAttribute('data-view');
        if (!targetView) return;

        // Update active class on sidebar
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');

        // Show/Hide specific views
        let viewFound = false;
        dashViews.forEach(view => {
            view.classList.remove('active'); 
            
            if (view.id === `view-${targetView}`) {
                view.classList.add('active'); 
                viewFound = true;
                
                // Trigger line chart animation if we go back to the home overview
                if (targetView === 'overview' && typeof triggerDashboardAnimations === 'function') {
                    triggerDashboardAnimations();
                }
            }
        });

        // Show toast if the view HTML hasn't been built yet
        if (!viewFound) {
            showToast(`${targetView.charAt(0).toUpperCase() + targetView.slice(1)} view is under construction!`, "info");
        }
    });
});

// Dashboard Animations Function
const triggerDashboardAnimations = () => {
    const path = document.querySelector('.line-svg path');
    if(path) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        gsap.to(path, { strokeDashoffset: 0, duration: 2, ease: "power3.inOut", delay: 0.5 });
    }
    gsap.fromTo('.line-svg circle', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, delay: 1.5, ease: "back.out(2)" });
    gsap.from('.progress-bar-fill', { width: 0, duration: 1.5, stagger: 0.1, ease: "power2.out", delay: 0.6 });
};


document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if(dbClient) await dbClient.auth.signOut();
    currentUser = null;
    gsap.to(dashboardView, { opacity: 0, duration: 0.4, onComplete: () => {
        dashboardView.style.display = 'none'; mainContent.style.display = 'block'; navbar.style.display = 'block';
        window.scrollTo(0,0);
        gsap.to([mainContent, navbar], { opacity: 1, scale: 1, duration: 0.4 }); lenis.start(); 
        document.getElementById('submit-text').innerText = 'Log In';
        document.getElementById('submit-icon').setAttribute('data-lucide', 'arrow-right');
        document.getElementById('submit-icon').classList.remove('animate-spin');
        lucide.createIcons();
    }});
});

const transitionToDashboard = (skipAnim = false) => {
    lenis.destroy(); 
    const enterDash = () => {
        authView.style.display = 'none'; mainContent.style.display = 'none'; navbar.style.display = 'none';
        dashboardView.style.display = 'block';
        gsap.to(dashboardView, { opacity: 1, duration: 0.3 });
        
        const dashTl = gsap.timeline();
        dashTl.fromTo('.dash-new-sidebar', { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" })
              .fromTo('.dash-new-header', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3")
              .fromTo('.welcome-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.2")
              .fromTo('.s-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }, "-=0.2")
              .fromTo('.content-right', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.4");
              
        triggerDashboardAnimations();
        fetchDashboardData(); 
        renderCalendar();
    };
    if(skipAnim) enterDash(); else gsap.to(authView, { opacity: 0, y: -20, duration: 0.5, ease: "power2.in", onComplete: enterDash });
};

// =========================================
// 6. STRICT DATABASE DATA FETCHING
// =========================================
async function fetchDashboardData() {
    if(!currentUser || !dbClient) return;

    try {
        const { data: profile } = await dbClient.from('profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
            const firstName = profile.full_name.split(' ')[0];
            document.getElementById('dash-welcome-text').innerText = `Good morning, ${firstName}! 👋`;
            document.getElementById('nav-user-name').innerText = profile.full_name;
            document.getElementById('nav-user-email').innerText = currentUser.email;
            
            const initials = firstName.charAt(0).toUpperCase();
            document.getElementById('nav-profile-pic').innerText = initials;
            document.getElementById('header-profile-pic').innerText = initials;

            document.getElementById('stat-streak').innerText = profile.study_streak || 0;
            document.getElementById('widget-streak').innerText = profile.study_streak || 0;
            document.getElementById('stat-xp').innerText = profile.xp_earned || 0;
            document.getElementById('stat-quizzes').innerText = profile.quizzes_solved || 0;
            document.getElementById('stat-hours').innerText = profile.study_time || 0.0;
        }
        loadTasks();
        loadNotes();
        loadDonutChart();
        updateStudyStreakUI();
    } catch (e) { console.error("Error fetching data:", e); showToast("Error loading profile data", "error"); }
}

async function loadTasks() {
    if(!dbClient) return;
    const taskList = document.getElementById('db-task-list');
    taskList.innerHTML = '<p class="text-gray" style="font-size: 13px;">Loading...</p>';
    
    const { data: tasks, error } = await dbClient.from('tasks').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    
    if (error || !tasks || tasks.length === 0) {
        taskList.innerHTML = `<p class="text-gray" style="font-size: 13px;">You have no pending tasks. Enjoy your day!</p>`;
        return;
    }

    taskList.innerHTML = '';
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.innerHTML = `
            <input type="checkbox" class="task-cb" ${task.is_completed ? 'checked' : ''} data-id="${task.id}">
            <div class="task-info">
                <h4 style="${task.is_completed ? 'text-decoration: line-through; color: var(--text-gray);' : ''}">${task.title}</h4>
                <p>${task.category || 'General Study'}</p>
            </div>
            <i data-lucide="trash-2" class="text-gray interactive-icon delete-task" data-id="${task.id}" style="width: 14px; cursor: pointer;"></i>
        `;
        taskList.appendChild(item);
    });
    lucide.createIcons();
    
    document.querySelectorAll('.task-cb').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const taskId = e.target.getAttribute('data-id');
            const isChecked = e.target.checked;
            const h4 = e.target.nextElementSibling.querySelector('h4');
            if(isChecked) {
                h4.style.textDecoration = 'line-through'; h4.style.color = 'var(--text-gray)'; 
                showToast('Task completed! XP Added.', 'success');
            } else {
                h4.style.textDecoration = 'none'; h4.style.color = 'var(--text-dark)';
            }
            await dbClient.from('tasks').update({ is_completed: isChecked }).eq('id', taskId);
        });
    });

    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            e.currentTarget.closest('.task-item').remove();
            await dbClient.from('tasks').delete().eq('id', taskId);
            showToast("Task deleted", "info");
        });
    });
}
// =========================================
// DYNAMIC STUDY STREAK UI
// =========================================
async function updateStudyStreakUI() {
    const timelineContainer = document.querySelector('.streak-timeline');
    const streakNumberEl = document.getElementById('widget-streak');
    const msgEl = document.querySelector('.streak-widget p.text-gray:last-child');
    
    if (!timelineContainer) return;

    let streakCount = 0;

    try {
        // Only fetch real data if the user is actually logged in
        if (dbClient && currentUser) {
            const { data: profile, error } = await dbClient.from('profiles')
                .select('study_streak')
                .eq('id', currentUser.id)
                .single();

            if (!error && profile) {
                streakCount = profile.study_streak || 0;
            }
        }
    } catch (e) {
        console.error("Error updating streak UI:", e);
    }

    // 1. Update the big number
    if (streakNumberEl) streakNumberEl.innerText = streakCount;

    // 2. Clear the old HTML and generate the rolling 7-day timeline
    timelineContainer.innerHTML = ''; 

    const today = new Date();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayLetter = dayNames[d.getDay()];
        
        // If streak is 0, isActive is always false.
        const isActive = i < streakCount; 
        const icon = isActive ? 'check' : 'minus';
        const activeClass = isActive ? 'active' : '';

        timelineContainer.innerHTML += `
            <div class="s-day ${activeClass}">
                <i data-lucide="${icon}"></i>
                <span>${dayLetter}</span>
            </div>
        `;
    }
    
    if(window.lucide) lucide.createIcons();

    // 3. Update the motivational message
    if (msgEl) {
        if (streakCount === 0) {
            msgEl.innerText = "Complete a task today to start your streak!";
        } else if (streakCount < 3) {
            msgEl.innerText = "Good start! Keep the momentum going.";
        } else if (streakCount < 7) {
            msgEl.innerText = "You're on fire! Keep maintaining your streak.";
        } else {
            msgEl.innerText = "Incredible dedication! You are a learning machine.";
        }
    }
}
async function loadNotes() {
    if(!dbClient) return;
    const notesList = document.getElementById('db-notes-list');
    notesList.innerHTML = '<p class="text-gray" style="font-size: 13px;">Loading notes...</p>';
    
    const { data: notes } = await dbClient.from('notes').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(4);
    
    if (!notes || notes.length === 0) {
        notesList.innerHTML = `<p class="text-gray" style="font-size: 13px; padding: 12px;">No notes uploaded yet. Click above to add one.</p>`;
        return;
    }

    notesList.innerHTML = '';
    const styles = [{ c: 'red-icon', ic: 'file-text' }, { c: 'yellow-icon', ic: 'file-text' }, { c: 'green-icon', ic: 'file-text' }, { c: 'icon-blue', ic: 'file-text' }];

    notes.forEach((note, index) => {
        const style = styles[index % styles.length];
        const item = document.createElement('div');
        item.className = 'list-item interactive-card note-file';
        item.style.display = 'flex'; item.style.alignItems = 'center'; item.style.gap = '12px'; item.style.marginBottom = '12px'; item.style.cursor = 'pointer';
        
        const date = new Date(note.created_at).toLocaleDateString();
        item.innerHTML = `<div class="note-icon ${style.c}"><i data-lucide="${style.ic}"></i></div><div class="note-info"><h4 style="font-size: 13px; color: var(--text-dark);">${note.title}</h4><p style="font-size: 11px; color: var(--text-gray);">${date}</p></div>`;
        notesList.appendChild(item);
    });
    lucide.createIcons();
}

async function loadDonutChart() {
    if(!dbClient) return;
    const { data: sessions } = await dbClient.from('study_sessions').select('duration_hours, category').eq('user_id', currentUser.id);
    
    let coding = 0, theory = 0, practice = 0, total = 0;
    
    if (sessions && sessions.length > 0) {
        sessions.forEach(s => {
            total += s.duration_hours;
            if (s.category === 'Coding') coding += s.duration_hours;
            else if (s.category === 'Theory') theory += s.duration_hours;
            else practice += s.duration_hours;
        });
    }

    document.getElementById('donut-hours').innerText = total > 0 ? total.toFixed(1) : "0";
    
    if (total > 0) {
        const codePct = Math.round((coding/total)*100);
        const theoryPct = Math.round((theory/total)*100);
        const codeEnd = codePct;
        const theoryEnd = codeEnd + theoryPct;
        
        document.querySelector('.donut-chart-css').style.background = 
            `conic-gradient(#3B82F6 0% ${codeEnd}%, #8B5CF6 ${codeEnd}% ${theoryEnd}%, #F59E0B ${theoryEnd}% 100%)`;
            
        const legends = document.querySelectorAll('.legend-item span:last-child');
        if(legends.length >= 3) {
            legends[0].innerText = `${codePct}%`;
            legends[1].innerText = `${theoryPct}%`;
            legends[2].innerText = `${100 - codePct - theoryPct}%`;
        }
    }
}

// --- DYNAMIC CALENDAR LOGIC ---
function renderCalendar() {
    const grid = document.querySelector('.calendar-grid');
    if(!grid) return;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();
    
    document.querySelector('.cal-nav').innerHTML = `${now.toLocaleString('default', { month: 'long' })} ${currentYear} <i data-lucide="arrow-left" class="interactive-icon" style="cursor:pointer"></i> <i data-lucide="arrow-right" class="interactive-icon" style="cursor:pointer"></i>`;
    
    let html = `<div class="cal-day-name text-gray">Sun</div><div class="cal-day-name text-gray">Mon</div><div class="cal-day-name text-gray">Tue</div><div class="cal-day-name text-gray">Wed</div><div class="cal-day-name text-gray">Thu</div><div class="cal-day-name text-gray">Fri</div><div class="cal-day-name text-gray">Sat</div>`;
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // Get total days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty slots for days before the 1st of the month
    for(let i = 0; i < firstDay; i++) {
        html += `<div class="cal-date muted"></div>`;
    }
    
    // Generate actual dates
    for(let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today;
        const hasStudied = i < today && Math.random() > 0.4; // Simulating past streak
        
        let indicator = '';
        if(hasStudied || isToday) {
            indicator = '<div class="dot-indicator"></div>';
        }
        
        // Add onClick event to schedule studies
        html += `<div class="cal-date ${isToday ? 'active' : ''}" onclick="scheduleStudy(${i})" style="cursor:pointer;" title="Click to schedule">${i}${indicator}</div>`;
    }
    grid.innerHTML = html;
    lucide.createIcons();
}

// Global function to handle calendar clicks
window.scheduleStudy = function(day) {
    const month = new Date().toLocaleString('default', { month: 'short' });
    showToast(`Drafting study plan for ${month} ${day}...`, 'info');
};

// =========================================
// 7. WIRING UP ALL DASHBOARD BUTTONS
// =========================================

// Global Add Task Button (Using Custom Animated Modal)
document.getElementById('btn-add-task')?.addEventListener('click', () => {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('btn-confirm-modal');

    // 1. Setup the custom UI inside the modal
    modalTitle.innerText = "Add New Task";
    modalBody.innerHTML = `
        <div class="input-group">
            <p style="font-size: 13px; color: var(--text-gray); margin-bottom: 16px;">What do you need to get done today?</p>
            <input type="text" id="custom-task-input" placeholder="e.g., Read Biology Chapter 4..." 
                   style="width: 100%; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-gray); color: var(--text-dark); outline: none; font-size: 14px; transition: border-color 0.2s;">
        </div>
    `;
    
    // Add focus effect via JS for the inline style
    setTimeout(() => {
        const input = document.getElementById('custom-task-input');
        if (input) {
            input.focus();
            input.addEventListener('focus', () => input.style.borderColor = 'var(--primary)');
            input.addEventListener('blur', () => input.style.borderColor = 'var(--border-color)');
        }
    }, 100);

    // 2. Animate the modal into view
    modal.classList.add('active');
    
    // 3. Prevent duplicate event listeners by cloning the button
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.innerText = "Add Task";

    // 4. Handle the submission
    newConfirmBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('custom-task-input').value.trim();
        
        if(!titleInput) {
            showToast("Please enter a task name.", "error");
            return;
        }
        
        // Show loading state on button
        newConfirmBtn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; margin-right: 8px; display: inline-block;"></i> Saving...`;
        lucide.createIcons();

        if(dbClient && currentUser) {
            const { error } = await dbClient.from('tasks').insert([{ user_id: currentUser.id, title: titleInput, category: 'Self Study' }]);
            
            if(error) { 
                showToast("Failed to save task to database.", "error"); 
                newConfirmBtn.innerText = "Add Task";
                return; 
            }
            
            showToast("Task added successfully!", "success");
            loadTasks(); // Refresh the list
        } else {
            showToast("Demo Mode: Task added locally.", "success");
        }
        
        // Close modal
        modal.classList.remove('active');
    });
});


document.querySelector('.search-box input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if(query.trim()) {
            showToast(`Searching database for: "${query}"...`, "info");
            e.target.value = ''; 
        }
    }
});
// =========================================
// UPGRADE OVERLAY LOGIC & ANIMATIONS
// =========================================
const upgradeOverlay = document.getElementById('upgrade-overlay');
const btnCloseUpgrade = document.getElementById('btn-close-upgrade');

// Monthly/Yearly Toggle Elements
const btnMonthly = document.getElementById('btn-monthly');
const btnYearly = document.getElementById('btn-yearly');
const toggleSlider = document.querySelector('.up-toggle-slider');

// Pricing Elements to manipulate
const pricePro = document.getElementById('price-pro');
const strikePro = document.getElementById('strike-pro');
const billedPro = document.getElementById('billed-pro');

const priceProPlus = document.getElementById('price-pro-plus');
const strikeProPlus = document.getElementById('strike-pro-plus');
const billedProPlus = document.getElementById('billed-pro-plus');

const saveBanners = document.querySelectorAll('.save-banner-dynamic');

// State
let isYearly = true; // Default as per screenshot

// Bind all existing upgrade buttons across the app to open this modal
document.querySelectorAll('.upgrade-card button, .action-contact-sales, .action-get-started').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        openUpgradeModal();
    });
});

// Checkout click simulation
document.querySelectorAll('.action-checkout').forEach(btn => {
    btn.addEventListener('click', () => {
        showToast("Redirecting to Stripe Secure Checkout...", "success");
    });
});

function openUpgradeModal() {
    upgradeOverlay.style.display = 'block';
    // Freeze background scrolling
    document.body.style.overflow = 'hidden'; 
    if(typeof lenis !== 'undefined') lenis.stop();

    // GSAP Entrance Animations
    gsap.to(upgradeOverlay, { opacity: 1, duration: 0.3 });
    
    const tl = gsap.timeline();
    tl.fromTo('.gs-up-anim', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }
    )
    .fromTo('.gs-up-side-anim', 
        { x: 30, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 
        "-=0.4"
    );
}

btnCloseUpgrade?.addEventListener('click', () => {
    gsap.to(upgradeOverlay, { 
        opacity: 0, 
        duration: 0.3, 
        onComplete: () => {
            upgradeOverlay.style.display = 'none';
            document.body.style.overflow = '';
            if(typeof lenis !== 'undefined') lenis.start();
        }
    });
});

// Toggle Logic Function
function setPricingMode(yearly) {
    isYearly = yearly;
    
    if (yearly) {
        // UI Updates for Toggle
        btnYearly.classList.add('active');
        btnMonthly.classList.remove('active');
        toggleSlider.classList.add('right');
        
        // Data Updates
        pricePro.innerText = "$7.99";
        strikePro.style.display = "inline";
        billedPro.innerText = "Billed $95.88 yearly";
        
        priceProPlus.innerText = "$14.99";
        strikeProPlus.style.display = "inline";
        billedProPlus.innerText = "Billed $179.88 yearly";

        saveBanners.forEach(banner => {
            banner.style.opacity = '1';
            banner.style.visibility = 'visible';
        });

    } else {
        // UI Updates for Toggle
        btnMonthly.classList.add('active');
        btnYearly.classList.remove('active');
        toggleSlider.classList.remove('right');
        
        // Data Updates
        pricePro.innerText = "$13.99";
        strikePro.style.display = "none";
        billedPro.innerText = "Billed monthly";
        
        priceProPlus.innerText = "$24.99";
        strikeProPlus.style.display = "none";
        billedProPlus.innerText = "Billed monthly";

        saveBanners.forEach(banner => {
            banner.style.opacity = '0';
            banner.style.visibility = 'hidden';
        });
    }

    // Little pop animation on the prices to show they changed
    gsap.fromTo(['#price-pro', '#price-pro-plus'], 
        { scale: 0.8, opacity: 0.5 }, 
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
    );
}

// Initial state setup
toggleSlider.classList.add('right'); // Start on Yearly

btnMonthly?.addEventListener('click', () => setPricingMode(false));
btnYearly?.addEventListener('click', () => setPricingMode(true));
document.querySelector('.action-demo')?.addEventListener('click', () => {
    showToast("Preparing interactive demo environment...", "info");
    setTimeout(() => openAuth(false), 1500); 
});



// =========================================
// 8. MODALS & FILE UPLOADS (BULLETPROOF)
// =========================================
const modal = document.getElementById('app-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const confirmBtn = document.getElementById('btn-confirm-modal');

// Close Modal Logic
const closeModal = () => modal.classList.remove('active');
document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
document.getElementById('btn-close-modal-icon')?.addEventListener('click', closeModal);

// Event Delegation: Listens to the whole document for the upload button click
document.addEventListener('click', (e) => {
    // Check if the clicked element (or its parent) has the 'action-upload-note' class
    const uploadBtn = e.target.closest('.action-upload-note');
    
    if (uploadBtn) {
        e.preventDefault();
        
        if (!currentUser) {
            if(window.showToast) showToast("Please log in to upload notes.", "error");
            return;
        }

        // Build the Modal UI
        modalTitle.innerText = "Upload Study Material";
        modalBody.innerHTML = `
            <p>Drag and drop your PDFs or Docs to upload them to your secure cloud.</p>
            <div class="upload-dropzone" id="dropzone">
                <i data-lucide="upload-cloud" style="width: 40px; height: 40px; color: var(--primary); margin-bottom: 12px;"></i>
                <h4>Click to select file</h4>
                <input type="text" id="simulated-filename" placeholder="Name this document (e.g., Biology Chapter 1)..." style="margin-top: 16px; width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-white); color: var(--text-dark); outline: none;">
            </div>
            <div class="upload-progress" id="upload-progress" style="display: none;">
                <div class="upload-bar" id="upload-bar" style="width: 0%; height: 6px; background: var(--primary); border-radius: 10px; transition: width 0.3s ease;"></div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
        
        // Show Modal with Animation
        modal.classList.add('active');
        gsap.fromTo(modal.querySelector('.modal-content'), 
            { scale: 0.9, opacity: 0, y: 20 }, 
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
        );

        // Clone button to ensure no duplicate event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.innerText = "Upload to Database";

        // Handle the Upload Submit
        newConfirmBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('simulated-filename').value.trim() || 'Untitled Document';
            document.getElementById('upload-progress').style.display = 'block';
            
            newConfirmBtn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px;"></i> Uploading...`;
            if(window.lucide) lucide.createIcons();

            // Simulate the file upload progress bar
            gsap.to('#upload-bar', { 
                width: '100%', 
                duration: 1.5, 
                ease: 'power1.inOut', 
                onComplete: async () => {
                    // Push to Supabase Database
                    if(dbClient && currentUser) {
                        try {
                            const { error } = await dbClient.from('notes').insert([{ 
                                user_id: currentUser.id, 
                                title: titleInput 
                            }]);
                            
                            if (error) throw error;
                            
                            if(typeof loadNotes === 'function') loadNotes(); // Refresh UI
                            if(window.showToast) showToast('Document securely saved to database!', 'success');
                            
                        } catch (err) {
                            console.error("Upload error:", err);
                            if(window.showToast) showToast("Database upload failed", "error");
                        }
                    } else {
                        if(window.showToast) showToast('Demo Upload Successful!', 'success');
                    }
                    
                    // Close modal smoothly
                    gsap.to(modal.querySelector('.modal-content'), {
                        scale: 0.9, opacity: 0, y: 10, duration: 0.2, 
                        onComplete: () => {
                            modal.classList.remove('active');
                            newConfirmBtn.innerText = "Upload to Database";
                        }
                    });
                }
            });
        });
    }
});
// =========================================
// 8. NEURAL BACKGROUND & GROQ API INTEGRATION
// =========================================

// ⚠️ PASTE YOUR GROQ API KEY HERE ⚠️
// const GROQ_API_KEY = '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'; 

// --- Neural Network Canvas Background ---
let neuralCanvas, neuralCtx, particles = [];
let isNeuralInit = false;

function initNeuralBackground() {
    if(isNeuralInit) return;
    neuralCanvas = document.getElementById('neural-canvas');
    if (!neuralCanvas) return;
    
    neuralCtx = neuralCanvas.getContext('2d');
    
    function resize() {
        neuralCanvas.width = neuralCanvas.parentElement.clientWidth;
        neuralCanvas.height = neuralCanvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Create nodes (fewer on mobile for performance)
    const particleCount = window.innerWidth > 768 ? 50 : 25;
    for(let i=0; i<particleCount; i++) {
        particles.push({
            x: Math.random() * neuralCanvas.width,
            y: Math.random() * neuralCanvas.height,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            radius: Math.random() * 2 + 1.5
        });
    }

    function animate() {
        neuralCtx.clearRect(0, 0, neuralCanvas.width, neuralCanvas.height);
        
        // Draw connecting lines
        neuralCtx.lineWidth = 0.8;
        for(let i=0; i<particles.length; i++) {
            for(let j=i+1; j<particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if(dist < 130) {
                    const opacity = 1 - (dist/130);
                    neuralCtx.strokeStyle = isDark 
                        ? `rgba(99, 102, 241, ${opacity * 0.4})` 
                        : `rgba(59, 130, 246, ${opacity * 0.3})`;
                    neuralCtx.beginPath();
                    neuralCtx.moveTo(particles[i].x, particles[i].y);
                    neuralCtx.lineTo(particles[j].x, particles[j].y);
                    neuralCtx.stroke();
                }
            }
        }

        // Move and draw nodes
        for(let i=0; i<particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if(p.x < 0 || p.x > neuralCanvas.width) p.vx *= -1;
            if(p.y < 0 || p.y > neuralCanvas.height) p.vy *= -1;

            neuralCtx.beginPath();
            neuralCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            neuralCtx.fillStyle = isDark ? 'rgba(129, 140, 248, 0.7)' : 'rgba(59, 130, 246, 0.6)';
            neuralCtx.fill();
        }

        requestAnimationFrame(animate);
    }
    animate();
    isNeuralInit = true;
}

// Speed up nodes when AI is thinking
function setNeuralThinking(isThinking) {
    if (!isNeuralInit) return;
    const speedMultiplier = isThinking ? 3.5 : (1/3.5);
    particles.forEach(p => {
        p.vx *= speedMultiplier;
        p.vy *= speedMultiplier;
    });
}

// Hook canvas initialization to the sidebar router
document.querySelector('[data-view="chat"]').addEventListener('click', () => {
    setTimeout(initNeuralBackground, 100); 
});


// --- Groq API Chat Logic ---
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const submitBtn = document.getElementById('chat-submit-btn');
const tutorStatus = document.getElementById('tutor-status');

let chatContext = [
    { role: "system", content: "You are SAGE, an enthusiastic and highly intelligent gamified AI tutor. Keep answers encouraging, concise, and format them beautifully using markdown if necessary." }
];

const appendMessage = (text, isUser, id = null) => {
    if(!chatHistory) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'ai-msg'}`;
    msgDiv.style.display = 'flex'; msgDiv.style.gap = '12px';
    
    const userAvatar = `<div class="msg-avatar" style="width: 36px; height: 36px; border-radius: 10px; background: var(--text-dark); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="user"></i></div>`;
    const aiAvatar = `<div class="msg-avatar" style="width: 36px; height: 36px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="bot"></i></div>`;
    
    if(isUser) {
        msgDiv.style.alignSelf = 'flex-end'; msgDiv.style.flexDirection = 'row-reverse';
        msgDiv.innerHTML = `${userAvatar}<div class="msg-bubble" style="background: var(--primary); color: white; padding: 14px 18px; border-radius: 16px; border-top-right-radius: 4px; max-width: 80%; line-height: 1.5; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);">${text}</div>`;
    } else {
        msgDiv.innerHTML = `${aiAvatar}<div class="msg-bubble" style="background: var(--bg-white); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 16px; border-top-left-radius: 4px; max-width: 80%; line-height: 1.5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"><span id="${id}">${text}</span></div>`;
    }
    
    chatHistory.appendChild(msgDiv);
    lucide.createIcons();
    chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
};

chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if(!text) return;

    appendMessage(text, true); 
    chatInput.value = ''; 
    submitBtn.disabled = true;

    // Trigger Neural Excitement & UI changes
    setNeuralThinking(true);
    tutorStatus.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 14px; margin-right: 4px; display:inline-block;"></i> Processing...`;
    tutorStatus.style.background = "var(--primary)";
    tutorStatus.style.color = "white";
    lucide.createIcons();
    
    chatContext.push({ role: "user", content: text });

    const typingId = "typing-" + Date.now();
    appendMessage(`<i data-lucide="loader" class="animate-spin" style="width: 18px; color: var(--text-gray);"></i>`, false, typingId);

    try {
        

        // Notice: NO API KEY HERE ANYMORE!
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: chatContext,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        chatContext.push({ role: "assistant", content: aiReply });
        
        // Basic formatting for line breaks
        const formattedReply = aiReply.replace(/\n/g, '<br>');
        document.getElementById(typingId).parentElement.innerHTML = formattedReply;

    } catch (err) {
        console.error(err);
        document.getElementById(typingId).parentElement.innerHTML = `<span style="color: #EF4444; font-weight: 600;">${err.message}</span>`;
    } finally {
        // Restore calm state
        setNeuralThinking(false);
        tutorStatus.innerHTML = `<i data-lucide="zap" style="width: 14px; margin-right: 4px; display:inline-block;"></i> Powered by Groq`;
        tutorStatus.style.background = "var(--primary-light)";
        tutorStatus.style.color = "var(--primary)";
        lucide.createIcons();
        submitBtn.disabled = false;
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
    }
});
// =========================================
// 9. THEME & SCROLL ANIMATIONS
// =========================================
document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('sage_theme', isDark ? 'dark' : 'light');
        
        if (mainCore) gsap.to(mainCore.material.color, { r: isDark?0.38:0.14, g: isDark?0.40:0.38, b: isDark?0.94:0.92, duration: 0.5 });
        if(isDark) {
            gsap.to('.icon-moon', { rotation: 90, scale: 0, opacity: 0, duration: 0.3 });
            gsap.to('.icon-sun', { rotation: 0, scale: 1, opacity: 1, duration: 0.3 });
        } else {
            gsap.to('.icon-sun', { rotation: -90, scale: 0, opacity: 0, duration: 0.3 });
            gsap.to('.icon-moon', { rotation: 0, scale: 1, opacity: 1, duration: 0.3 });
        }
    });
});

gsap.registerPlugin(ScrollTrigger);
gsap.to('.gs-float', { y: 20, rotation: 10, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.5 });

setTimeout(() => {
    document.querySelectorAll('.gs-section').forEach(sec => {
        
        // 1. Animate items sliding up
        const upEls = sec.querySelectorAll('.gs-stagger-up');
        if(upEls.length) {
            gsap.to(upEls, { scrollTrigger: { trigger: sec, start: "top 85%" }, y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" });
        }

        // 2. Animate items scaling in (This will now catch your testimonial card!)
        const scaleEls = sec.querySelectorAll('.gs-scale-in');
        if(scaleEls.length) {
            gsap.to(scaleEls, { scrollTrigger: { trigger: sec, start: "top 85%" }, scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" });
        }
        
    });
}, 500);
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 20) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
});

document.getElementById('scroll-top')?.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
document.querySelectorAll('.interactive-icon, .interactive-btn').forEach(el => el.addEventListener('click', () => {
    if(!gsap.isTweening(el)) gsap.fromTo(el, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
}));
// =========================================
// 10. DYNAMIC QUIZ SYSTEM
// =========================================

const quizListContainer = document.getElementById('quiz-list-container');
const quizCreateContainer = document.getElementById('quiz-create-container');
const quizAttemptContainer = document.getElementById('quiz-attempt-container');
const quizListUI = document.getElementById('db-quiz-list');
const questionBuilder = document.getElementById('quiz-questions-builder');

let currentQuestions = [];
let activeQuizData = null;

// --- 1. UI Navigation ---
document.getElementById('btn-show-create-quiz')?.addEventListener('click', () => {
    quizListContainer.style.display = 'none';
    quizCreateContainer.style.display = 'block';
    document.getElementById('new-quiz-title').value = '';
    currentQuestions = [];
    questionBuilder.innerHTML = '';
    addQuestionToBuilder(); // Start with 1 empty question
});

document.getElementById('btn-cancel-create-quiz')?.addEventListener('click', () => {
    quizCreateContainer.style.display = 'none';
    quizListContainer.style.display = 'block';
});

document.getElementById('btn-exit-quiz')?.addEventListener('click', () => {
    quizAttemptContainer.style.display = 'none';
    quizListContainer.style.display = 'block';
    loadQuizzes();
});

// --- 2. Load Quizzes from Supabase ---
async function loadQuizzes() {
    if(!dbClient || !currentUser) return;
    
    quizListUI.innerHTML = '<p class="text-gray">Loading...</p>';
    const { data: quizzes, error } = await dbClient.from('quizzes').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    
    if (error || !quizzes || quizzes.length === 0) {
        quizListUI.innerHTML = `<p class="text-gray" style="grid-column: span 3;">You haven't created any quizzes yet.</p>`;
        return;
    }

    quizListUI.innerHTML = '';
    quizzes.forEach(quiz => {
        const questionCount = quiz.questions ? quiz.questions.length : 0;
        const hasScore = quiz.score !== null && quiz.score !== undefined;
        
        const card = document.createElement('div');
        card.className = 'card interactive-card';
        card.innerHTML = `
            <div class="l-icon" style="color: #3B82F6; background: #EFF6FF; margin-bottom: 16px;"><i data-lucide="check-circle"></i></div>
            <h4 style="font-size: 16px; margin-bottom: 8px;">${quiz.title}</h4>
            <p class="text-gray" style="font-size: 13px; margin-bottom: 16px;">${questionCount} Questions</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge-sm" style="${hasScore ? 'background: #ECFDF5; color: #10B981;' : 'background: var(--bg-gray); color: var(--text-gray);'} border: none; padding: 4px 8px;">
                    ${hasScore ? `Score: ${quiz.score}%` : 'Not started'}
                </span>
                <button class="btn ${hasScore ? 'btn-outline' : 'btn-primary'} btn-sm attempt-btn" data-id="${quiz.id}">
                    ${hasScore ? 'Retake' : 'Start Quiz'}
                </button>
            </div>
        `;
        quizListUI.appendChild(card);
    });
    lucide.createIcons();

    // Bind Attempt Buttons
    document.querySelectorAll('.attempt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const quizId = e.currentTarget.getAttribute('data-id');
            const quizData = quizzes.find(q => q.id === quizId);
            startQuiz(quizData);
        });
    });
}

// Hook into dashboard routing so quizzes load when tab is clicked
document.querySelector('[data-view="quizzes"]').addEventListener('click', loadQuizzes);

// --- 3. Quiz Builder Logic ---
function addQuestionToBuilder() {
    const qIndex = currentQuestions.length;
    currentQuestions.push({ q: '', options: ['', '', '', ''], answer: 0 });
    
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-q-block';
    qDiv.style.cssText = "background: var(--bg-white); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px;";
    
    qDiv.innerHTML = `
        <input type="text" placeholder="Question ${qIndex + 1}" class="q-title" data-idx="${qIndex}" style="width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-gray); font-weight: 500; outline:none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="display:flex; align-items:center; gap:8px;"><input type="radio" name="correct-${qIndex}" value="0" checked><input type="text" placeholder="Option 1" class="q-opt" data-idx="${qIndex}" data-opt="0" style="flex:1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; outline:none;"></div>
            <div style="display:flex; align-items:center; gap:8px;"><input type="radio" name="correct-${qIndex}" value="1"><input type="text" placeholder="Option 2" class="q-opt" data-idx="${qIndex}" data-opt="1" style="flex:1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; outline:none;"></div>
            <div style="display:flex; align-items:center; gap:8px;"><input type="radio" name="correct-${qIndex}" value="2"><input type="text" placeholder="Option 3" class="q-opt" data-idx="${qIndex}" data-opt="2" style="flex:1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; outline:none;"></div>
            <div style="display:flex; align-items:center; gap:8px;"><input type="radio" name="correct-${qIndex}" value="3"><input type="text" placeholder="Option 4" class="q-opt" data-idx="${qIndex}" data-opt="3" style="flex:1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; outline:none;"></div>
        </div>
    `;
    questionBuilder.appendChild(qDiv);
}

document.getElementById('btn-add-question')?.addEventListener('click', addQuestionToBuilder);

document.getElementById('btn-save-quiz')?.addEventListener('click', async () => {
    const title = document.getElementById('new-quiz-title').value.trim();
    if(!title) return showToast("Quiz needs a title!", "error");

    // Scrape data from the DOM
    const qBlocks = document.querySelectorAll('.quiz-q-block');
    let finalQuestions = [];
    
    qBlocks.forEach((block, idx) => {
        const qText = block.querySelector('.q-title').value.trim();
        const opts = Array.from(block.querySelectorAll('.q-opt')).map(inp => input.value.trim());
        const correctIdx = parseInt(block.querySelector(`input[name="correct-${idx}"]:checked`).value);
        
        if(qText && opts[0] && opts[1]) {
            finalQuestions.push({ question: qText, options: opts, correct_index: correctIdx });
        }
    });

    if(finalQuestions.length === 0) return showToast("Add at least one valid question.", "error");

    const btn = document.getElementById('btn-save-quiz');
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width:16px;"></i> Saving...`;
    lucide.createIcons();

    if(dbClient && currentUser) {
        const { error } = await dbClient.from('quizzes').insert([{ user_id: currentUser.id, title: title, questions: finalQuestions }]);
        if(error) { showToast("Error saving quiz", "error"); btn.innerText="Save to Database"; return; }
        showToast("Quiz created successfully!", "success");
    }

    btn.innerText = "Save to Database";
    quizCreateContainer.style.display = 'none';
    quizListContainer.style.display = 'block';
    loadQuizzes();
});


// --- 4. Quiz Player Logic ---
function startQuiz(quiz) {
    activeQuizData = quiz;
    quizListContainer.style.display = 'none';
    quizAttemptContainer.style.display = 'block';
    
    document.getElementById('attempt-quiz-title').innerText = quiz.title;
    const form = document.getElementById('quiz-attempt-form');
    form.innerHTML = '';

    quiz.questions.forEach((q, qIndex) => {
        const block = document.createElement('div');
        block.style.cssText = "padding-bottom: 20px; border-bottom: 1px solid var(--border-color);";
        
        let optsHtml = '';
        q.options.forEach((opt, oIndex) => {
            if(opt) {
                optsHtml += `
                <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; cursor: pointer; background: var(--bg-gray); transition: 0.2s;">
                    <input type="radio" name="ans-${qIndex}" value="${oIndex}" style="width:16px; height:16px; accent-color: var(--primary);">
                    <span style="font-size: 15px;">${opt}</span>
                </label>`;
            }
        });

        block.innerHTML = `
            <h3 style="font-size: 16px; margin-bottom: 16px;">${qIndex + 1}. ${q.question}</h3>
            ${optsHtml}
        `;
        form.appendChild(block);
    });
}

document.getElementById('btn-submit-quiz')?.addEventListener('click', async () => {
    if(!activeQuizData) return;
    
    let correctCount = 0;
    activeQuizData.questions.forEach((q, qIndex) => {
        const selected = document.querySelector(`input[name="ans-${qIndex}"]:checked`);
        if(selected && parseInt(selected.value) === q.correct_index) {
            correctCount++;
        }
    });

    const scorePercentage = Math.round((correctCount / activeQuizData.questions.length) * 100);
    showToast(`You scored ${scorePercentage}%! (${correctCount}/${activeQuizData.questions.length})`, scorePercentage > 50 ? 'success' : 'info');

    if(dbClient && currentUser) {
        // Update the score in the database
        await dbClient.from('quizzes').update({ score: scorePercentage }).eq('id', activeQuizData.id);
        
        // Bonus: Update total quizzes solved in Profile
        const { data: profile } = await dbClient.from('profiles').select('quizzes_solved, xp_earned').eq('id', currentUser.id).single();
        if(profile) {
            await dbClient.from('profiles').update({ 
                quizzes_solved: profile.quizzes_solved + 1,
                xp_earned: profile.xp_earned + (scorePercentage * 5) 
            }).eq('id', currentUser.id);
        }
    }

    quizAttemptContainer.style.display = 'none';
    quizListContainer.style.display = 'block';
    loadQuizzes();
    // Refresh dashboard stats quietly
    if(typeof fetchDashboardData === 'function') fetchDashboardData();
});
// =========================================
// 11. CODELAB EXECUTION ENGINE
// =========================================

const btnRunCode = document.getElementById('btn-run-code');
const btnClearConsole = document.getElementById('btn-clear-console');
const codelabEditor = document.getElementById('codelab-editor');
const codelabConsole = document.getElementById('codelab-console');

btnRunCode?.addEventListener('click', () => {
    // 1. Clear previous output
    codelabConsole.innerHTML = '';
    btnRunCode.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px;"></i> Running...`;
    lucide.createIcons();
    
    // 2. Safely backup the browser's original console functions
    const originalLog = console.log;
    const originalError = console.error;

    // 3. Override console.log to print to our Custom UI Console
    console.log = (...args) => {
        // Convert objects/arrays to strings so they don't print as [object Object]
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
        codelabConsole.innerHTML += `<div style="color: var(--text-dark); margin-bottom: 4px;">> ${msg}</div>`;
        originalLog(...args); // Keep printing to the real dev tools console too
    };

    // Override console.error
    console.error = (...args) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
        codelabConsole.innerHTML += `<div style="color: #EF4444; margin-bottom: 4px;">> Error: ${msg}</div>`;
        originalError(...args);
    };

    // 4. Get the raw code from the textarea
    const rawCode = codelabEditor.value;

    try {
        // 5. Execute the code!
        // We wrap it in an async IIFE so users can use top-level 'await' if they want
        const executeCode = new Function(`
            return (async () => {
                ${rawCode}
            })();
        `);
        
        executeCode().then(() => {
            codelabConsole.innerHTML += `<div style="color: #10B981; margin-top: 8px; font-size: 12px; font-weight: 600;">✓ Execution finished successfully</div>`;
        }).catch(err => {
            console.error(err.message);
        });

    } catch (error) {
        // 6. Catch basic syntax errors before execution
        codelabConsole.innerHTML += `<div style="color: #EF4444; margin-bottom: 4px; font-weight: 600;">> SyntaxError: ${error.message}</div>`;
    } finally {
        // 7. ALWAYS restore the original console so we don't break the rest of your app!
        console.log = originalLog;
        console.error = originalError;
        
        // Auto-scroll to bottom of console and reset button
        setTimeout(() => {
            codelabConsole.scrollTop = codelabConsole.scrollHeight;
            btnRunCode.innerHTML = `<i data-lucide="play" style="width: 16px;"></i> Run Code`;
            lucide.createIcons();
        }, 100);
    }
});

// Clear console button logic
btnClearConsole?.addEventListener('click', () => {
    codelabConsole.innerHTML = `> Console cleared.`;
    codelabConsole.style.color = 'var(--text-gray)';
});
// =========================================
// 12. AI FLASHCARD GENERATOR
// =========================================

let currentFlashcards = [];
let currentCardIndex = 0;

const fcTopicInput = document.getElementById('flashcard-topic-input');
const btnGenerateFc = document.getElementById('btn-generate-flashcards');
const fcWorkspace = document.getElementById('flashcard-workspace');
const fcLoading = document.getElementById('flashcard-loading');
const activeCard = document.getElementById('active-flashcard');
const fcFrontText = document.getElementById('fc-front-text');
const fcBackText = document.getElementById('fc-back-text');
const fcCounter = document.getElementById('fc-counter');

// The function triggered by clicking the card
window.flipCard = function() {
    activeCard.classList.toggle('flipped');
};

function renderCard(index, direction = 'next') {
    if (currentFlashcards.length === 0) return;
    
    // GSAP animation: Slide current card out
    gsap.to(activeCard, {
        x: direction === 'next' ? -80 : 80,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            // Update content while hidden
            activeCard.classList.remove('flipped'); // Reset flip state
            fcFrontText.innerText = currentFlashcards[index].front;
            fcBackText.innerText = currentFlashcards[index].back;
            fcCounter.innerText = `${index + 1} / ${currentFlashcards.length}`;
            
            // GSAP animation: Slide new card in
            gsap.fromTo(activeCard, 
                { x: direction === 'next' ? 80 : -80, opacity: 0 }, 
                { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
            );
        }
    });
}

document.getElementById('btn-fc-prev')?.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCard(currentCardIndex, 'prev');
    } else {
        showToast("You are at the first card.", "info");
    }
});

document.getElementById('btn-fc-next')?.addEventListener('click', () => {
    if (currentCardIndex < currentFlashcards.length - 1) {
        currentCardIndex++;
        renderCard(currentCardIndex, 'next');
    } else {
        showToast("You've finished the deck! Great job.", "success");
        // Optional: Trigger confetti or XP gain here!
    }
});

btnGenerateFc?.addEventListener('click', async () => {
    const topic = fcTopicInput.value.trim();
    if (!topic) return showToast("Please enter a topic to study.", "error");

    

    // Switch UI to Loading State
    fcWorkspace.style.display = 'none';
    fcLoading.style.display = 'flex';

    try {
        // We prompt the AI to strictly return a JSON array so we can parse it programmatically
        const prompt = `Generate exactly 5 highly educational flashcards about "${topic}". 
        Respond ONLY with a valid JSON array of objects. Do not include markdown formatting or conversational text.
        Each object must have exactly two keys: "front" (a question or concept) and "back" (the answer or explanation).
        Example: [{"front": "What is the powerhouse of the cell?", "back": "Mitochondria."}]`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", 
                messages: [{ role: "user", content: prompt }],
                temperature: 0.6
            })
        });

        if (!response.ok) throw new Error("Failed to contact Groq API.");

        const data = await response.json();
        let aiReply = data.choices[0].message.content;
        
        // Clean up the response in case the AI wraps it in markdown code blocks
        aiReply = aiReply.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Parse the string into a JavaScript Array
        let parsedData = JSON.parse(aiReply);
        
        // Failsafe in case the AI nested the array inside an object (e.g. {"flashcards": [...]})
        if (parsedData.flashcards) parsedData = parsedData.flashcards;

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("AI returned invalid data format.");
        }

        currentFlashcards = parsedData;
        currentCardIndex = 0;
        
        // Show Workspace
        fcLoading.style.display = 'none';
        fcWorkspace.style.display = 'flex';
        renderCard(0);
        showToast("Deck generated successfully!", "success");

    } catch (err) {
        console.error(err);
        showToast("Failed to generate deck. Please try again.", "error");
        fcLoading.style.display = 'none';
    }
});
// =========================================
// 13. STUDY PLANNER SYSTEM
// =========================================

const plannerContainer = document.getElementById('planner-events-container');
const btnAddPlannerEvent = document.getElementById('btn-add-planner-event');
const plannerCount = document.getElementById('planner-event-count');

// --- Format Date Helper ---
function formatEventDate(dateString) {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { dayName, dayNum, month };
}

// --- Load Events from Database ---
async function loadPlannerEvents() {
    if(!dbClient || !currentUser) return;
    
    plannerContainer.innerHTML = '<p class="text-gray" style="text-align:center; margin-top: 40px;"><i data-lucide="loader" class="animate-spin" style="margin: 0 auto 12px; display:block;"></i> Fetching schedule...</p>';
    lucide.createIcons();

    const { data: events, error } = await dbClient.from('study_events')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('event_date', { ascending: true });
    
    if (error || !events || events.length === 0) {
        plannerContainer.innerHTML = `
            <div style="text-align: center; margin-top: 40px; opacity: 0.6;">
                <i data-lucide="calendar-x" style="width: 48px; height: 48px; color: var(--text-gray); margin: 0 auto 16px; display: block;"></i>
                <p class="text-gray" style="font-size: 14px;">Your schedule is totally clear.</p>
            </div>`;
        plannerCount.innerText = "0 Events";
        lucide.createIcons();
        return;
    }

    plannerCount.innerText = `${events.length} Event${events.length > 1 ? 's' : ''}`;
    plannerContainer.innerHTML = '';

    events.forEach((ev, index) => {
        const { dayName, dayNum, month } = formatEventDate(ev.event_date);
        const item = document.createElement('div');
        item.className = 'planner-event-item gs-planner-anim';
        item.style.cssText = `display: flex; gap: 16px; border-left: 3px solid ${ev.color}; padding-left: 16px; padding-right: 16px; position: relative; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); align-items: center; transition: 0.3s;`;
        
        item.innerHTML = `
            <div style="width: 60px; text-align: center; color: ${ev.color}; font-weight: 600; flex-shrink: 0;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${month}</div>
                <div style="font-size: 24px; line-height: 1;">${dayNum}</div>
                <div style="font-size: 11px; text-transform: uppercase;">${dayName}</div>
            </div>
            <div style="flex: 1;">
                <h4 style="font-size: 16px; margin-bottom: 4px; color: var(--text-dark);">${ev.title}</h4>
                <p class="text-gray" style="font-size: 13px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="clock" style="width: 12px;"></i> ${ev.event_time || 'All Day'} 
                    <span style="opacity: 0.5;">•</span> 
                    <i data-lucide="map-pin" style="width: 12px;"></i> ${ev.location || 'TBD'}
                </p>
            </div>
            <button class="icon-btn delete-event-btn" data-id="${ev.id}" style="border: none; color: #EF4444; opacity: 0.6; transition: 0.2s;" title="Delete Event"><i data-lucide="trash-2" style="width: 16px;"></i></button>
        `;
        plannerContainer.appendChild(item);
    });

    lucide.createIcons();

    // GSAP Stagger Animation for smooth entrance
    gsap.fromTo('.gs-planner-anim', 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
    );

    // Delete Event Logic
    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            // Animate out
            gsap.to(e.currentTarget.parentElement, { 
                opacity: 0, x: 30, height: 0, padding: 0, margin: 0, border: 'none', duration: 0.3, 
                onComplete: () => e.currentTarget.parentElement.remove() 
            });
            await dbClient.from('study_events').delete().eq('id', id);
            showToast("Event removed from schedule.", "info");
            
            // Update counter visually
            const currentCount = parseInt(plannerCount.innerText) - 1;
            plannerCount.innerText = `${Math.max(0, currentCount)} Event${currentCount !== 1 ? 's' : ''}`;
        });
    });
}

// Hook into dashboard router
document.querySelector('[data-view="planner"]')?.addEventListener('click', loadPlannerEvents);

// --- Add Event Modal Logic ---
btnAddPlannerEvent?.addEventListener('click', () => {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('btn-confirm-modal');

    // Build the beautiful input form
    modalTitle.innerText = "Schedule New Event";
    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <input type="text" id="ev-title" placeholder="Event Title (e.g., Final Exam)" style="width: 100%; padding: 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-gray); font-size: 15px; outline: none;">
            
            <div style="display: flex; gap: 12px;">
                <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--text-gray); margin-bottom: 4px; display: block;">Date</label>
                    <input type="date" id="ev-date" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-white); outline: none;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 12px; color: var(--text-gray); margin-bottom: 4px; display: block;">Time</label>
                    <input type="time" id="ev-time" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-white); outline: none;">
                </div>
            </div>

            <input type="text" id="ev-loc" placeholder="Location / Link" style="width: 100%; padding: 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-white); outline: none;">
            
            <div>
                <label style="font-size: 12px; color: var(--text-gray); margin-bottom: 8px; display: block;">Tag Color</label>
                <div style="display: flex; gap: 12px;" id="ev-color-picker">
                    <div class="color-dot active" data-color="#3B82F6" style="width: 24px; height: 24px; border-radius: 50%; background: #3B82F6; cursor: pointer; border: 2px solid var(--text-dark);"></div>
                    <div class="color-dot" data-color="#8B5CF6" style="width: 24px; height: 24px; border-radius: 50%; background: #8B5CF6; cursor: pointer; border: 2px solid transparent;"></div>
                    <div class="color-dot" data-color="#F59E0B" style="width: 24px; height: 24px; border-radius: 50%; background: #F59E0B; cursor: pointer; border: 2px solid transparent;"></div>
                    <div class="color-dot" data-color="#10B981" style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; cursor: pointer; border: 2px solid transparent;"></div>
                    <div class="color-dot" data-color="#EF4444" style="width: 24px; height: 24px; border-radius: 50%; background: #EF4444; cursor: pointer; border: 2px solid transparent;"></div>
                </div>
            </div>
        </div>
    `;
    
    // Default to today's date
    document.getElementById('ev-date').valueAsDate = new Date();

    // Color picker logic
    let selectedColor = '#3B82F6';
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            document.querySelectorAll('.color-dot').forEach(d => d.style.borderColor = 'transparent');
            e.target.style.borderColor = 'var(--text-dark)';
            selectedColor = e.target.getAttribute('data-color');
        });
    });

    modal.classList.add('active');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.innerText = "Save Event";

    newConfirmBtn.addEventListener('click', async () => {
        const title = document.getElementById('ev-title').value.trim();
        const date = document.getElementById('ev-date').value;
        const time = document.getElementById('ev-time').value;
        const loc = document.getElementById('ev-loc').value.trim();
        
        if(!title || !date) return showToast("Title and Date are required.", "error");

        newConfirmBtn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; display: inline-block;"></i> Saving...`;
        lucide.createIcons();

        if(dbClient && currentUser) {
            const { error } = await dbClient.from('study_events').insert([{ 
                user_id: currentUser.id, 
                title: title, 
                event_date: date,
                event_time: time,
                location: loc,
                color: selectedColor
            }]);
            
            if(error) { showToast("Failed to save event.", "error"); newConfirmBtn.innerText = "Save Event"; return; }
            showToast("Event added to calendar!", "success");
            loadPlannerEvents();
        }
        
        modal.classList.remove('active');
    });
});
// =========================================
// 14. PROGRESS ANALYTICS & CHARTS
// =========================================

let progressChartInstance = null;

async function loadProgressData() {
    if(!dbClient || !currentUser) return;

    // 1. Fetch Real Data from Supabase
    // Get profile stats
    const { data: profile } = await dbClient.from('profiles').select('study_time, quizzes_solved').eq('id', currentUser.id).single();
    
    // Get all quizzes to calculate average score
    const { data: quizzes } = await dbClient.from('quizzes').select('score').eq('user_id', currentUser.id).not('score', 'is', null);

    // Crunch the numbers
    const totalTime = profile?.study_time || 0;
    const mastered = profile?.quizzes_solved || 0;
    
    let avgScore = 0;
    if (quizzes && quizzes.length > 0) {
        const totalScore = quizzes.reduce((sum, q) => sum + q.score, 0);
        avgScore = Math.round(totalScore / quizzes.length);
    }

    // 2. Animate the numbers counting up using GSAP
    gsap.to({ val: 0 }, { 
        val: totalTime, 
        duration: 1.5, 
        ease: "power2.out", 
        onUpdate: function() { document.getElementById('prog-total-time').innerText = this.targets()[0].val.toFixed(1); }
    });

    gsap.to({ val: 0 }, { 
        val: avgScore, 
        duration: 1.5, 
        ease: "power2.out", 
        onUpdate: function() { document.getElementById('prog-avg-acc').innerText = Math.round(this.targets()[0].val); }
    });

    gsap.to({ val: 0 }, { 
        val: mastered, 
        duration: 1.5, 
        ease: "power2.out", 
        onUpdate: function() { document.getElementById('prog-topics').innerText = Math.round(this.targets()[0].val); }
    });


    // 3. Render the Interactive Chart.js Graph
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Destroy previous chart instance if it exists so it redraws cleanly
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    // Create a beautiful gradient for the chart fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(59, 130, 246, 0.5)'); // Top
    gradient.addColorStop(1, isDark ? 'rgba(99, 102, 241, 0.0)' : 'rgba(59, 130, 246, 0.0)'); // Bottom

    // Determine colors based on theme
    const lineColor = isDark ? '#818CF8' : '#3B82F6';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94A3B8' : '#64748B';

    // Dummy data for the past 7 days (In a full prod app, fetch this from study_sessions)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dataPoints = [1.2, 2.5, 1.8, 3.2, 2.0, 4.5, totalTime > 15 ? 2.1 : totalTime];

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Study Hours',
                data: dataPoints,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: lineColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Makes the line smoothly curved
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                y: { duration: 1500, easing: 'easeOutQuart' } // Smooth entrance animation
            },
            plugins: {
                legend: { display: false }, // Hide the top legend
                tooltip: {
                    backgroundColor: isDark ? '#1E293B' : '#0F172A',
                    titleFont: { family: "'Inter', sans-serif", size: 13 },
                    bodyFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) { return context.parsed.y + ' hours'; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: textColor, font: { family: "'Inter', sans-serif" } }
                },
                y: {
                    grid: { color: gridColor, drawBorder: false, borderDash: [5, 5] },
                    ticks: { 
                        color: textColor, 
                        font: { family: "'Inter', sans-serif" },
                        stepSize: 1,
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

// Hook into dashboard router so it animates every time the tab is opened
document.querySelector('[data-view="progress"]')?.addEventListener('click', () => {
    // Slight delay to ensure the div is visible before Chart.js tries to draw
    setTimeout(loadProgressData, 50); 
});
// =========================================
// 15. GAMIFIED LEADERBOARD ENGINE
// =========================================

const podiumContainer = document.getElementById('lb-podium-container');
const listContainer = document.getElementById('lb-list-container');
const myRankContainer = document.getElementById('lb-my-rank-container');

// Helper to calculate Level based on XP (e.g., 1000 XP per level)
const calculateLevel = (xp) => Math.max(1, Math.floor((xp || 0) / 1000) + 1);

// Helper to get initials
const getInitials = (name) => {
    if(!name) return "?";
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
};

async function loadLeaderboardData() {
    if (!dbClient || !currentUser) return;

    podiumContainer.innerHTML = '<i data-lucide="loader" class="animate-spin" style="color: var(--primary);"></i>';
    listContainer.innerHTML = '';
    lucide.createIcons();

    try {
        // Fetch all users, sorted by highest XP
        const { data: profiles, error } = await dbClient.from('profiles')
            .select('*')
            .order('xp_earned', { ascending: false })
            .limit(50); // Get top 50

        if (error) throw error;
        if (!profiles || profiles.length === 0) return;

        podiumContainer.innerHTML = '';
        listContainer.innerHTML = '';

        // 1. Process Top 3 for Podium
        const top3 = profiles.slice(0, 3);
        
        // Re-order array so Rank 2 is left, Rank 1 is middle, Rank 3 is right
        const podiumOrder = [];
        if (top3[1]) podiumOrder.push({ ...top3[1], rank: 2 });
        if (top3[0]) podiumOrder.push({ ...top3[0], rank: 1 });
        if (top3[2]) podiumOrder.push({ ...top3[2], rank: 3 });

        podiumOrder.forEach((user, idx) => {
            const level = calculateLevel(user.xp_earned);
            const cardColor = user.rank === 1 ? '#F59E0B' : (user.rank === 2 ? '#8B5CF6' : '#10B981');
            const bgBadge = user.rank === 1 ? 'background: #FFFBEB; color: #F59E0B;' : (user.rank === 2 ? 'background: #F5F3FF; color: #8B5CF6;' : 'background: #ECFDF5; color: #10B981;');

            const podiumHTML = `
                <div class="podium-card podium-rank-${user.rank} gs-lb-anim" style="order: ${idx};">
                    <div class="podium-avatar">
                        ${getInitials(user.full_name)}
                        <div class="podium-badge badge-${user.rank}">${user.rank}</div>
                    </div>
                    <h3 style="font-size: 16px; margin-bottom: 4px;">${user.full_name.split(' ')[0]}</h3>
                    <div style="color: ${cardColor}; font-weight: 700; font-size: 18px; margin-bottom: 8px;">${(user.xp_earned || 0).toLocaleString()} XP</div>
                    <div class="level-pill" style="${bgBadge}">Level ${level}</div>
                </div>
            `;
            podiumContainer.innerHTML += podiumHTML;
        });

        // 2. Process Ranks 4+ for the List
        let myRank = -1;
        let myData = null;

        profiles.forEach((user, index) => {
            const rank = index + 1;
            const level = calculateLevel(user.xp_earned);
            const isMe = user.id === currentUser.id;
            
            if (isMe) {
                myRank = rank;
                myData = user;
            }

            // Only add to list if rank is 4 or below
            if (rank > 3) {
                listContainer.innerHTML += `
                    <div class="lb-list-row gs-lb-anim ${isMe ? 'is-me' : ''}">
                        <div style="font-weight: 700; font-size: 16px; color: ${isMe ? 'var(--primary)' : 'var(--text-dark)'};">${rank}</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isMe ? 'var(--primary)' : 'var(--text-gray)'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;">${getInitials(user.full_name)}</div>
                            <span style="font-weight: ${isMe ? '700' : '500'};">${user.full_name}</span>
                        </div>
                        <div style="color: var(--primary); font-weight: 600;">${(user.xp_earned || 0).toLocaleString()} XP</div>
                        <div><span class="level-pill" style="background: var(--bg-gray); padding: 4px 10px;">Lvl ${level}</span></div>
                        <div class="text-gray">${(user.study_time || 0).toFixed(1)}h</div>
                        <div class="text-gray">${user.quizzes_solved || 0}</div>
                        <div style="color: #F59E0B; font-weight: 600; display:flex; align-items:center; gap:4px;"><i data-lucide="flame" style="width:14px;"></i> ${user.study_streak || 0}d</div>
                    </div>
                `;
            }
        });

        // 3. Pinned 'Your Rank' at bottom of list
        if (myData) {
            myRankContainer.innerHTML = `
                <div class="lb-list-row" style="background: var(--primary-light); border-top: 1px solid var(--border-color); border-bottom: none; position: sticky; bottom: 0; box-shadow: 0 -4px 10px rgba(0,0,0,0.02);">
                    <div style="font-weight: 700; font-size: 16px; color: var(--primary);">
                        <div style="font-size: 10px; color: var(--text-gray); font-weight: 500; margin-bottom: 2px;">Your Rank</div>
                        ${myRank}
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">${getInitials(myData.full_name)}</div>
                        <span style="font-weight: 700;">${myData.full_name}</span>
                    </div>
                    <div style="color: var(--primary); font-weight: 700; font-size: 16px;">${(myData.xp_earned || 0).toLocaleString()} XP</div>
                    <div><span class="level-pill" style="background: white; color: var(--primary); padding: 4px 10px;">Lvl ${calculateLevel(myData.xp_earned)}</span></div>
                    <div class="text-gray" style="font-weight: 500;">${(myData.study_time || 0).toFixed(1)}h</div>
                    <div class="text-gray" style="font-weight: 500;">${myData.quizzes_solved || 0}</div>
                    <div style="color: #F59E0B; font-weight: 700; display:flex; align-items:center; gap:4px;"><i data-lucide="flame" style="width:14px;"></i> ${myData.study_streak || 0}d</div>
                </div>
            `;
            
            // 4. Update Sidebar Stats
            document.getElementById('sb-my-rank').innerText = `${myRank} / ${profiles.length}`;
            document.getElementById('sb-my-xp').innerText = `${(myData.xp_earned || 0).toLocaleString()}`;
            document.getElementById('sb-my-lvl').innerText = calculateLevel(myData.xp_earned);
            document.getElementById('sb-my-streak').innerText = `${myData.study_streak || 0} days`;
        }

        lucide.createIcons();

        // 5. GSAP Entrance Animations
        gsap.fromTo('.podium-rank-2', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)" });
        gsap.fromTo('.podium-rank-1', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)", delay: 0.1 });
        gsap.fromTo('.podium-rank-3', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)", delay: 0.2 });
        gsap.fromTo('.lb-list-row.gs-lb-anim', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.3 });

    } catch (err) {
        console.error("Leaderboard Error:", err);
        podiumContainer.innerHTML = '<p class="text-gray" style="padding: 40px; color: #EF4444;">Failed to load leaderboard data.</p>';
    }
}

// Hook into dashboard router
document.querySelector('[data-view="leaderboard"]')?.addEventListener('click', loadLeaderboardData);
// =========================================
// 16. SETTINGS & PREFERENCES ENGINE
// =========================================

// Global settings object
let userSettings = {
    language: 'en',
    theme: 'light',
    fontSize: 'medium',
    timezone: 'IST',
    weekStart: 'monday',
    studyMode: 'balanced',
    sounds: true,
    reminders: true,
    showStreak: true,
    reduceMotion: false
};

// Function to save a specific setting to Supabase
async function saveSettingToDB(key, value) {
    userSettings[key] = value;
    
    // UI Update - Special case for Theme
    if (key === 'theme') {
        const isDarkTheme = value === 'dark' || (value === 'system' && window.matchMatchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        isDark = isDarkTheme;
        localStorage.setItem('sage_theme', isDark ? 'dark' : 'light');
    }

    if (!dbClient || !currentUser) return;

    try {
        const { error } = await dbClient.from('profiles').update({ settings: userSettings }).eq('id', currentUser.id);
        if (error) throw error;
        // Don't show toast for every click to avoid spamming the user, auto-save should be silent
    } catch (err) {
        console.error("Failed to save setting:", err);
        showToast("Error saving preference.", "error");
    }
}

// Function to load and apply settings to the UI
async function loadSettingsUI() {
    if(!currentUser) return;
    
    // Fill Sidebar Profile
    const initials = currentUser.user_metadata?.full_name ? currentUser.user_metadata.full_name.substring(0,2).toUpperCase() : '?';
    document.getElementById('settings-avatar').innerText = initials;
    document.getElementById('settings-name').innerText = currentUser.user_metadata?.full_name || 'Student';
    document.getElementById('settings-email').innerText = currentUser.email || '';

    if (dbClient) {
        const { data: profile } = await dbClient.from('profiles').select('settings').eq('id', currentUser.id).single();
        if (profile && profile.settings) {
            userSettings = { ...userSettings, ...profile.settings };
        }
    }

    // Apply Select dropdowns
    document.querySelectorAll('.db-setting').forEach(select => {
        const key = select.getAttribute('data-key');
        if (userSettings[key] !== undefined) select.value = userSettings[key];
    });

    // Apply Segmented Buttons & Theme Preview Boxes
    document.querySelectorAll('.db-setting-btn').forEach(btn => {
        const key = btn.getAttribute('data-key');
        const val = btn.getAttribute('data-val');
        
        // Remove active class from siblings
        if (userSettings[key] === val) {
            const siblings = document.querySelectorAll(`.db-setting-btn[data-key="${key}"]`);
            siblings.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
        }
    });

    // Apply Toggles
    document.querySelectorAll('.db-setting-toggle').forEach(toggle => {
        const key = toggle.getAttribute('data-key');
        if (userSettings[key] !== undefined) toggle.checked = userSettings[key];
    });
    
    lucide.createIcons();
}

// Attach Event Listeners to Settings Controls
document.querySelectorAll('.db-setting').forEach(select => {
    select.addEventListener('change', (e) => {
        saveSettingToDB(e.target.getAttribute('data-key'), e.target.value);
    });
});

document.querySelectorAll('.db-setting-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const el = e.currentTarget;
        const key = el.getAttribute('data-key');
        const val = el.getAttribute('data-val');
        
        // UI Update: swap active class
        document.querySelectorAll(`.db-setting-btn[data-key="${key}"]`).forEach(s => s.classList.remove('active'));
        el.classList.add('active');

        // Note: Because the Theme has a separate preview box, update both places
        if(key === 'theme') {
            document.querySelectorAll(`.theme-box`).forEach(box => box.classList.remove('active'));
            document.querySelector(`.theme-box[data-val="${val}"]`).classList.add('active');
        }

        saveSettingToDB(key, val);
    });
});

document.querySelectorAll('.db-setting-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
        saveSettingToDB(e.target.getAttribute('data-key'), e.target.checked);
    });
});

// Wire up Log Out Button in Settings
document.getElementById('btn-settings-logout')?.addEventListener('click', () => {
    document.getElementById('btn-logout').click(); // Re-use the existing secure logout logic
});

// Hook into router to load data when settings tab is opened
document.querySelector('[data-view="settings"]')?.addEventListener('click', loadSettingsUI);

// =========================================
// 17. GAMIFICATION & ACHIEVEMENTS ENGINE
// =========================================

let achDonutChartInstance = null;

// The Master List of all possible achievements in the app
const achievementDatabase = [
    { id: 'streak_3', title: 'Getting Started', desc: 'Study for 3 consecutive days', category: 'Consistency', req: 3, type: 'streak', icon: 'flame', color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'streak_7', title: 'Consistent Learner', desc: 'Maintain a 7-day study streak', category: 'Consistency', req: 7, type: 'streak', icon: 'calendar', color: '#3B82F6', bg: '#EFF6FF' },
    { id: 'streak_14', title: 'Dedicated Learner', desc: 'Study for 14 days in a row', category: 'Consistency', req: 14, type: 'streak', icon: 'star', color: '#8B5CF6', bg: '#F5F3FF' },
    
    { id: 'quiz_1', title: 'First Quiz', desc: 'Complete your first quiz', category: 'Quizzes', req: 1, type: 'quizzes', icon: 'help-circle', color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'quiz_10', title: 'Quiz Master', desc: 'Complete 10 quizzes', category: 'Quizzes', req: 10, type: 'quizzes', icon: 'award', color: '#8B5CF6', bg: '#F5F3FF' },
    
    { id: 'note_1', title: 'Note Taker', desc: 'Create your first smart note', category: 'Learning', req: 1, type: 'notes', icon: 'file-text', color: '#10B981', bg: '#ECFDF5' },
    { id: 'note_5', title: 'Note Ninja', desc: 'Create 5 high-quality notes', category: 'Learning', req: 5, type: 'notes', icon: 'book-open', color: '#10B981', bg: '#ECFDF5' },
    
    { id: 'xp_500', title: 'Rising Star', desc: 'Earn 500 total XP', category: 'Productivity', req: 500, type: 'xp', icon: 'zap', color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'xp_2000', title: 'Knowledge Seeker', desc: 'Earn 2,000 total XP', category: 'Productivity', req: 2000, type: 'xp', icon: 'target', color: '#F59E0B', bg: '#FFFBEB' }
];

async function loadAchievementsData() {
    if (!dbClient || !currentUser) return;

    // 1. Fetch Real User Data from Supabase
    const { data: profile } = await dbClient.from('profiles').select('*').eq('id', currentUser.id).single();
    const { count: noteCount } = await dbClient.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
    
    // Default values if empty
    const userStats = {
        streak: profile?.study_streak || 0,
        quizzes: profile?.quizzes_solved || 0,
        notes: noteCount || 0,
        xp: profile?.xp_earned || 0
    };

    // 2. Process Achievements based on fetched data
    let unlockedCount = 0;
    let inProgressCount = 0;
    const catCounts = { Learning: 0, Quizzes: 0, Consistency: 0, Productivity: 0 };
    
    // Build the dynamic list UI
    const listUI = document.getElementById('ach-recent-list');
    listUI.innerHTML = ''; // Clear loading

    // Determine the next milestone dynamically (first uncompleted streak badge)
    let nextMilestone = null;

    achievementDatabase.forEach((ach) => {
        const userProgress = userStats[ach.type];
        const isCompleted = userProgress >= ach.req;
        
        if (isCompleted) {
            unlockedCount++;
            catCounts[ach.category]++;
        } else if (userProgress > 0) {
            inProgressCount++;
        }

        // Find Next Milestone (prioritize streaks)
        if (!isCompleted && ach.type === 'streak' && !nextMilestone) {
            nextMilestone = ach;
        }

        // Generate the List Row UI
        let statusBadge = '';
        if (isCompleted) {
            statusBadge = `<span class="status-badge completed">Completed</span>`;
        } else if (userProgress > 0) {
            statusBadge = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size: 11px; font-weight: 600; color: var(--primary);">${userProgress} / ${ach.req}</span>
                    <span class="status-badge progress">In Progress</span>
                </div>`;
        } else {
            statusBadge = `<span class="status-badge locked">Locked</span>`;
        }

        listUI.innerHTML += `
            <div class="ach-list-row gs-ach-anim">
                <div class="ach-cat-icon" style="color: ${ach.color}; background: ${ach.bg}; border-radius: 50%;">
                    <i data-lucide="${ach.icon}"></i>
                </div>
                <div class="ach-list-text">
                    <h4>${ach.title}</h4>
                    <p>${ach.desc}</p>
                </div>
                ${statusBadge}
            </div>
        `;
    });

    // 3. Update the Top Dashboard Stats
    document.getElementById('ach-total-unlocked').innerText = unlockedCount;
    document.getElementById('ach-total-xp').innerText = userStats.xp.toLocaleString();
    document.getElementById('ach-quizzes').innerText = userStats.quizzes;
    document.getElementById('ach-max-streak').innerText = userStats.streak;

    // 4. Update Categories Progress
    const updateCat = (id, count, max) => {
        document.getElementById(`cat-${id}-val`).innerText = count;
        gsap.to(`#cat-${id}-bar`, { width: `${(count/max)*100}%`, duration: 1, ease: 'power2.out' });
    };
    updateCat('learn', catCounts.Learning, 12);
    updateCat('quiz', catCounts.Quizzes, 10);
    updateCat('cons', catCounts.Consistency, 10);
    updateCat('prod', catCounts.Productivity, 8);

    // 5. Update Next Milestone Card
    if (nextMilestone) {
        document.getElementById('next-ms-title').innerText = nextMilestone.title;
        document.getElementById('next-ms-desc').innerText = nextMilestone.desc;
        document.getElementById('next-ms-val').innerText = `${userStats[nextMilestone.type]} / ${nextMilestone.req} ${nextMilestone.type}`;
        gsap.to('#next-ms-bar', { width: `${(userStats[nextMilestone.type] / nextMilestone.req) * 100}%`, duration: 1.5, ease: 'power2.out', delay: 0.5 });
    }

    // 6. Draw the Chart.js Donut
    renderAchievementDonut(unlockedCount, inProgressCount, achievementDatabase.length - unlockedCount - inProgressCount);

    // Re-initialize icons and run entrance animations
    lucide.createIcons();
    gsap.fromTo('.gs-ach-anim', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.2)" });
}

function renderAchievementDonut(completed, inProgress, locked) {
    const total = completed + inProgress + locked;
    
    // Update Text Labels
    document.getElementById('ach-don-comp').innerText = `${completed} (${Math.round((completed/total)*100)}%)`;
    document.getElementById('ach-don-prog').innerText = `${inProgress} (${Math.round((inProgress/total)*100)}%)`;
    document.getElementById('ach-don-lock').innerText = `${locked} (${Math.round((locked/total)*100)}%)`;
    
    const overallPct = Math.round((completed / total) * 100);
    document.getElementById('ach-overall-pct').innerText = `${overallPct}%`;
    gsap.to('#ach-overall-bar', { width: `${overallPct}%`, duration: 1.5, ease: 'power2.out', delay: 0.5 });

    // Chart.js Magic
    const ctx = document.getElementById('achievementsDonut').getContext('2d');
    if (achDonutChartInstance) achDonutChartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    achDonutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Locked'],
            datasets: [{
                data: [completed, inProgress, locked],
                backgroundColor: ['#10B981', '#3B82F6', isDark ? '#334155' : '#E2E8F0'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '75%', // Makes the donut thin
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1E293B' : '#0F172A',
                    titleFont: { family: "'Inter', sans-serif" },
                    bodyFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            animation: { animateScale: true, animateRotate: true, duration: 1500, easing: 'easeOutQuart' }
        }
    });
}

// Hook into Dashboard Router to fetch data when tab is opened
document.querySelector('[data-view="achievements"]')?.addEventListener('click', () => {
    // Slight delay so the DOM is visible before Chart.js attempts to draw
    setTimeout(loadAchievementsData, 50); 
});
// =========================================
// 18. AI ZEN MODE (POSTURE & PHONE)
// =========================================
let isMonitoring = false;
let webcamElement = document.getElementById('webcam');
let canvasElement = document.getElementById('canvas-overlay');
let canvasCtx = canvasElement.getContext('2d');

// Thresholds
const SLOUCH_THRESHOLD = 0.15; // Vertical distance check

async function initZenMode() {
    const btnStart = document.getElementById('btn-start-monitor');
    const btnStop = document.getElementById('btn-stop-monitor');
    const warningUI = document.getElementById('focus-warning');

    // Load MediaPipe Models
    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5 });

    // Detection Handler
    pose.onResults((results) => {
        if (!results.poseLandmarks) return;

        // Clear and draw overlay
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // --- 1. POSTURE LOGIC ---
        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const nose = results.poseLandmarks[0];

        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const postureDiff = shoulderY - nose.y;

        const postureStatus = document.getElementById('posture-status');
        const postureBar = document.getElementById('posture-bar');

        if (postureDiff < SLOUCH_THRESHOLD) {
            postureStatus.innerText = "Slouching!";
            postureStatus.style.color = "#EF4444";
            postureBar.style.width = "40%";
            postureBar.style.background = "#EF4444";
        } else {
            postureStatus.innerText = "Excellent";
            postureStatus.style.color = "#10B981";
            postureBar.style.width = "95%";
            postureBar.style.background = "#10B981";
        }

        // --- 2. PHONE DISTRACTION (Heuristic for this version) ---
        // For actual Phone Detection, we'd loop results through COCO-SSD
        // For SAGE's quick demo, we detect if hands are raised near the face
        const leftWrist = results.poseLandmarks[15];
        const rightWrist = results.poseLandmarks[16];

        if (leftWrist.y < shoulderY || rightWrist.y < shoulderY) {
            document.getElementById('phone-status').innerText = "Detected";
            warningUI.style.display = 'flex';
        } else {
            document.getElementById('phone-status').innerText = "None";
            warningUI.style.display = 'none';
        }
    });

    btnStart.addEventListener('click', async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamElement.srcObject = stream;
        isMonitoring = true;
        
        document.getElementById('ai-status-tag').innerHTML = `<i data-lucide="zap" class="animate-spin"></i> AI Active`;
        document.getElementById('ai-status-tag').style.background = "var(--primary-light)";
        document.getElementById('ai-status-tag').style.color = "var(--primary)";
        lucide.createIcons();

        // Start processing loop
        const camera = new Camera(webcamElement, {
            onFrame: async () => {
                await pose.send({image: webcamElement});
            },
            width: 640, height: 480
        });
        camera.start();
    });

    btnStop.addEventListener('click', () => {
        const stream = webcamElement.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        isMonitoring = false;
        location.reload(); // Hard reset for the camera stream
    });
}

// Hook into router
document.querySelector('[data-view="focus"]').addEventListener('click', () => {
    setTimeout(initZenMode, 100);
});
// =========================================
// 19. PROFILE EDITING SYSTEM
// =========================================
const profileModal = document.getElementById('profile-modal');
const btnCloseProfile = document.getElementById('btn-close-profile');
const btnCancelProfile = document.getElementById('btn-cancel-profile');
const btnSaveProfile = document.getElementById('btn-save-profile');
const avatarUpload = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('profile-avatar-preview');
const btnChangeAvatar = document.getElementById('btn-change-avatar');

let pendingAvatarBase64 = null;

// 1. Open Modal and Load Data
document.getElementById('header-profile-pic')?.addEventListener('click', async () => {
    if (!currentUser || !dbClient) {
        showToast("Please log in first.", "error");
        return;
    }

    // Show a quick loading state
    const originalPic = document.getElementById('nav-profile-pic-img').src;
    avatarPreview.src = originalPic;
    
    try {
        // Fetch the absolute latest profile data from Supabase
        const { data: profile, error } = await dbClient.from('profiles').select('*').eq('id', currentUser.id).single();
        if (error) throw error;
        
        // Populate fields
        document.getElementById('edit-profile-name').value = profile?.full_name || '';
        document.getElementById('edit-profile-email').value = currentUser.email || '';
        document.getElementById('edit-profile-bio').value = profile?.bio || '';
        
        // Handle Avatar (Use DB avatar, or generate an initial-based one)
        if (profile?.avatar_url) {
            avatarPreview.src = profile.avatar_url;
        } else {
            const initials = (profile?.full_name || 'User').charAt(0).toUpperCase();
            avatarPreview.src = `https://ui-avatars.com/api/?name=${initials}&background=3B82F6&color=fff&bold=true`;
        }

        pendingAvatarBase64 = null; // Reset any pending uploads
        
        // Animate Modal In
        profileModal.classList.add('active');
        gsap.fromTo(profileModal.querySelector('.modal-content'), 
            { scale: 0.95, opacity: 0, y: 20 }, 
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
        );

    } catch (err) {
        console.error("Error fetching profile:", err);
        showToast("Could not load profile data.", "error");
    }
});

// 2. Close Modal Logic
const hideProfileModal = () => {
    gsap.to(profileModal.querySelector('.modal-content'), {
        scale: 0.95, opacity: 0, y: 10, duration: 0.2, 
        onComplete: () => profileModal.classList.remove('active')
    });
};

btnCloseProfile?.addEventListener('click', hideProfileModal);
btnCancelProfile?.addEventListener('click', hideProfileModal);

// 3. Handle Local Image Selection & Base64 Conversion
btnChangeAvatar?.addEventListener('click', () => avatarUpload.click());

avatarUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Safety check: Keep files under 2MB so we don't overload the database column
    if (file.size > 2 * 1024 * 1024) { 
        showToast("Image must be smaller than 2MB", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        pendingAvatarBase64 = event.target.result;
        avatarPreview.src = pendingAvatarBase64;
    };
    reader.readAsDataURL(file);
});

// 4. Save Changes to Supabase
btnSaveProfile?.addEventListener('click', async () => {
    const newName = document.getElementById('edit-profile-name').value.trim();
    const newBio = document.getElementById('edit-profile-bio').value.trim();

    if (!newName) {
        showToast("Name cannot be empty.", "error");
        return;
    }

    btnSaveProfile.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px;"></i> Saving...`;
    if (window.lucide) lucide.createIcons();

    try {
        const updateData = {
            full_name: newName,
            bio: newBio
        };

        // Inject the image string into the database payload if changed
        if (pendingAvatarBase64) {
            updateData.avatar_url = pendingAvatarBase64;
        }

        const { error } = await dbClient.from('profiles').update(updateData).eq('id', currentUser.id);
        if (error) throw error;

        showToast("Profile updated successfully!", "success");
        
        // Dynamically update the UI everywhere immediately
        document.getElementById('nav-user-name').innerText = newName;
        document.getElementById('settings-name').innerText = newName;
        document.getElementById('dash-welcome-text').innerText = `Good morning, ${newName.split(' ')[0]}! 👋`;
        
        const uiAvatarImg = document.getElementById('nav-profile-pic-img');
        if (updateData.avatar_url) {
            uiAvatarImg.src = updateData.avatar_url;
        } else if (!uiAvatarImg.src.startsWith('http')) {
             uiAvatarImg.src = `https://ui-avatars.com/api/?name=${newName.charAt(0)}&background=3B82F6&color=fff&bold=true`;
        }

        hideProfileModal();

    } catch (err) {
        console.error("Profile Update Error:", err);
        showToast("Failed to update profile.", "error");
    } finally {
        btnSaveProfile.innerText = "Save Changes";
    }
});
// =========================================
// 20. SMART YOUTUBE HUB & AI SUMMARIZER
// =========================================
const ytInput = document.getElementById('yt-topic-input');
const btnSearchYt = document.getElementById('btn-search-yt');
const ytGrid = document.getElementById('yt-recommendations');
const ytWorkspace = document.getElementById('yt-workspace');
const ytPlayer = document.getElementById('yt-player');
const ytSummaryContent = document.getElementById('yt-summary-content');
const btnCloseYtWorkspace = document.getElementById('btn-close-yt-workspace');
const btnSaveSummary = document.getElementById('btn-save-summary');

let currentVideoTitle = "";
let currentSummaryText = "";

async function fetchVideoRecommendations(topic) {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    if(window.showToast) showToast("Missing YouTube API Key!", "error");
    return [];
    }

    try {
        const searchQuery = encodeURIComponent(topic + " educational lecture tutorial");
        // Sending the search query to your secure backend instead
        const url = `/api/youtube?q=${searchQuery}`; 
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("YouTube API Error");
        
        const data = await response.json();
        
        return data.items.map(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.snippet.title;
            const cleanTitle = tempDiv.textContent || tempDiv.innerText || "";

            return {
                id: item.id.videoId,
                title: cleanTitle,
                channel: item.snippet.channelTitle,
                date: new Date(item.snippet.publishedAt).toLocaleDateString()
            };
        });
    } catch (error) {
        console.error("YouTube Fetch Error:", error);
        if(window.showToast) showToast("Failed to fetch videos from YouTube.", "error");
        return [];
    }
}

// 2. Search & Render Grid
btnSearchYt?.addEventListener('click', async () => {
    const topic = ytInput.value.trim();
    if (!topic) {
        if(window.showToast) showToast("Please enter a topic first.", "error");
        return;
    }

    ytGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px; text-align: center; color: var(--text-gray);">
            <i data-lucide="loader" class="animate-spin" style="width: 48px; height: 48px; color: var(--primary); margin-bottom: 16px;"></i>
            <h3>Searching YouTube for the best "${topic}" videos...</h3>
        </div>
    `;
    if(window.lucide) lucide.createIcons();

    const videos = await fetchVideoRecommendations(topic);
    
    if (videos.length === 0) {
        ytGrid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #EF4444; border: 1px dashed #EF4444; border-radius: 16px;">
                <h3>No videos found, or API Key is missing.</h3>
            </div>
        `;
        return;
    }

    ytGrid.innerHTML = ''; 

    videos.forEach((vid) => {
        const card = document.createElement('div');
        card.className = 'yt-card gs-yt-anim';
        card.innerHTML = `
            <div class="yt-thumbnail-wrap">
                <img src="https://img.youtube.com/vi/${vid.id}/maxresdefault.jpg" class="yt-thumbnail" onerror="this.src='https://img.youtube.com/vi/${vid.id}/hqdefault.jpg'">
                <div class="yt-play-overlay"><div class="yt-play-btn"><i data-lucide="play" style="width: 20px; fill: white;"></i></div></div>
            </div>
            <div style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
                <h4 style="font-size: 14px; color: var(--text-dark); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${vid.title}</h4>
                <div style="margin-top: auto; font-size: 12px; color: var(--text-gray); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500; color: var(--primary);"><i data-lucide="user" style="width: 12px; display: inline-block; margin-right: 4px;"></i>${vid.channel}</span>
                    <span>${vid.date}</span>
                </div>
            </div>
        `;
        
        // This is where it attaches the function to the click!
        card.addEventListener('click', () => openSummarizer(vid));
        ytGrid.appendChild(card);
    });

    if(window.lucide) lucide.createIcons();
    gsap.fromTo('.gs-yt-anim', { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" });
});

// =========================================
// 10.5 AI WEB QUIZ DISCOVER SYSTEM
// =========================================
const btnDiscoverQuizzes = document.getElementById('btn-discover-quizzes');
const discoverPanel = document.getElementById('quiz-discover-panel');
const btnCloseDiscover = document.getElementById('btn-close-discover');
const btnGenerateWebQuiz = document.getElementById('btn-generate-web-quiz');
const discoverTopicInput = document.getElementById('discover-quiz-topic');
const discoverResult = document.getElementById('discover-quiz-result');

// 1. Toggle Discover Panel
btnDiscoverQuizzes?.addEventListener('click', () => {
    const isHidden = discoverPanel.style.display === 'none' || discoverPanel.style.display === '';
    
    if (isHidden) {
        discoverPanel.style.display = 'block';
        gsap.fromTo(discoverPanel, 
            { opacity: 0, y: -20, height: 0 }, 
            { opacity: 1, y: 0, height: 'auto', duration: 0.4, ease: "power2.out" }
        );
    } else {
        gsap.to(discoverPanel, {
            opacity: 0, y: -20, duration: 0.3,
            onComplete: () => discoverPanel.style.display = 'none'
        });
    }
});

btnCloseDiscover?.addEventListener('click', () => {
    gsap.to(discoverPanel, { opacity: 0, y: -20, duration: 0.3, onComplete: () => discoverPanel.style.display = 'none' });
});

// 2. Fetch/Generate Quiz from Web via Groq API
btnGenerateWebQuiz?.addEventListener('click', async () => {
    const topic = discoverTopicInput.value.trim();
    if (!topic) {
        if(window.showToast) showToast("Please enter a topic to search for.", "error");
        return;
    }

    

    // Loading UI
    discoverResult.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-gray);">
            <i data-lucide="loader" class="animate-spin" style="width: 32px; height: 32px; color: var(--primary); margin-bottom: 12px;"></i>
            <p>SAGE is compiling a quiz on "${topic}" from web sources...</p>
        </div>
    `;
    if(window.lucide) lucide.createIcons();
    btnGenerateWebQuiz.disabled = true;

    try {
        const prompt = `Generate a high-quality, 5-question multiple-choice quiz about "${topic}". 
        Respond ONLY with a valid JSON array of objects. Do not include markdown formatting, backticks, or conversational text.
        Each object must have these exactly keys:
        - "question" (string)
        - "options" (array of 4 strings)
        - "correct_index" (integer 0 to 3 representing the index of the correct option).`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5
            })
        });

        if (!response.ok) throw new Error("Failed to contact API.");

        const data = await response.json();
        let aiReply = data.choices[0].message.content;
        
        // Clean JSON string (remove markdown blocks if AI includes them)
        aiReply = aiReply.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let parsedQuestions = JSON.parse(aiReply);
        
        // Failsafe format check
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error("Invalid format received from web.");
        }

        // Create a dynamic quiz object compatible with our existing player
        const fetchedQuizData = {
            id: 'web-' + Date.now(), // Temp ID
            title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Master Quiz`,
            questions: parsedQuestions,
            isWebQuiz: true // Flag to handle saving differently
        };

        // Render the fetched quiz card with GSAP animation
        discoverResult.innerHTML = `
            <div class="card interactive-card gs-web-quiz-anim" style="display: flex; justify-content: space-between; align-items: center; border-color: var(--primary); background: var(--bg-white);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; background: #EFF6FF; color: #3B82F6; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="check-square" style="width: 24px;"></i>
                    </div>
                    <div>
                        <h4 style="font-size: 16px; color: var(--text-dark);">${fetchedQuizData.title}</h4>
                        <p style="font-size: 13px; color: var(--text-gray);"><i data-lucide="globe" style="width: 12px; display: inline-block; margin-right: 4px;"></i>Fetched from Web • 5 Questions</p>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-start-web-quiz">Start Quiz Now <i data-lucide="arrow-right" style="width: 16px;"></i></button>
            </div>
        `;
        if(window.lucide) lucide.createIcons();

        gsap.fromTo('.gs-web-quiz-anim', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" });

        // Wire up the start button to the existing Quiz Player
        document.getElementById('btn-start-web-quiz').addEventListener('click', () => {
            // Close the discover panel neatly
            discoverPanel.style.display = 'none';
            // Start the quiz using your existing function!
            if(typeof startQuiz === 'function') startQuiz(fetchedQuizData);
        });

    } catch (err) {
        console.error("Web Quiz Error:", err);
        discoverResult.innerHTML = `<p style="color: #EF4444; text-align: center; padding: 12px;">Failed to compile quiz. Please try a different topic.</p>`;
    } finally {
        btnGenerateWebQuiz.disabled = false;
    }
});
// =========================================
// DEEP WORK & POMODORO ENGINE
// =========================================

// --- Variables ---
let pomoInterval;
let pomoTimeLeft = 25 * 60; // Default 25 mins
let pomoTotalDuration = 25 * 60;
let isPomoRunning = false;
let currentPomoMode = 'Deep Work'; // Category for database
let sessionsCompletedToday = 0;
let minutesFocusedToday = 0;

// --- DOM Elements ---
const pomoDisplay = document.getElementById('pomo-time-display');
const pomoSvgCircle = document.getElementById('pomo-svg-circle');
const btnPomoStart = document.getElementById('btn-pomo-start');
const btnPomoReset = document.getElementById('btn-pomo-reset');
const pomoStatusText = document.getElementById('pomo-status-text');
const pomoModeBtns = document.querySelectorAll('.pomo-mode-btn');
const ambientCards = document.querySelectorAll('.ambient-sound-card');

const svgCircumference = 2 * Math.PI * 130; // ~816

// --- Audio Objects (Royalty Free Ambient Sources) ---
const ambientAudio = {
    rain: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3'),
    forest: new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde807.mp3'),
    cafe: new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3'),
    waves: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3')
};
// Set them all to loop
Object.values(ambientAudio).forEach(audio => {
    audio.loop = true;
    audio.volume = 0.5; // Start at 50% volume
});

// --- Formatting & UI ---
function updatePomoDisplay() {
    const minutes = Math.floor(pomoTimeLeft / 60);
    const seconds = pomoTimeLeft % 60;
    pomoDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update SVG Circle
    const offset = svgCircumference - (pomoTimeLeft / pomoTotalDuration) * svgCircumference;
    pomoSvgCircle.style.strokeDashoffset = offset;
}

// --- Mode Switching ---
pomoModeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (isPomoRunning) return showToast("Pause the timer first to switch modes.", "info");

        // UI Update
        pomoModeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Logic Update
        const minutes = parseInt(e.target.getAttribute('data-time'));
        currentPomoMode = e.target.getAttribute('data-mode') === 'Pomodoro' ? 'Deep Work' : 'Break';
        pomoTotalDuration = minutes * 60;
        pomoTimeLeft = pomoTotalDuration;
        updatePomoDisplay();
        pomoStatusText.innerText = `Mode: ${e.target.getAttribute('data-mode')}`;
    });
});

// --- Timer Logic ---
function startTimer() {
    if (isPomoRunning) return;
    isPomoRunning = true;
    btnPomoStart.innerHTML = `<i data-lucide="pause"></i> Pause`;
    pomoStatusText.innerText = "Focusing...";
    lucide.createIcons();

    // Give it a tiny visual pop using GSAP
    gsap.to('#pomo-time-display', { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });

    pomoInterval = setInterval(() => {
        pomoTimeLeft--;
        updatePomoDisplay();

        if (pomoTimeLeft <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isPomoRunning = false;
    clearInterval(pomoInterval);
    btnPomoStart.innerHTML = `<i data-lucide="play"></i> Resume`;
    pomoStatusText.innerText = "Paused";
    lucide.createIcons();
}

function resetTimer() {
    pauseTimer();
    pomoTimeLeft = pomoTotalDuration;
    btnPomoStart.innerHTML = `<i data-lucide="play"></i> Start`;
    pomoStatusText.innerText = "Ready to focus?";
    updatePomoDisplay();
    lucide.createIcons();
}

// --- Completion & Database Saving ---
async function completeTimer() {
    pauseTimer();
    showToast("Session complete! Great job.", "success");
    
    // Play a ding sound
    const ding = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3');
    ding.play();

    // If it was a work session, log it and save to Supabase
    if (currentPomoMode === 'Deep Work') {
        const sessionMinutes = Math.round(pomoTotalDuration / 60);
        sessionsCompletedToday++;
        minutesFocusedToday += sessionMinutes;
        
        // Update Local UI
        document.getElementById('pomo-stat-sessions').innerText = sessionsCompletedToday;
        document.getElementById('pomo-stat-minutes').innerText = `${minutesFocusedToday} min`;

        // 🚀 PUSH TO SUPABASE DATABASE
        if (dbClient && currentUser) {
            try {
                const hours = sessionMinutes / 60; // Convert to hours for your existing progress chart
                const { error } = await dbClient.from('study_sessions').insert([{
                    user_id: currentUser.id,
                    duration_hours: hours,
                    category: 'Deep Work' // Or 'Theory' / 'Coding' based on what they are doing
                }]);
                
                if (error) throw error;
                
                // Fetch the dashboard data silently to update the Progress & Donut charts!
                if(typeof fetchDashboardData === 'function') fetchDashboardData();
                if(typeof loadProgressData === 'function') loadProgressData();
                
            } catch (err) {
                console.error("Failed to save session:", err);
                showToast("Failed to sync session to database.", "error");
            }
        }
    }

    // Auto-switch back to 25 mins or Break
    pomoTimeLeft = pomoTotalDuration; 
    updatePomoDisplay();
}

// --- Button Listeners ---
btnPomoStart?.addEventListener('click', () => {
    if (isPomoRunning) pauseTimer();
    else startTimer();
});

btnPomoReset?.addEventListener('click', resetTimer);

// --- Ambient Sound Toggles ---
ambientCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const soundType = e.currentTarget.getAttribute('data-sound');
        const audioEl = ambientAudio[soundType];
        
        if (e.currentTarget.classList.contains('active')) {
            // Turn Off
            e.currentTarget.classList.remove('active');
            gsap.to(audioEl, { volume: 0, duration: 1, onComplete: () => audioEl.pause() });
        } else {
            // Turn On
            e.currentTarget.classList.add('active');
            audioEl.volume = 0;
            audioEl.play();
            gsap.to(audioEl, { volume: 0.5, duration: 1 });
        }
    });
});

// Initialize Display on Load
updatePomoDisplay();
