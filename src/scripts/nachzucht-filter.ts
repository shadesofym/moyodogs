// Filters only the two existing litter groups; no data or card reordering.
function initNachzuchtFilter() {
  const root = document.querySelector<HTMLElement>('[data-nachzucht-filter]');
  if (!root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-nachzucht-filter-button]'));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-nachzucht-group]'));
  const counter = root.querySelector<HTMLElement>('[data-nachzucht-filter-count]');

  const filter = (selected: string) => {
    let count = 0;
    for (const group of groups) {
      const visible = selected === 'all' || group.dataset.litter === selected;
      group.hidden = !visible;
      if (visible) count += Number(group.dataset.litterCount || 0);
    }
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.litter === selected));
    }
    if (counter) counter.textContent = `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`;
    // When switching groups, don't leave a hover preview from the now-hidden list.
    document.querySelectorAll<HTMLElement>('[data-dog-preview]').forEach(preview => {
      preview.dataset.on = 'false';
    });
  };

  for (const button of buttons) {
    button.addEventListener('click', () => filter(button.dataset.litter || 'all'));
  }
}
document.addEventListener('astro:page-load', initNachzuchtFilter);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNachzuchtFilter, { once: true });
} else {
  initNachzuchtFilter();
}
