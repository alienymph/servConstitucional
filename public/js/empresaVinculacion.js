document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formBorrarEmpresa');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const total = Number(form.dataset.total);

    let mensaje = '¿Seguro que deseas borrar esta empresa?';

    if (total > 0) {
      mensaje =
        'Esta empresa está asociada a ' +
        total +
        ' vinculación(es).\n\n¿Estás segura de eliminarla junto con todas sus vinculaciones?';
    }

    if (!confirm(mensaje)) {
      e.preventDefault(); // 🚫 NO se envía el form
    }
  });
});
