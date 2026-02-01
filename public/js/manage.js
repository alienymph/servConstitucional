// public/js/manage.js
document.addEventListener('DOMContentLoaded', () => {
  let page = 1, limit = 10, sort = 'createdAt', order = 'desc', totalItems = 0, deleteTarget = null;
  const tbody = document.getElementById('tbody');
  const qInput = document.getElementById('q');
  const searchBtn = document.getElementById('searchBtn');
  const paginationEl = document.getElementById('pagination');
  const summaryEl = document.getElementById('summary');
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

  async function load() {
    const q = qInput.value.trim();
    const params = new URLSearchParams({ q, page, limit, sort, order });
    try {
      const res = await fetch('/api/files?' + params.toString());
      if (!res.ok) throw new Error('Error al obtener datos');
      const json = await res.json();
      totalItems = json.total || 0;
      renderTable(json.items || []);
      renderPagination(json.page || page, json.limit || limit, json.total || 0);
      summaryEl.textContent = `Mostrando ${ (json.items || []).length } de ${ totalItems } resultados`;
    } catch (err) {
      console.error(err);
      showToast('No se pudo obtener la lista', 'danger');
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Error al cargar</td></tr>`;
    }
  }

  function renderTable(items) {
    tbody.innerHTML = '';
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron registros</td></tr>`;
      return;
    }
    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(it.empresa || '')}</td>
        <td>${escapeHtml(it.titular || '')}</td>
        <td>${escapeHtml(it.correo || '')}</td>
        <td>${escapeHtml(it.filename || '')}</td>
        <td>${new Date(it.createdAt).toLocaleString()}</td>
        // reemplaza el enlace Ver existente por este
<td>
  <a class="btn btn-sm btn-success me-1" href="/api/files/view/${it._id}" title="Ver" target="_blank" rel="noopener">Ver</a>
  <a class="btn btn-sm btn-primary me-1" href="/api/files/edit/${it._id}" target="_blank">Editar</a>

  <button class="btn btn-sm btn-danger" data-id="${it._id}">Eliminar</button>
</td>
`;
      tbody.appendChild(tr);
    });

    // attach delete handlers
    tbody.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => askDelete(btn.dataset.id));
    });
  }

  function renderPagination(currentPage, perPage, total) {
    paginationEl.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const createItem = (p, label = null, active = false, disabled = false) => {
      const li = document.createElement('li');
      li.className = 'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
      const a = document.createElement('a');
      a.className = 'page-link'; a.href = '#'; a.dataset.page = p; a.innerText = label || p;
      a.addEventListener('click', (e) => { e.preventDefault(); if (disabled || p === currentPage) return; page = p; load(); });
      li.appendChild(a); return li;
    };
    paginationEl.appendChild(createItem(Math.max(1, currentPage - 1), '«', false, currentPage === 1));
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
    if (start > 1) paginationEl.appendChild(createItem(1, '1'));
    if (start > 2) paginationEl.appendChild(Object.assign(document.createElement('li'), { className: 'page-item disabled', innerHTML: '<span class="page-link">…</span>' }));
    for (let p = start; p <= end; p++) paginationEl.appendChild(createItem(p, null, p === currentPage));
    if (end < totalPages - 1) paginationEl.appendChild(Object.assign(document.createElement('li'), { className: 'page-item disabled', innerHTML: '<span class="page-link">…</span>' }));
    if (end < totalPages) paginationEl.appendChild(createItem(totalPages, String(totalPages)));
    paginationEl.appendChild(createItem(Math.min(totalPages, currentPage + 1), '»', false, currentPage === totalPages));
  }

  function askDelete(id) {
    if (!confirm('¿Eliminar este archivo y sus metadatos?')) return;
    doDelete(id);
  }

  async function doDelete(id) {
    try {
      const res = await fetch('/api/files/' + id, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.ok) {
        showToast('Eliminado correctamente', 'success');
        // recargar página actual
        const remaining = Math.max(0, totalItems - 1);
        const maxPage = Math.max(1, Math.ceil(remaining / limit));
        if (page > maxPage) page = maxPage;
        load();
      } else {
        showToast((json && json.error) || 'Error al eliminar', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar', 'danger');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  searchBtn.addEventListener('click', () => { page = 1; load(); });
  qInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { page = 1; load(); } });

  // carga inicial
  load();
});
document.addEventListener('DOMContentLoaded', () => {
  const results = document.getElementById('results');
  const searchForm = document.getElementById('searchForm');
  let currentSort = { field: 'createdAt', order: 'desc' };

  async function loadResults(q = '') {
    const params = new URLSearchParams({
      q,
      sortBy: currentSort.field,
      order: currentSort.order
    });
    const res = await fetch(`/api/files?${params.toString()}`);
    const data = await res.json();
    if (data.ok) {
      results.innerHTML = data.items.map(it => `
        <tr>
          <td>${it.titular || ''}</td>
          <td>${it.cargo || ''}</td>
          <td>${it.correo || ''}</td>
          <td>${new Date(it.createdAt).toLocaleString()}</td>
          <td>
            <a class="btn btn-sm btn-primary" href="/api/files/edit/${it._id}">Editar</a>
          </td>
        </tr>
      `).join('');
    }
  }

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('q').value;
    loadResults(q);
  });

  document.querySelectorAll('.sort').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const field = e.currentTarget.dataset.field;

    if (currentSort.field === field) {
      currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.field = field;
      currentSort.order = 'asc';
    }

    // Resetear iconos
    document.querySelectorAll('.sort i').forEach(icon => {
      icon.className = 'bi bi-arrow-down-up';
    });

    // Cambiar icono del campo actual
    const icon = e.currentTarget.querySelector('i');
    icon.className = currentSort.order === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';

    loadResults(document.getElementById('q').value);
  });
});

  loadResults();
});

