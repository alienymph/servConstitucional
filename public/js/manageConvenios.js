document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('tbody');
  const qInput = document.getElementById('q');
  const searchBtn = document.getElementById('searchBtn');
  const toastContainer = document.getElementById('toastContainer');

  function showToast(msg, type = 'success') {
    const id = 't' + Date.now();
    const div = document.createElement('div');
    div.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    div.id = id;
    div.role = 'alert';
    div.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    toastContainer.appendChild(div);
    setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 3500);
  }

  async function load() {
    const q = qInput.value.trim();
    try {
      const res = await fetch('/api/convenios?q=' + encodeURIComponent(q));
      const json = await res.json();
      if (!json.ok) throw new Error('Error backend');

      renderTable(json.items);
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Error al cargar convenios</td></tr>`;
    }
  }

  function renderTable(items) {
    tbody.innerHTML = '';

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron registros</td></tr>`;
      return;
    }

    items.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.numeroConvenio}</td>
        <td>${c.nombreUR}</td>
        <td>${c.anio}</td>
        <td>${new Date(c.fechaCreacion).toLocaleDateString()}</td>
        <td>
          <a class="btn btn-sm btn-primary me-1" href="/convenios/editar/${c._id}">Editar</a>
          <button class="btn btn-sm btn-danger" data-id="${c._id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => deleteConvenio(btn.dataset.id));
    });
  }

  async function deleteConvenio(id) {
    if (!confirm('¿Eliminar este convenio?')) return;
    try {
      const res = await fetch('/api/convenios/' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        showToast('Convenio eliminado', 'success');
        load();
      } else showToast('No se pudo eliminar', 'danger');
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar', 'danger');
    }
  }

  searchBtn.addEventListener('click', load);
  qInput.addEventListener('keydown', e => { if (e.key === 'Enter') load(); });

  load();
});
