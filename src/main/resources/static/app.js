// ══════════════════════════════════════════
// TRIPBHARAT — app.js
// ══════════════════════════════════════════

// ── State ──────────────────────────────────
let currentPlan = '';
let currentFrom = '';
let currentTo   = '';
let currentDays = 0;
let currentStyle  = '';
let currentBudget = '';

// ── Auth State ─────────────────────────────
let authToken = localStorage.getItem('token')   || null;
let authName  = localStorage.getItem('name')    || null;
let authEmail = localStorage.getItem('email')   || null;

// ── On Page Load ───────────────────────────
window.addEventListener('load', () => {
    // Check if user is already logged in
    if (authToken) {
        updateAuthUI(authName, authEmail);
    }
});

// ══════════════════════════════════════════
// AUTH UI
// ══════════════════════════════════════════

function updateAuthUI(name, email) {
    // Show logged-in state in navbar
    document.getElementById('nav-logged-out').style.display = 'none';
    document.getElementById('nav-logged-in').style.display  = 'flex';

    // Set avatar to first letter of name
    const avatar = document.getElementById('nav-avatar');
    if (avatar && name) {
        avatar.textContent = name.charAt(0).toUpperCase();
    }
}

function logout() {
    // Clear all stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    authToken = null;
    authName  = null;
    authEmail = null;

    // Show logged-out state in navbar
    document.getElementById('nav-logged-out').style.display = 'flex';
    document.getElementById('nav-logged-in').style.display  = 'none';

    showToast('Logged out successfully');
}

// ══════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════

function openModal(tab = 'login') {
    document.getElementById('modal-overlay').classList.add('visible');
    document.getElementById('modal').classList.add('visible');
    switchTab(tab);

    // Focus first input
    setTimeout(() => {
        const input = tab === 'login'
            ? document.getElementById('login-email')
            : document.getElementById('register-name');
        if (input) input.focus();
    }, 100);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
    document.getElementById('modal').classList.remove('visible');
    clearModalErrors();
}

function switchTab(tab) {
    // Update tab buttons
    document.getElementById('tab-login')
        .classList.toggle('active', tab === 'login');
    document.getElementById('tab-register')
        .classList.toggle('active', tab === 'register');

    // Show correct form
    document.getElementById('form-login').style.display =
        tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display =
        tab === 'register' ? 'block' : 'none';

    clearModalErrors();
}

function clearModalErrors() {
    document.getElementById('login-error').textContent    = '';
    document.getElementById('register-error').textContent = '';
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════

async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl  = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    // Validate
    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        return;
    }

    // Loading state
    btn.disabled    = true;
    btn.textContent = 'Logging in...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store auth data
            authToken = data.token;
            authName  = data.name;
            authEmail = data.email;
            localStorage.setItem('token', authToken);
            localStorage.setItem('name',  authName);
            localStorage.setItem('email', authEmail);

            // Update UI
            updateAuthUI(authName, authEmail);
            closeModal();
            showToast('Welcome back, ' + authName + '! 👋');

            // If user was trying to save a trip — save it now
            if (currentPlan) {
                setTimeout(() => saveTripToServer(), 500);
            }

        } else {
            errorEl.textContent = data.message || 'Login failed.';
        }

    } catch (err) {
        errorEl.textContent = 'Could not connect. Is the server running?';
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Login';
    }
}

// ══════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════

async function handleRegister() {
    const name     = document.getElementById('register-name').value.trim();
    const email    = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const errorEl  = document.getElementById('register-error');
    const btn      = document.getElementById('register-btn');

    // Validate
    if (!name || !email || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        return;
    }

    // Loading state
    btn.disabled    = true;
    btn.textContent = 'Creating account...';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store auth data
            authToken = data.token;
            authName  = data.name;
            authEmail = data.email;
            localStorage.setItem('token', authToken);
            localStorage.setItem('name',  authName);
            localStorage.setItem('email', authEmail);

            // Update UI
            updateAuthUI(authName, authEmail);
            closeModal();
            showToast('Welcome to TripBharat, ' + authName + '! 🎉');

            // If user was trying to save a trip — save it now
            if (currentPlan) {
                setTimeout(() => saveTripToServer(), 500);
            }

        } else {
            errorEl.textContent = data.message || 'Registration failed.';
        }

    } catch (err) {
        errorEl.textContent = 'Could not connect. Is the server running?';
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Create Account';
    }
}

// ══════════════════════════════════════════
// SAVE TRIP
// ══════════════════════════════════════════

function saveTrip() {
    // If not logged in — open login modal first
    if (!authToken) {
        showToast('Please login to save trips');
        openModal('login');
        return;
    }

    // If no plan generated yet
    if (!currentPlan) {
        showToast('Generate a trip plan first!');
        return;
    }

    saveTripToServer();
}

async function saveTripToServer() {
    try {
        const response = await fetch('/api/trips/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({
                fromCity: currentFrom,
                toCity:   currentTo,
                days:     currentDays,
                style:    currentStyle,
                budget:   currentBudget,
                plan:     currentPlan
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('✅ Trip saved successfully!');

            // Update save button to show saved state
            const saveBtn = document.querySelector('.action-btn--save');
            if (saveBtn) {
                saveBtn.textContent = '✅ Saved!';
                saveBtn.disabled    = true;
            }
        } else {
            showToast('⚠️ ' + (data.message || 'Could not save trip'));
        }

    } catch (err) {
        showToast('Could not save trip. Try again.');
    }
}

// ══════════════════════════════════════════
// SAVED TRIPS PANEL
// ══════════════════════════════════════════

async function openSavedTrips() {
    // Open panel
    document.getElementById('panel-overlay').classList.add('visible');
    document.getElementById('saved-panel').classList.add('open');

    // Load trips
    await loadSavedTrips();
}

function closeSavedTrips() {
    document.getElementById('panel-overlay').classList.remove('visible');
    document.getElementById('saved-panel').classList.remove('open');
}

async function loadSavedTrips() {
    const body = document.getElementById('saved-panel-body');
    body.innerHTML = '<div class="saved-empty">Loading your trips...</div>';

    try {
        const response = await fetch('/api/trips', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        const trips = await response.json();

        if (!trips || trips.length === 0) {
            body.innerHTML =
                '<div class="saved-empty">' +
                'No saved trips yet.<br/>Plan a trip and save it!' +
                '</div>';
            return;
        }

        // Render trip cards
        body.innerHTML = trips.map(trip => `
            <div class="saved-trip-card" id="trip-card-${trip.id}">
                <button class="saved-trip-card__delete-icon"
                    onclick="deleteTrip(${trip.id})"
                    title="Delete trip">🗑️</button>
                <div class="saved-trip-card__route">
                    ${trip.fromCity} → ${trip.toCity}
                </div>
                <div class="saved-trip-card__meta">
                    ${trip.days} Day${trip.days > 1 ? 's' : ''}
                    · ${trip.style}
                    · ${trip.budget}
                    · Saved ${formatDate(trip.savedAt)}
                </div>
                <div class="saved-trip-card__actions">
                    <button class="saved-trip-card__btn
                        saved-trip-card__btn--view"
                        onclick="viewSavedTrip(${trip.id})">
                        View Plan
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        body.innerHTML =
            '<div class="saved-empty">Could not load trips.</div>';
    }
}

async function deleteTrip(tripId) {
    if (!confirm('Delete this saved trip?')) return;

    try {
        const response = await fetch('/api/trips/' + tripId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.ok) {
            // Remove card from UI
            const card = document.getElementById('trip-card-' + tripId);
            if (card) card.remove();
            showToast('Trip deleted');

            // Show empty state if no trips left
            const body = document.getElementById('saved-panel-body');
            if (body.children.length === 0) {
                body.innerHTML =
                    '<div class="saved-empty">' +
                    'No saved trips yet.' +
                    '</div>';
            }
        }
    } catch (err) {
        showToast('Could not delete trip. Try again.');
    }
}

async function viewSavedTrip(tripId) {
    try {
        const response = await fetch('/api/trips', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        const trips  = await response.json();
        const trip   = trips.find(t => t.id === tripId);
        if (!trip) return;

        // Close panel and show the plan
        closeSavedTrips();

        // Fill in the form fields
        document.getElementById('from').value  = trip.fromCity;
        document.getElementById('to').value    = trip.toCity;
        document.getElementById('days').value  = trip.days;

        // Show the trip plan
        currentPlan   = trip.plan;
        currentFrom   = trip.fromCity;
        currentTo     = trip.toCity;
        currentDays   = trip.days;
        currentStyle  = trip.style;
        currentBudget = trip.budget;

        showResult(
            trip.fromCity,
            trip.toCity,
            trip.days,
            trip.style,
            trip.budget,
            trip.plan
        );

        // Mark save button as already saved
        const saveBtn = document.querySelector('.action-btn--save');
        if (saveBtn) {
            saveBtn.textContent = '✅ Saved!';
            saveBtn.disabled    = true;
        }

    } catch (err) {
        showToast('Could not load trip. Try again.');
    }
}

// ══════════════════════════════════════════
// TRIP PLANNING
// ══════════════════════════════════════════

function scrollToPlanner() {
    document.getElementById('planner')
        .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function fillPreset(from, to, days, style) {
    document.getElementById('from').value  = from;
    document.getElementById('to').value    = to;
    document.getElementById('days').value  = days;
    document.getElementById('style').value = style;
    scrollToPlanner();
}

function getSelectedBudget() {
    const selected = document.querySelector('input[name="budget"]:checked');
    return selected ? selected.value : 'mid (₹500–₹1500)';
}

async function planTrip() {
    const from   = document.getElementById('from').value.trim();
    const to     = document.getElementById('to').value.trim();
    const days   = parseInt(document.getElementById('days').value);
    const style  = document.getElementById('style').value;
    const budget = getSelectedBudget();

    if (!from || !to) {
        showError('Please enter both From and To cities.');
        return;
    }
    if (!days || days < 1 || days > 14) {
        showError('Please enter a valid number of days (1–14).');
        return;
    }

    // Store current trip details
    currentFrom   = from;
    currentTo     = to;
    currentDays   = days;
    currentStyle  = style;
    currentBudget = budget;

    showLoading(true);
    hideError();
    hideResult();

    // Reset save button
    const saveBtn = document.querySelector('.action-btn--save');
    if (saveBtn) {
        saveBtn.textContent = '🔖 Save Trip';
        saveBtn.disabled    = false;
    }

    try {
        const response = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, days, style, budget })
        });

        const data = await response.json();

        if (data.success && data.plan) {
            currentPlan = data.plan;
            showResult(from, to, days, style, budget, data.plan);
        } else {
            showError(data.error || 'Something went wrong. Please try again.');
        }

    } catch (err) {
        showError('Could not connect to server. Is Spring Boot running?');
    } finally {
        showLoading(false);
    }
}

// ══════════════════════════════════════════
// RENDER PLAN
// ══════════════════════════════════════════

const SECTIONS = [
    { key: '🚗 ROUTE OVERVIEW',    icon: '🚗', label: 'Route Overview',    color: '#C1440E' },
    { key: '⛽ FUEL STOPS',         icon: '⛽', label: 'Fuel Stops',         color: '#F4A024' },
    { key: '🍽️ EAT ON THE WAY',    icon: '🍽️', label: 'Eat on the Way',    color: '#2D6A4F' },
    { key: '💎 HIDDEN GEMS',        icon: '💎', label: 'Hidden Gems',        color: '#7C3AED' },
    { key: '📅 DAY-WISE ITINERARY', icon: '📅', label: 'Day-wise Itinerary', color: '#1D4ED8' },
    { key: '💰 BUDGET BREAKDOWN',   icon: '💰', label: 'Budget Breakdown',   color: '#065F46' },
    { key: '⚠️ TRIP WARNINGS',      icon: '⚠️', label: 'Trip Warnings',      color: '#DC2626' },
    { key: '📲 WHATSAPP SUMMARY',   icon: '📲', label: 'WhatsApp Summary',   color: '#16A34A' },
];

function cleanText(text) {
    return text
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .trim();
}

function parsePlan(planText) {
    const cleaned  = cleanText(planText);
    const sections = [];

    SECTIONS.forEach((sec, i) => {
        const startIdx = cleaned.indexOf(sec.key);
        if (startIdx === -1) return;

        let endIdx = cleaned.length;
        for (let j = i + 1; j < SECTIONS.length; j++) {
            const nextIdx = cleaned.indexOf(SECTIONS[j].key);
            if (nextIdx !== -1 && nextIdx > startIdx) {
                endIdx = nextIdx;
                break;
            }
        }

        const content = cleaned
            .substring(startIdx + sec.key.length, endIdx)
            .replace(/\n{2,}/g, '\n')
            .trim();

        if (content) sections.push({ ...sec, content });
    });

    return sections;
}

function renderPlan(planText) {
    const sections = parsePlan(planText);
    if (sections.length === 0) {
        return `<pre class="plain-text">${cleanText(planText)}</pre>`;
    }
    return sections.map(sec => `
        <div class="plan-section">
            <div class="plan-section__header"
                 style="border-left-color: ${sec.color}">
                <span class="plan-section__icon">${sec.icon}</span>
                <span class="plan-section__label">${sec.label}</span>
            </div>
            <div class="plan-section__body">
                ${formatContent(sec.content, sec.key)}
            </div>
        </div>
    `).join('');
}

function formatContent(content, sectionKey) {
    if (!content) return '';

    if (sectionKey === '📲 WHATSAPP SUMMARY') {
        return `<div class="whatsapp-box">${content}</div>`;
    }

    if (sectionKey === '💰 BUDGET BREAKDOWN') {
        return content.split('\n').filter(l => l.trim()).map(line => {
            const isTotal = line.toLowerCase().includes('total');
            return `<div class="budget-line
                ${isTotal ? 'budget-line--total' : ''}">
                ${line.trim()}
            </div>`;
        }).join('');
    }

    if (sectionKey === '⚠️ TRIP WARNINGS') {
        return content.split('\n').filter(l => l.trim()).map(line =>
            `<div class="warning-line">${line.trim()}</div>`
        ).join('');
    }

    return content.split('\n').filter(l => l.trim()).map(line => {
        const t = line.trim();
        if (/^DAY\s*\d+/i.test(t)) {
            return `<div class="day-header">${t}</div>`;
        }
        if (t.startsWith('•') || t.startsWith('-') || t.startsWith('*')) {
            const clean = t.replace(/^[•\-\*]\s*/, '');
            return `<div class="bullet-line">
                <span class="bullet-dot">•</span>
                <span>${clean}</span>
            </div>`;
        }
        if (/^\d+\./.test(t)) {
            return `<div class="numbered-line">${t}</div>`;
        }
        return `<div class="text-line">${t}</div>`;
    }).join('');
}

// ══════════════════════════════════════════
// RESULT
// ══════════════════════════════════════════

function updateMap(from, to) {
    const origin      = encodeURIComponent(from + ', India');
    const destination = encodeURIComponent(to + ', India');
    const mapUrl =
        `https://www.google.com/maps/embed/v1/directions` +
        `?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg` +
        `&origin=${origin}` +
        `&destination=${destination}` +
        `&mode=driving` +
        `&language=en`;
    document.getElementById('route-map').src = mapUrl;
}

function showResult(from, to, days, style, budget, plan) {
    document.getElementById('trip-route').textContent = `${from} → ${to}`;
    document.getElementById('trip-meta').textContent  =
        `${days} Day${days > 1 ? 's' : ''} · ${style} · ${budget}`;

    document.getElementById('trip-plan').innerHTML = renderPlan(plan);
    updateMap(from, to);

    document.getElementById('result-section').classList.add('visible');
    document.getElementById('result-section')
        .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyPlan() {
    if (!currentPlan) return;
    navigator.clipboard.writeText(currentPlan).then(() => {
        showToast('✅ Plan copied to clipboard!');
    });
}

function shareWhatsApp() {
    if (!currentPlan) return;
    const text =
        `🚗 *${currentFrom} → ${currentTo} Road Trip Plan*\n\n` +
        `${currentPlan}\n\n` +
        `_Planned by TripBharat — India's AI Road Trip Planner_`;
    window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank'
    );
}

function newTrip() {
    hideResult();
    currentPlan = '';
    document.getElementById('route-map').src = '';
    scrollToPlanner();
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function showLoading(show) {
    const el  = document.getElementById('loading');
    const btn = document.getElementById('plan-btn');
    if (show) {
        el.classList.add('visible');
        btn.disabled = true;
        btn.querySelector('.plan-btn__text').textContent = '⏳ Planning...';
    } else {
        el.classList.remove('visible');
        btn.disabled = false;
        btn.querySelector('.plan-btn__text').textContent = '🗺️ Plan My Trip';
    }
}

function showError(msg) {
    document.getElementById('error-text').textContent = msg;
    document.getElementById('error-box').classList.add('visible');
    document.getElementById('error-box')
        .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    document.getElementById('error-box').classList.remove('visible');
}

function hideResult() {
    document.getElementById('result-section').classList.remove('visible');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}