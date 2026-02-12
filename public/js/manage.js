document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('tbody');
  const qInput = document.getElementById('q');
  const searchBtn = document.getElementById('searchBtn');
  const summaryEl = document.getElementById('summary');

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function load() {
    const q = qInput.value.trim();
    try {
      const res = await fetch('/api/files?q=' + encodeURIComponent(q));
      const json = await res.json();

      if (!json.ok) throw new Error('Error backend');

      renderTable(json.items);
      summaryEl.textContent = `Mostrando ${json.items.length} resultado(s)`;
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            Error al cargar datos
          </td>
        </tr>`;
    }
  }

  function renderTable(items) {
    tbody.innerHTML = '';

    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No se encontraron registros
          </td>
        </tr>`;
      return;
    }

    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(it.titular || '')}</td>
        <td>${escapeHtml(it.cargo || '')}</td>
        <td>${escapeHtml(it.correo || '')}</td>
        <td>
          ${new Date(it.createdAt).toLocaleDateString()}
          <br>
          ${
            it.diffDays === null
              ? '<span class="badge bg-secondary">Sin vigencia</span>'
              : it.diffDays < 0
                ? '<span class="badge bg-danger">Vencido</span>'
                : it.diffDays <= 7
                  ? `<span class="badge bg-warning text-dark">
                      Vence en ${it.diffDays} días
                    </span>`
                  : '<span class="badge bg-success">Vigente</span>'
          }
        </td>
        <td>
          <a class="btn btn-sm btn-success me-1"
             href="/api/files/view/${it._id}">
             Ver
          </a>

          <a class="btn btn-sm btn-primary me-1"
             href="/api/files/edit/${it._id}">
             Editar
          </a>

          <button class="btn btn-sm btn-danger"
                  data-id="${it._id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => deleteFile(btn.dataset.id));
    });
  }

  async function deleteFile(id) {
    if (!confirm('¿Eliminar este archivo?')) return;

    try {
      const res = await fetch('/api/files/' + id, { method: 'DELETE' });
      const json = await res.json();

      if (json.ok) load();
      else alert('No se pudo eliminar');
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  }

  searchBtn.addEventListener('click', load);
  qInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') load();
  });

  load();
});
