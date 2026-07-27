const cardsGrid = document.getElementById("cardsGrid");
const itemCount = document.getElementById("itemCount");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-button");
const categoryButtons = document.querySelectorAll(".category-button");

let items = [];
let activeFilter = "all";
let activeCategory = "All";

function fetchItems() {
  fetch("/api/items")
    .then((response) => response.json())
    .then((data) => {
      items = data;
      renderItems();
    });
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = item.name;

  const label = document.createElement("span");
  label.className = `label ${item.type.toLowerCase()}`;
  label.textContent = item.type.toUpperCase();

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.innerHTML = `<span>${item.category}</span><span>${item.location}</span><span>${item.date}</span>`;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = item.description;

  const footer = document.createElement("div");
  footer.className = "card-footer";
  footer.textContent = `Contact: ${item.email}`;

  card.appendChild(title);
  card.appendChild(label);
  card.appendChild(meta);
  card.appendChild(description);
  card.appendChild(footer);

  return card;
}

function renderItems() {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = items.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.type === activeFilter;
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(query) || item.location.toLowerCase().includes(query);
    return matchesFilter && matchesCategory && matchesSearch;
  });

  cardsGrid.innerHTML = "";
  filtered.forEach((item) => cardsGrid.appendChild(createCard(item)));
  itemCount.textContent = `${filtered.length} items found`;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderItems();
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.category;
    renderItems();
  });
});

searchInput.addEventListener("input", renderItems);

fetchItems();
