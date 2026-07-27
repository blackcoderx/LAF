const cardsGrid = document.getElementById('cardsGrid');
const resultsCopy = document.getElementById('resultsCopy');
const searchInput = document.getElementById('searchInput');
const categoryRow = document.getElementById('categoryRow');
const filterButtons = document.querySelectorAll('.stat-btn');

let items = [];
let activeFilter = 'all';
let activeCategory = 'All';
let searchQuery = '';

function fetchItems() {
  fetch('/api/items')
    .then((response) => response.json())
    .then((data) => {
      items = data;
      updateCounts();
      renderItems();
      focusItemFromHash();
    });
}

function focusItemFromHash() {
  const match = location.hash.match(/^#item=(\d+)$/);
  if (!match) return;
  const targetId = match[1];

  const alreadyVisible = cardsGrid.querySelector(`.card[data-item-id="${targetId}"]`);
  if (!alreadyVisible) {
    searchQuery = '';
    activeCategory = 'All';
    activeFilter = 'all';
    searchInput.value = '';
    document.querySelectorAll('.category-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.category === 'All'));
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === 'all'));
    renderItems();
  }

  const card = cardsGrid.querySelector(`.card[data-item-id="${targetId}"]`);
  if (!card) return;
  card.setExpanded(true);
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.addEventListener('hashchange', focusItemFromHash);

function updateCounts() {
  const lostCount = items.filter((item) => item.type === 'Lost').length;
  const foundCount = items.filter((item) => item.type === 'Found').length;
  document.getElementById('countAll').textContent = String(items.length);
  document.getElementById('countLost').textContent = String(lostCount);
  document.getElementById('countFound').textContent = String(foundCount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LOCATION_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const MAIL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
const EMPTY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.itemId = String(item.id);

  const top = document.createElement('div');
  top.className = 'card-top';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.name;

  const badge = document.createElement('span');
  badge.className = 'badge ' + item.type.toLowerCase();
  badge.textContent = item.type;

  top.appendChild(title);
  top.appendChild(badge);

  const tagRow = document.createElement('div');
  tagRow.className = 'tag-row';
  const tag = document.createElement('span');
  tag.className = 'tag-pill';
  tag.textContent = item.category;
  tagRow.appendChild(tag);

  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const locationRow = document.createElement('p');
  locationRow.className = 'meta-row';
  locationRow.innerHTML = LOCATION_ICON;
  locationRow.appendChild(document.createTextNode(item.location));
  meta.appendChild(locationRow);

  const dateRow = document.createElement('p');
  dateRow.className = 'meta-row meta-date';
  dateRow.textContent = formatDate(item.date);
  meta.appendChild(dateRow);

  const details = document.createElement('div');
  details.className = 'card-details';

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = item.description;

  const contactLink = document.createElement('a');
  contactLink.className = 'card-contact';
  contactLink.href = 'mailto:' + item.email;
  contactLink.innerHTML = MAIL_ICON;
  contactLink.appendChild(document.createTextNode(item.email));
  contactLink.addEventListener('click', (event) => event.stopPropagation());

  const qrWrap = document.createElement('div');
  qrWrap.className = 'card-qr';
  const qrBox = document.createElement('div');
  qrBox.className = 'qr-box';
  const qrCaption = document.createElement('p');
  qrCaption.className = 'qr-caption';
  qrCaption.textContent = 'Scan to open this item';
  qrWrap.appendChild(qrBox);
  qrWrap.appendChild(qrCaption);

  details.appendChild(description);
  details.appendChild(contactLink);
  details.appendChild(qrWrap);

  const hint = document.createElement('p');
  hint.className = 'card-hint';
  hint.textContent = 'Click for details & contact';

  card.appendChild(top);
  card.appendChild(tagRow);
  card.appendChild(meta);
  card.appendChild(details);
  card.appendChild(hint);

  let qrRendered = false;
  function setExpanded(expanded) {
    card.classList.toggle('expanded', expanded);
    hint.textContent = expanded ? 'Click to collapse' : 'Click for details & contact';
    if (expanded && !qrRendered) {
      const url = `${location.origin}${location.pathname}#item=${item.id}`;
      qrBox.innerHTML = buildQrSvg(url, 72);
      qrRendered = true;
    }
  }
  card.setExpanded = setExpanded;

  card.addEventListener('click', () => setExpanded(!card.classList.contains('expanded')));

  return card;
}

function buildEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = EMPTY_ICON + '<p>No items match your filters.</p>';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Clear all filters';
  clearBtn.addEventListener('click', () => {
    searchQuery = '';
    activeCategory = 'All';
    activeFilter = 'all';
    searchInput.value = '';
    document.querySelectorAll('.category-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.category === 'All'));
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === 'all'));
    renderItems();
  });
  empty.appendChild(clearBtn);
  return empty;
}

function renderItems() {
  const query = searchQuery.toLowerCase().trim();
  const filtered = items.filter((item) => {
    const byFilter = activeFilter === 'all' || item.type === activeFilter;
    const byCategory = activeCategory === 'All' || item.category === activeCategory;
    const bySearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return byFilter && byCategory && bySearch;
  });

  cardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    cardsGrid.appendChild(buildEmptyState());
  } else {
    filtered.forEach((item) => cardsGrid.appendChild(buildCard(item)));
  }

  let copy = `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'} found`;
  if (searchQuery) copy += ` matching "${searchQuery}"`;
  resultsCopy.textContent = copy;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter === 'all' ? 'all' : button.dataset.filter;
    renderItems();
  });
});

categoryRow.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains('category-btn')) return;
  document.querySelectorAll('.category-btn').forEach((btn) => btn.classList.remove('active'));
  target.classList.add('active');
  activeCategory = target.dataset.category;
  renderItems();
});

searchInput.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  renderItems();
});

fetchItems();
mountAuthNav();
mountFooterQr();
