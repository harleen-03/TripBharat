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

function showResult(from, to, days, style, budget, plan) {
  document.getElementById('trip-route').textContent =
    `${from} → ${to}`;
  document.getElementById('trip-meta').textContent =
    `${days} Day${days > 1 ? 's' : ''} · ${style} · ${budget}`;
  document.getElementById('trip-plan').textContent = plan;
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