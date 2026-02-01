// public/js/upload.js
document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('file');
  const toastContainer = document.getElementById('toastContainer');

  function showToast(msg, type = 'success') {
    const id = 't' + Date.now();
    const div = document.createElement('div');
    div.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    div.id = id; div.role = 'alert';
    div.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    toastContainer.appendChild(div);
    setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 3500);
  }

  uploadBtn.addEventListener('click', async () => {
    if (!fileInput.files || !fileInput.files[0]) {
      showToast('Selecciona un archivo PDF antes de subir', 'warning');
      return;
    }
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
      showToast('Solo se permiten archivos PDF', 'warning');
      return;
    }

    let newWin = null;
    try { newWin = window.open('', '_blank'); if (newWin) newWin.document.write('<p>Subiendo...</p>'); } catch (e) { newWin = null; }

    const fd = new FormData();
    fd.append('file', file);

    try {
      uploadBtn.disabled = true;
      uploadBtn.innerText = 'Subiendo...';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const res = await fetch('/api/files/upload', { method: 'POST', body: fd, signal: controller.signal });
      clearTimeout(timeout);

      const json = await res.json().catch(() => null);

      if (res.ok && json && json.ok) {
        showToast(json.message || 'Subido correctamente', 'success');
        const metaId = json.meta && json.meta._id ? json.meta._id : '';
        const targetUrl = '/manage?uploaded=1&id=' + encodeURIComponent(metaId);
        if (newWin && !newWin.closed) {
          try { newWin.location.href = targetUrl; newWin.focus(); } catch (err) { window.location.href = targetUrl; }
        } else {
          window.location.href = targetUrl;
        }
      } else {
        const msg = (json && (json.error || json.message)) || `Error al subir (status ${res ? res.status : 'no response'})`;
        showToast(msg, 'danger');
        if (newWin && !newWin.closed) newWin.close();
      }
    } catch (err) {
      console.error('Upload fetch error:', err);
      showToast('Error de red al subir', 'danger');
      if (newWin && !newWin.closed) newWin.close();
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerText = 'Subir';
    }
  });
});
