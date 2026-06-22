let currentPlan = '';
let currentFrom = '';
let currentTo   = '';

// ── Scroll to planner ──────────────────────
function scrollToPlanner() {
  document.getElementById('planner')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Show toast ─────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Fill Preset ────────────────────────────
function fillPreset(from, to, days, style) {
  document.getElementById('from').value  = from;
  document.getElementById('to').value    = to;
  document.getElementById('days').value  = days;
  document.getElementById('style').value = style;
  scrollToPlanner();
}

// ── Get selected budget ────────────────────
function getSelectedBudget() {
  const selected = document.querySelector('input[name="budget"]:checked');
  return selected ? selected.value : 'mid (₹500–₹1500)';
}

// ── Plan Trip ──────────────────────────────
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

  currentFrom = from;
  currentTo   = to;

  showLoading(true);
  hideError();
  hideResult();

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

// ── Section config ─────────────────────────
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

// ── Clean whitespace ───────────────────────
function cleanText(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

// ── Parse plan into sections ───────────────
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

// ── Render sections ────────────────────────
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

// ── Format content per section ─────────────
function formatContent(content, sectionKey) {
  if (!content) return '';

  if (sectionKey === '📲 WHATSAPP SUMMARY') {
    return `<div class="whatsapp-box">${content}</div>`;
  }

  if (sectionKey === '💰 BUDGET BREAKDOWN') {
    return content.split('\n').filter(l => l.trim()).map(line => {
      const isTotal = line.toLowerCase().includes('total');
      return `<div class="budget-line ${isTotal ? 'budget-line--total' : ''}">
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

// ── Update map ─────────────────────────────
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

// ── Show Result ────────────────────────────
function showResult(from, to, days, style, budget, plan) {
  document.getElementById('trip-route').textContent = `${from} → ${to}`;
  document.getElementById('trip-meta').textContent =
    `${days} Day${days > 1 ? 's' : ''} · ${style} · ${budget}`;

  document.getElementById('trip-plan').innerHTML = renderPlan(plan);
  updateMap(from, to);

  document.getElementById('result-section').classList.add('visible');
  document.getElementById('result-section')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Copy Plan ──────────────────────────────
function copyPlan() {
  if (!currentPlan) return;
  navigator.clipboard.writeText(currentPlan).then(() => {
    showToast('✅ Plan copied to clipboard!');
  });
}

// ── Share on WhatsApp ──────────────────────
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

// ── New Trip ───────────────────────────────
function newTrip() {
  hideResult();
  document.getElementById('route-map').src = '';
  scrollToPlanner();
}

// ── Helpers ────────────────────────────────
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