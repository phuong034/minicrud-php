const $ = (id) => document.getElementById(id);

const els = {
  q: $("q"),
  cat: $("cat"),
  sort: $("sort"),
  grid: $("grid"),
  meta: $("meta"),
  empty: $("empty"),
  err: $("err"),
};

let ALL_PRODUCTS = [];
let ALL_CATEGORIES = [];

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function formatPrice(n) {
  const num = Number(n || 0);
  return num.toLocaleString("vi-VN") + " đ";
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function buildCategoryOptions() {
  const options = ['<option value="">Tất cả danh mục</option>']
    .concat(ALL_CATEGORIES.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`));
  els.cat.innerHTML = options.join("");
}

function applyFilters() {
  const q = (els.q.value || "").toLowerCase().trim();
  const catId = els.cat.value;
  const sort = els.sort.value;

  let rows = [...ALL_PRODUCTS];

  if (catId) rows = rows.filter(p => String(p.category_id ?? "") === String(catId));

  if (q) {
    rows = rows.filter(p => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const cat = (p.category_name || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }

  if (sort === "price_asc") rows.sort((a,b) => Number(a.price||0) - Number(b.price||0));
  if (sort === "price_desc") rows.sort((a,b) => Number(b.price||0) - Number(a.price||0));
  if (sort === "name_asc") rows.sort((a,b) => String(a.name||"").localeCompare(String(b.name||""), "vi"));
  if (sort === "new") rows.sort((a,b) => Number(b.id||0) - Number(a.id||0));

  render(rows);
}

function render(rows) {
  els.meta.textContent = `Đang hiển thị ${rows.length} sản phẩm`;
  els.empty.style.display = rows.length ? "none" : "block";

  els.grid.innerHTML = rows.map(p => {
    const img = (p.image_url || "").trim();

    const imgHtml = img
      ? `<img class="thumb" src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}"
              onerror="this.style.display='none'">`
      : ``; // không có image_url thì không render ảnh

    return `
      <article class="card">
        ${imgHtml}
        <div class="card-body">
          <h3 class="title">${escapeHtml(p.name)}</h3>
          <p class="desc">${escapeHtml(p.description || "Chưa có mô tả")}</p>

          <div class="row">
            <div class="price">${formatPrice(p.price)}</div>
            <div class="badge">${escapeHtml(p.category_name || "Không phân loại")}</div>
          </div>

          <button class="btn" type="button" data-id="${p.id}">
            Xem chi tiết
          </button>
        </div>
      </article>
    `;
  }).join("");

  els.grid.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const prod = rows.find(x => String(x.id) === String(id));
      if (!prod) return;

      alert(
        `Sản phẩm: ${prod.name}\n` +
        `Giá: ${formatPrice(prod.price)}\n` +
        `Danh mục: ${prod.category_name || "Không có"}\n` +
        `Mô tả: ${prod.description || "—"}\n` +
        `Ảnh: ${prod.image_url || "—"}`
      );
    });
  });
}

async function init() {
  try {
    els.err.style.display = "none";

    const catRes = await fetchJSON(`${API_BASE}/categories.php`);
    ALL_CATEGORIES = catRes.data || [];
    buildCategoryOptions();

    const prodRes = await fetchJSON(`${API_BASE}/products.php`);
    ALL_PRODUCTS = prodRes.data || [];

    applyFilters();
  } catch (e) {
    els.err.style.display = "block";
    els.err.textContent = `Không tải được dữ liệu. Kiểm tra API_BASE / XAMPP-WAMP / link API. (${e.message})`;
  }
}

["input", "change"].forEach(ev => {
  els.q.addEventListener(ev, applyFilters);
  els.cat.addEventListener(ev, applyFilters);
  els.sort.addEventListener(ev, applyFilters);
});

init();
