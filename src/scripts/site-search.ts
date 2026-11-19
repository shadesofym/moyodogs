const normalize = (value: string) =>
  value.toLocaleLowerCase('de-CH').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function initSiteSearch() {
  const field = document.querySelector<HTMLInputElement>('[data-site-search-input]');
  if (!field || field.dataset.bound === 'true') return;
  field.dataset.bound = 'true';

  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-site-search-result]'));
  const count = document.querySelector<HTMLElement>('[data-site-search-count]');
  const empty = document.querySelector<HTMLElement>('[data-site-search-empty]');
  const query = new URLSearchParams(window.location.search).get('q');
  if (query) field.value = query;

  const filter = () => {
    const words = normalize(field.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of rows) {
      const content = normalize(row.dataset.searchText ?? '');
      const matches = words.every(word => content.includes(word));
      row.hidden = !matches;
      if (matches) visible += 1;
    }
    if (count) count.textContent = `${visible} ${visible === 1 ? 'Eintrag' : 'Einträge'}`;
    if (empty) empty.hidden = visible !== 0;
  };

  field.addEventListener('input', filter);
  filter();
}

document.addEventListener('astro:page-load', initSiteSearch);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteSearch, { once: true });
} else {
  initSiteSearch();
}
