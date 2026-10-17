// ── NAVEGACIÓN ──────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelector(`[href="#${name}"]`).classList.add('active');
  const titles = {
    embeds: '📨 Enviar Embeds',
    tickets: '🎫 Tickets',
  };
  document.getElementById('section-title').textContent = titles[name] || name;
}

// ── CARGAR CANALES ───────────────────────────────────────────────
async function loadChannels() {
  try {
    const res = await fetch('/api/channels');
    const channels = await res.json();
    const sel = document.getElementById('channelSelect');
    sel.innerHTML = '<option value="">— Selecciona un canal —</option>';
    channels.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = '# ' + ch.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    document.getElementById('channelSelect').innerHTML = '<option value="">Error cargando canales</option>';
  }
}

// ── ENVIAR EMBED ─────────────────────────────────────────────────
async function sendEmbed(type) {
  const channelId = document.getElementById('channelSelect').value;
  if (!channelId) {
    showToast('⚠️ Selecciona un canal primero', 'error');
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const res = await fetch('/api/send-embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, embedType: type }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast('✅ ' + data.message, 'success');
    } else {
      showToast('❌ ' + data.error, 'error');
    }
  } catch (e) {
    showToast('❌ Error de conexión', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar al Canal';
  }
}

// ── TOAST ────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ── INIT ─────────────────────────────────────────────────────────
loadChannels();
