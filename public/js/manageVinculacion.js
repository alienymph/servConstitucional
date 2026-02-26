document.addEventListener('DOMContentLoaded', () => {
  const sortSelect = document.querySelector('select[name="sort"]');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortSelect.form.submit();
    });
  }
});