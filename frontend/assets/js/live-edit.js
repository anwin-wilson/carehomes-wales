/**
 * Valley Care Group — Live Page Editor
 * 
 * 1. Automatically replaces static text with database text
 * 2. If admin is logged in, enables contenteditable and a Save toolbar
 */
'use strict';

(async function() {
  // ── 1. Fetch live content ──────────────────────────────────────────────────
  let cData = {};
  try {
    const res = await fetch((window.API_BASE || '') + '/api/content');
    if (res.ok) cData = await res.json();
  } catch(e) { console.error('Failed to load content', e); }

  const liveData = cData.live || {};

  // Apply mapped content to DOM immediately
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    const key = el.getAttribute('data-edit-key');
    if (liveData[key] !== undefined) {
      el.innerHTML = liveData[key];
    }
  });

  // ── 2. Check Admin Session ─────────────────────────────────────────────────
  const token = sessionStorage.getItem('vcg_token');
  if (!token) return;

  // Verify token is still valid
  try {
    const res = await fetch((window.API_BASE || '') + '/api/auth/verify', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return; // Not an active admin session
  } catch(e) { return; }

  // ── 3. Enable Live Edit Mode ───────────────────────────────────────────────
  console.log('✏️ Live Edit Mode Enabled');

  // Inject styles for edit mode
  const style = document.createElement('style');
  style.textContent = `
    [data-edit-key] {
      outline: 2px dashed transparent;
      outline-offset: 4px;
      transition: outline-color 0.2s;
    }
    [data-edit-key]:hover, [data-edit-key]:focus {
      outline-color: #2E86C1;
      cursor: text;
    }
    #vcg-live-toolbar {
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      background: #0D1B2A; color: #fff; padding: 0.75rem 1.5rem;
      border-radius: 50px; display: flex; align-items: center; gap: 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4); z-index: 10000;
      font-family: 'Inter', sans-serif; font-size: 0.9rem;
    }
    #vcg-live-toolbar button {
      background: #1B4F72; color: #fff; border: none; padding: 0.5rem 1.25rem;
      border-radius: 20px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    #vcg-live-toolbar button:hover { background: #2E86C1; }
    #vcg-live-toolbar .status-dot {
      display: inline-block; width: 10px; height: 10px;
      background: #2ECC71; border-radius: 50%; margin-right: 0.5rem;
      box-shadow: 0 0 8px #2ECC71;
    }
    /* Simple Toast */
    #vcg-live-toast {
      position: fixed; top: 1.5rem; right: 1.5rem;
      background: #1E8449; color: #fff; padding: 1rem 1.5rem;
      border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 600;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3); z-index: 10001;
      transform: translateY(-150%); opacity: 0; transition: all 0.3s;
    }
    #vcg-live-toast.show { transform: translateY(0); opacity: 1; }
  `;
  document.head.appendChild(style);

  // Set all elements as editable
  const editableElements = document.querySelectorAll('[data-edit-key]');
  editableElements.forEach(el => {
    el.setAttribute('contenteditable', 'true');
    // Prevent accidental navigation when clicking editable links
    if (el.tagName === 'A') {
      el.addEventListener('click', e => e.preventDefault());
    }
  });

  // Inject Toolbar
  const bar = document.createElement('div');
  bar.id = 'vcg-live-toolbar';
  bar.innerHTML = `
    <div><span class="status-dot"></span> Live Edit Mode</div>
    <button id="vcg-live-save">💾 Save Changes</button>
  `;
  document.body.appendChild(bar);

  // Inject Toast
  const toast = document.createElement('div');
  toast.id = 'vcg-live-toast';
  toast.textContent = '✅ Changes saved live to website!';
  document.body.appendChild(toast);

  // ── 4. Save Logic ──────────────────────────────────────────────────────────
  document.getElementById('vcg-live-save').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;

    // Build payload of ALL data-edit-key elements on current page
    const payload = {};
    document.querySelectorAll('[data-edit-key]').forEach(el => {
      const key = el.getAttribute('data-edit-key');
      // Trim to avoid trailing whitespace creating odd alignments
      payload[key] = el.innerHTML.trim();
    });

    try {
      const res = await fetch((window.API_BASE || '') + '/api/admin/content/live', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Save failed');

      // Show success
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
      
      btn.textContent = '💾 Saved!';
      setTimeout(() => {
        btn.textContent = '💾 Save Changes';
        btn.disabled = false;
      }, 2000);

    } catch (err) {
      alert('Error saving changes. Are you still logged in?');
      btn.textContent = '💾 Save Changes';
      btn.disabled = false;
    }
  });

})();
