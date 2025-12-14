const $ = (id) => document.getElementById(id);

const els = {
  form: $("productForm"),
  id: $("id"),
  name: $("name"),
  price: $("price"),
  category_id: $("category_id"),
  description: $("description"),
  image_url: $("image_url"),
  tbody: $("tbody"),
  msg: $("msg"),
  btnReset: $("btnReset"),
};

function showMsg(text, ok = false) {
  els.msg.style.color = ok ? "green" : "#d33";
  els.msg.textContent = text;
}

function resetForm() {
  els.id.value = "";
  els.name.value = "";
  els.price.value = "0";
  els.category_id.value = "";
  els.description.value = "";
  els.image_url.value = "";
  showMsg("");
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function loadCategories() {
  const { data } = await fetchJSON(`${API_BASE}/categories.php`);
  const opts = ['<option value="">-- Không chọn --</option>']
    .concat(data.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`));
  els.category_id.innerHTML = opts.join("");
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function renderProducts(rows) {
  els.tbody.innerHTML = rows.map(p => {
    const img = (p.image_url || "").trim();
    const imgCell = img
      ? `<a href="${escapeHtml(img)}" target="_blank" rel="noreferrer">Xem</a>`
      : `<span style="color:#64748b">—</span>`;

    return `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${Number(p.price).toLocaleString('vi-VN')}</td>
        <td>${escapeHtml(p.category_name || '')}</td>
        <td>${escapeHtml(p.description || '')}</td>
        <td>${imgCell}</td>
        <td>
          <button data-edit="${p.id}">Sửa</button>
          <button class="secondary" data-del="${p.id}">Xóa</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadProducts() {
  const { data } = await fetchJSON(`${API_BASE}/products.php`);
  renderProducts(data);
}

async function onEdit(id) {
  const { data } = await fetchJSON(`${API_BASE}/products.php?id=${id}`);
  els.id.value = data.id;
  els.name.value = data.name ?? "";
  els.price.value = data.price ?? 0;
  els.category_id.value = data.category_id ?? "";
  els.description.value = data.description ?? "";
  els.image_url.value = data.image_url ?? "";
  showMsg("Đang sửa sản phẩm ID " + id, true);
}

async function onDelete(id) {
  if (!confirm("Xóa sản phẩm ID " + id + " ?")) return;
  await fetchJSON(`${API_BASE}/products.php?id=${id}`, { method: "DELETE" });
  await loadProducts();
  resetForm();
  showMsg("Đã xóa!", true);
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: els.name.value.trim(),
      price: Number(els.price.value || 0),
      category_id: els.category_id.value,
      description: els.description.value.trim(),
      image_url: els.image_url.value.trim(),
    };

    if (!payload.name) {
      showMsg("Tên sản phẩm không được rỗng!");
      return;
    }

    // nếu để trống image_url thì gửi "" cũng OK (API sẽ chuyển thành null)
    if (els.id.value) {
      await fetchJSON(`${API_BASE}/products.php?id=${els.id.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showMsg("Cập nhật thành công!", true);
    } else {
      await fetchJSON(`${API_BASE}/products.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showMsg("Thêm thành công!", true);
    }

    await loadProducts();
    resetForm();
  } catch (err) {
    showMsg(err.message || "Lỗi!");
  }
});

els.btnReset.addEventListener("click", resetForm);

els.tbody.addEventListener("click", (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");
  if (editId) onEdit(editId);
  if (delId) onDelete(delId);
});

(async function init() {
  try {
    await loadCategories();
    await loadProducts();
  } catch (err) {
    showMsg("Không gọi được API. Kiểm tra API_BASE / XAMPP-WAMP / DB. (" + err.message + ")");
  }
})();
