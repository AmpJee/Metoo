const orders = [
  { id: "#MT-2291", retailer: "Baan Suan Grocer", product: "Oleo Revitalizant Multifu...", amount: 6900, status: "Fulfilled" },
  { id: "#MT-2290", retailer: "Corner Kiosk Co.", product: "Protein Ball", amount: 13800, status: "Fulfilled" },
  { id: "#MT-2289", retailer: "Riverside Market", product: "Classic Wallet", amount: 20700, status: "Processing" },
  { id: "#MT-2288", retailer: "Little Leaf Store", product: "Mushroom Chili Paste", amount: 4830, status: "Processing" }
];

function statusPillMarkup(status) {
  const cls = status === "Fulfilled" ? "status-live" : "status-pending";
  return `<span class="status-pill ${cls}">${status}</span>`;
}

function renderOrders(list) {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--ink-soft);padding:24px;">No orders match your search.</td></tr>`;
    return;
  }

  list.forEach(o => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${o.id}</td>
      <td>${o.retailer}</td>
      <td>${o.product}</td>
      <td>฿${o.amount.toLocaleString()}</td>
      <td>${statusPillMarkup(o.status)}</td>`;
    tbody.appendChild(row);
  });
}

function setupOrderSearch() {
  const input = document.getElementById('retailer-search');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const filtered = orders.filter(o =>
      o.retailer.toLowerCase().includes(q) ||
      o.product.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
    renderOrders(filtered);
  });
}

function updateStat(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent.replace(/[^\d]/g, ""), 10) || 0;
  el.textContent = (current + delta).toLocaleString();
}

function setupAddProduct() {
  const btn = document.getElementById('add-product-btn');
  const form = document.getElementById('add-product-form');
  const cancelBtn = document.getElementById('cancel-product-btn');
  const submitBtn = document.getElementById('submit-product-btn');
  if (!btn || !form) return;

  btn.addEventListener('click', () => {
    form.hidden = !form.hidden;
  });
  cancelBtn.addEventListener('click', () => {
    form.hidden = true;
  });

  submitBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('new-product-name');
    const priceInput = document.getElementById('new-product-price');
    const name = nameInput.value.trim();
    const price = parseInt(priceInput.value, 10);

    if (!name || !price) {
      nameInput.style.borderColor = name ? "" : "var(--brand-red)";
      priceInput.style.borderColor = price ? "" : "var(--brand-red)";
      return;
    }

    orders.unshift({
      id: "#MT-" + (2292 + orders.length),
      retailer: "New listing",
      product: name,
      amount: price,
      status: "Processing"
    });

    renderOrders(orders);
    updateStat('active-products-stat', 1);

    nameInput.value = "";
    priceInput.value = "";
    form.hidden = true;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderOrders(orders);
  setupOrderSearch();
  setupAddProduct();
});