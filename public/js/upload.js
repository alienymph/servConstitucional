// public/js/upload.js
document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('file');
  const toastContainer = document.getElementById('toastContainer');

  function showToast(msg, type = 'success') {
    const id = 't' + Date.now();
    const div = document.createElement('div');
    div.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    div.id = id;
    div.role = 'alert';
    div.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${msg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"></button>
      </div>`;
    toastContainer.appendChild(div);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, 3500);
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

    const fd = new FormData();
    fd.append('file', file);

    try {
      uploadBtn.disabled = true;
      uploadBtn.innerText = 'Subiendo...';

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: fd
      });

      const json = await res.json();

      if (res.ok && json.ok) {
        showToast('Subido correctamente');
        window.location.href = '/manage';
      } else {
        showToast(json.message || 'Error al subir', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red', 'danger');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerText = 'Subir';
    }
  });
});