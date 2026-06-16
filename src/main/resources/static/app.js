let currentPlan = '';
let currentFrom = '';
let currentTo   = '';

function fillPreset(from, to, days, style) {
  document.getElementById('from').value  = from;
  document.getElementById('to').value    = to;
  document.getElementById('days').value  = days;
  document.getElementById('style').value = style;
}

async function planTrip() {
  const from   = document.getElementById('from').value.trim();
  const to     = document.getElementById('to').value.trim();
  const days   = parseInt(document.getElementById('days').value);
  const style  = document.getElementById('style').value;
  const budget = document.getElementById('budget').value;

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

// ── Section config — icon, label, colour ──
const SECTIONS = [
  { key: '🚗 ROUTE OVERVIEW',     icon: '🚗', label: 'Route Overview',     color: '#FF6B35' },
  { key: '⛽ FUEL STOPS',          icon: '⛽', label: 'Fuel Stops',          color: '#F59E0B' },
  { key: '🍽️ EAT ON THE WAY',     icon: '🍽️', label: 'Eat on the Way',     color: '#10B981' },
  { key: '💎 HIDDEN GEMS',         icon: '💎', label: 'Hidden Gems',         color: '#8B5CF6' },
  { key: '📅 DAY-WISE ITINERARY',  icon: '📅', label: 'Day-wise Itinerary',  color: '#3B82F6' },
  { key: '💰 BUDGET BREAKDOWN',    icon: '💰', label: 'Budget Breakdown',    color: '#059669' },
  { key: '⚠️ TRIP WARNINGS',       icon: '⚠️', label: 'Trip Warnings',       color: '#EF4444' },
  { key: '📲 WHATSAPP SUMMARY',    icon: '📲', label: 'WhatsApp Summary',    color: '#25D366' },
];

// ── Parse plan text into sections ─────────
function parsePlan(planText) {
  const sections = [];
  let remaining  = planText;

  SECTIONS.forEach((sec, i) => {
    const startIdx = remaining.indexOf(sec.key);
    if (startIdx === -1) return;

    // Find where next section starts
    let endIdx = remaining.length;
    for (let j = i + 1; j < SECTIONS.length; j++) {
      const nextIdx = remaining.indexOf(SECTIONS[j].key);
      if (nextIdx !== -1 && nextIdx > startIdx) {
        endIdx = nextIdx;
        break;
      }
    }

    const content = remaining
      .substring(startIdx + sec.key.length, endIdx)
      .trim();

    sections.push({ ...sec, content });
  });

  return sections;
}

// ── Render sections as styled cards ───────
function renderPlan(planText) {
  const sections = parsePlan(planText);

  if (sections.length === 0) {
    // Fallback — just show plain text
    return `<pre class="plain-text">${planText}</pre>`;
  }

  return sections.map(sec => `
    <div class="plan-section">
      <div class="plan-section__header" style="border-left-color: ${sec.color}">
        <span class="plan-section__icon">${sec.icon}</span>
        <span class="plan-section__label">${sec.label}</span>
      </div>
      <div class="plan-section__body">
        ${formatContent(sec.content, sec.key)}
      </div>
    </div>
  `).join('');
}

// ── Format content per section type ───────
function formatContent(content, sectionKey) {
  if (!content) return '';

  // WhatsApp summary — highlight box
  if (sectionKey === '📲 WHATSAPP SUMMARY') {
    return `<div class="whatsapp-box">${content}</div>`;
  }

  // Budget — highlight total line
  if (sectionKey === '💰 BUDGET BREAKDOWN') {
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const isTotal = line.toLowerCase().includes('total');
      return `<div class="budget-line ${isTotal ? 'budget-line--total' : ''}">
        ${line.trim()}
      </div>`;
    }).join('');
  }

  // Warnings — each bullet gets a warning pill
  if (sectionKey === '⚠️ TRIP WARNINGS') {
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map(line =>
      `<div class="warning-line">${line.trim()}</div>`
    ).join('');
  }

  // Default — render bullet points nicely
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      return `<div class="bullet-line">${trimmed}</div>`;
    }
    if (trimmed.startsWith('DAY')) {
      return `<div class="day-header">${trimmed}</div>`;
    }
    return `<div class="text-line">${trimmed}</div>`;
  }).join('');
}

// ── Show Result ────────────────────────────
function showResult(from, to, days, style, budget, plan) {
  document.getElementById('trip-route').textContent =
    `${from} → ${to}`;
  document.getElementById('trip-meta').textContent =
    `${days} Day${days > 1 ? 's' : ''} · ${style} · ${budget}`;

  // Render as styled sections
  document.getElementById('trip-plan').innerHTML = renderPlan(plan);

  document.getElementById('result-section').classList.add('visible');
  document.getElementById('result-section')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyPlan() {
  if (!currentPlan) return;
  navigator.clipboard.writeText(currentPlan).then(() => {
    const btn = document.querySelector('.action-btn--copy');
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function shareWhatsApp() {
  if (!currentPlan) return;
  const text = `🚗 *${currentFrom} → ${currentTo} Road Trip Plan*\n\n${currentPlan}\n\n_Planned by TripBharat — India's AI Road Trip Planner_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function newTrip() {
  hideResult();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('from').focus();
}

function showLoading(show) {
  const el  = document.getElementById('loading');
  const btn = document.getElementById('plan-btn');
  if (show) {
    el.classList.add('visible');
    btn.disabled = true;
    btn.textContent = '⏳ Planning...';
  } else {
    el.classList.remove('visible');
    btn.disabled = false;
    btn.textContent = '🗺️ Plan My Trip';
  }
}

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-box').classList.add('visible');
}

function hideError() {
  document.getElementById('error-box').classList.remove('visible');
}

function hideResult() {
  document.getElementById('result-section').classList.remove('visible');
}