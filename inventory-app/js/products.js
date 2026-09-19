/* products.js — everything that runs on products.html
   Includes Product Images, Barcode/QR Generation, Real-Time Sync, and CSV Import/Export. */

const ProductsPage = (() => {

  let state = { search: '', category: 'all' };
  let currentProductImage = '';

  const PRESET_IMAGES = [
    { label: 'Tea', path: 'assets/images/products/tea.svg' },
    { label: 'Coffee', path: 'assets/images/products/coffee.svg' },
    { label: 'Biscuits', path: 'assets/images/products/biscuits.svg' },
    { label: 'Peanuts', path: 'assets/images/products/peanuts.svg' },
    { label: 'Notebook', path: 'assets/images/products/notebook.svg' },
    { label: 'Pens', path: 'assets/images/products/pens.svg' },
    { label: 'Cable', path: 'assets/images/products/cable.svg' },
    { label: 'Bulb', path: 'assets/images/products/bulb.svg' },
    { label: 'Dish Wash', path: 'assets/images/products/dishwash.svg' },
    { label: 'Cleaner', path: 'assets/images/products/cleaner.svg' }
  ];

  function init() {
    bindToolbar();
    bindModals();
    bindRealtime();
    render();
  }

  function bindRealtime() {
    // Real-time synchronization across tabs
    Storage.on('products_changed', () => {
      populateCategoryOptions(Utils.qs('#category-filter'));
      render();
    });
    Storage.on('stock_changed', () => {
      render();
    });
    Storage.on('all_changed', () => {
      populateCategoryOptions(Utils.qs('#category-filter'));
      render();
    });
  }

  function bindToolbar() {
    Utils.qs('#add-product-btn').addEventListener('click', () => openProductModal(null));

    const search = Utils.qs('#global-search') || Utils.qs('#product-search');
    if (search) {
      search.addEventListener('input', Utils.debounce(e => {
        state.search = e.target.value.trim().toLowerCase();
        render();
      }, 150));
    }

    const categorySelect = Utils.qs('#category-filter');
    populateCategoryOptions(categorySelect);
    categorySelect.addEventListener('change', e => {
      state.category = e.target.value;
      render();
    });

    // Export CSV
    Utils.qs('#export-products-csv-btn').addEventListener('click', () => {
      const prods = Storage.Products.all().map(p => ({
        ID: p.id,
        Name: p.name,
        Category: p.category || '',
        Barcode: p.barcode || '',
        Price: p.price,
        Cost: p.cost || 0,
        Stock: p.stock,
        LowStockThreshold: p.lowStockThreshold || 0,
        Image: p.image || ''
      }));
      Utils.downloadFile('products-inventory.csv', Utils.toCSV(prods), 'text/csv');
      Utils.toast('Products exported to CSV', 'success');
    });

    // Import CSV
    const csvInput = Utils.qs('#csv-file-input');
    Utils.qs('#import-csv-btn').addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const rows = Utils.parseCSV(ev.target.result);
          if (!rows.length) {
            Utils.toast('No valid records found in CSV', 'error');
            return;
          }
          let imported = 0;
          rows.forEach(r => {
            const name = r.name || r.productname || r.product || r.title;
            if (!name) return;
            const payload = {
              id: r.id || Utils.uid('prd'),
              name: String(name).trim(),
              category: String(r.category || 'General').trim(),
              barcode: String(r.barcode || r.sku || '').trim(),
              price: Number(r.price) || 0,
              cost: Number(r.cost) || 0,
              stock: Number(r.stock) || 0,
              lowStockThreshold: Number(r.lowstockthreshold || r.threshold) || 5,
              image: r.image || 'assets/images/products/placeholder.svg'
            };
            const existing = Storage.Products.all().find(p => p.barcode && p.barcode === payload.barcode);
            if (existing) {
              Storage.Products.update(existing.id, payload);
            } else {
              Storage.Products.add(payload);
            }
            imported++;
          });
          Utils.toast(`Successfully imported ${imported} products!`, 'success');
          Utils.playChime('success');
          populateCategoryOptions(Utils.qs('#category-filter'));
          render();
        } catch (err) {
          console.error(err);
          Utils.toast('Failed to parse CSV file', 'error');
        }
        csvInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  function populateCategoryOptions(select) {
    if (!select) return;
    const categories = Array.from(new Set(Storage.Products.all().map(p => p.category).filter(Boolean)));
    select.innerHTML = '<option value="all">All categories</option>' +
      categories.map(c => `<option value="${c}" ${c === state.category ? 'selected' : ''}>${c}</option>`).join('');
  }

  function filteredProducts() {
    return Storage.Products.all().filter(p => {
      const matchesSearch = !state.search ||
        p.name.toLowerCase().includes(state.search) ||
        (p.barcode || '').toLowerCase().includes(state.search);
      const matchesCategory = state.category === 'all' || p.category === state.category;
      return matchesSearch && matchesCategory;
    });
  }

  function render() {
    const list = filteredProducts();
    const tbody = Utils.qs('#products-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty">No products match. Try a different search or add a new product.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(p => {
      const status = Inventory.stockStatus(p);
      const rowClass = status === 'out' ? 'row-out-of-stock' : status === 'low' ? 'row-low-stock' : '';
      const badge = status === 'out'
        ? '<span class="badge badge-bad">Out of stock</span>'
        : status === 'low'
          ? '<span class="badge badge-warn">Low stock</span>'
          : '<span class="badge badge-good">In stock</span>';

      const imgSrc = p.image || 'assets/images/products/placeholder.svg';
      const barcodeDisplay = p.barcode
        ? `<button class="barcode-badge-btn" data-action="barcode" data-id="${p.id}" title="Click to view Barcode and QR code">
             <span>❚❚█</span> <span class="mono">${p.barcode}</span>
           </button>`
        : `<span class="field-hint">—</span>`;

      return `
      <tr class="${rowClass}">
        <td>
          <img src="${imgSrc}" class="product-thumb" alt="${p.name}" onerror="this.src='assets/images/products/placeholder.svg'" title="${p.name}">
        </td>
        <td>
          <strong>${p.name}</strong>
          <div style="margin-top:2px;">${barcodeDisplay}</div>
        </td>
        <td>${p.category || '—'}</td>
        <td class="mono">${Utils.currency(p.price)}</td>
        <td class="mono"><strong>${p.stock}</strong></td>
        <td>${badge}</td>
        <td class="mono">${p.lowStockThreshold ?? 0}</td>
        <td class="text-right">
          <button class="btn btn-ghost btn-sm" data-action="stock" data-id="${p.id}" title="Adjust stock in/out">Adjust</button>
          <button class="btn btn-ghost btn-sm" data-action="history" data-id="${p.id}" title="View stock movement history">History</button>
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>`;
    }).join('');

    Utils.qsa('[data-action]', tbody).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') openProductModal(Storage.Products.get(id));
        if (action === 'delete') handleDelete(id);
        if (action === 'stock') openStockModal(id);
        if (action === 'history') openHistoryModal(id);
        if (action === 'barcode') openBarcodeModal(id);
      });
    });
  }

  function handleDelete(id) {
    const product = Storage.Products.get(id);
    if (!product) return;
    if (!Utils.confirmAction(`Delete "${product.name}"? This cannot be undone.`)) return;
    Storage.Products.delete(id);
    Utils.toast('Product deleted', 'success');
    populateCategoryOptions(Utils.qs('#category-filter'));
    render();
  }

  // ---------------- Add / Edit Modal ----------------
  function bindModals() {
    Utils.qs('#product-form').addEventListener('submit', handleSubmit);
    Utils.qs('#product-modal-close').addEventListener('click', closeProductModal);
    Utils.qs('#product-modal-cancel').addEventListener('click', closeProductModal);

    Utils.qs('#stock-modal-close').addEventListener('click', closeStockModal);
    Utils.qs('#stock-modal-cancel').addEventListener('click', closeStockModal);
    Utils.qs('#stock-form').addEventListener('submit', handleStockSubmit);

    Utils.qs('#history-modal-close').addEventListener('click', closeHistoryModal);

    // Barcode / QR modal
    Utils.qs('#code-modal-close').addEventListener('click', closeBarcodeModal);
    Utils.qs('#code-modal-close-btn').addEventListener('click', closeBarcodeModal);
    Utils.qs('#code-modal-print-btn').addEventListener('click', () => window.print());

    // Image file upload
    const fileInput = Utils.qs('#product-image-file');
    const urlInput = Utils.qs('#product-image-url');
    const preview = Utils.qs('#product-image-preview');

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        setProductImage(ev.target.result);
        urlInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    urlInput.addEventListener('input', e => {
      const val = e.target.value.trim();
      setProductImage(val || 'assets/images/products/placeholder.svg');
    });

    Utils.qs('#product-image-clear').addEventListener('click', () => {
      setProductImage('assets/images/products/placeholder.svg');
      urlInput.value = '';
      fileInput.value = '';
    });

    // Render quick preset pills
    const presetList = Utils.qs('#preset-images-list');
    presetList.innerHTML = PRESET_IMAGES.map(p =>
      `<span class="preset-pill" data-path="${p.path}">${p.label}</span>`
    ).join('');
    Utils.qsa('.preset-pill', presetList).forEach(pill => {
      pill.addEventListener('click', () => {
        const path = pill.dataset.path;
        setProductImage(path);
        urlInput.value = path;
      });
    });
  }

  function setProductImage(src) {
    currentProductImage = src;
    const preview = Utils.qs('#product-image-preview');
    if (preview) {
      preview.src = src || 'assets/images/products/placeholder.svg';
    }
  }

  function openProductModal(product) {
    const form = Utils.qs('#product-form');
    form.reset();
    Utils.qs('#product-modal-title').textContent = product ? 'Edit product' : 'Add product';
    Utils.qs('#product-id').value = product ? product.id : '';
    
    const defaultImg = product && product.image ? product.image : 'assets/images/products/placeholder.svg';
    setProductImage(defaultImg);
    Utils.qs('#product-image-url').value = (product && product.image && !product.image.startsWith('data:')) ? product.image : '';

    if (product) {
      Utils.qs('#product-name').value = product.name;
      Utils.qs('#product-category').value = product.category || '';
      Utils.qs('#product-barcode').value = product.barcode || '';
      Utils.qs('#product-price').value = product.price;
      Utils.qs('#product-cost').value = product.cost ?? '';
      Utils.qs('#product-stock').value = product.stock;
      Utils.qs('#product-threshold').value = product.lowStockThreshold ?? 5;
    } else {
      Utils.qs('#product-stock').value = 0;
      Utils.qs('#product-threshold').value = 5;
    }
    Utils.qs('#product-modal').classList.add('is-open');
  }

  function closeProductModal() {
    Utils.qs('#product-modal').classList.remove('is-open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = Utils.qs('#product-id').value;
    const payload = {
      name: Utils.qs('#product-name').value.trim(),
      category: Utils.qs('#product-category').value.trim() || 'General',
      barcode: Utils.qs('#product-barcode').value.trim(),
      price: Number(Utils.qs('#product-price').value) || 0,
      cost: Number(Utils.qs('#product-cost').value) || 0,
      stock: Number(Utils.qs('#product-stock').value) || 0,
      lowStockThreshold: Number(Utils.qs('#product-threshold').value) || 0,
      image: currentProductImage || 'assets/images/products/placeholder.svg'
    };
    if (!payload.name) { Utils.toast('Product name is required', 'error'); return; }

    if (id) {
      Storage.Products.update(id, payload);
      Utils.toast('Product updated', 'success');
    } else {
      Storage.Products.add(Object.assign({ id: Utils.uid('prd') }, payload));
      Utils.toast('Product added', 'success');
    }
    Utils.playChime('success');
    closeProductModal();
    populateCategoryOptions(Utils.qs('#category-filter'));
    render();
  }

  // ---------------- Barcode & QR Modal ----------------
  function openBarcodeModal(id) {
    const p = Storage.Products.get(id);
    if (!p) return;
    const barcode = p.barcode || p.id;
    Utils.qs('#code-modal-name').textContent = p.name;
    Utils.qs('#code-modal-details').textContent = `${p.category || 'General'} · ${Utils.currency(p.price)} · Barcode: ${barcode}`;
    Utils.qs('#code-modal-thumb').src = p.image || 'assets/images/products/placeholder.svg';

    Utils.qs('#barcode-container').innerHTML = Utils.generateBarcodeSVG(barcode, 55);
    Utils.qs('#qrcode-container').innerHTML = Utils.generateQRCodeSVG(`SKU:${barcode};NAME:${p.name};PRICE:${p.price}`, 150);
    Utils.qs('#code-modal').classList.add('is-open');
  }

  function closeBarcodeModal() {
    Utils.qs('#code-modal').classList.remove('is-open');
  }

  // ---------------- Stock Adjust Modal ----------------
  let activeStockProductId = null;

  function openStockModal(id) {
    activeStockProductId = id;
    const product = Storage.Products.get(id);
    Utils.qs('#stock-form').reset();
    Utils.qs('#stock-modal-product-name').textContent = product.name;
    Utils.qs('#stock-modal-current').textContent = `Current stock: ${product.stock} units`;
    Utils.qs('#stock-modal-thumb').src = product.image || 'assets/images/products/placeholder.svg';
    Utils.qs('#stock-modal').classList.add('is-open');
  }

  function closeStockModal() {
    Utils.qs('#stock-modal').classList.remove('is-open');
    activeStockProductId = null;
  }

  function handleStockSubmit(e) {
    e.preventDefault();
    const type = Utils.qs('input[name="stock-type"]:checked').value;
    const qty = Number(Utils.qs('#stock-qty').value);
    const reason = Utils.qs('#stock-reason').value.trim();
    if (!qty || qty <= 0) { Utils.toast('Enter a valid quantity', 'error'); return; }

    if (type === 'in') {
      Inventory.stockIn(activeStockProductId, qty, reason || 'Manual stock in');
      Utils.playChime('success');
    } else {
      Inventory.stockOut(activeStockProductId, qty, reason || 'Manual stock out');
      Utils.playChime('alert');
    }

    Utils.toast('Stock updated successfully', 'success');
    closeStockModal();
    render();
  }

  // ---------------- History Modal ----------------
  function openHistoryModal(id) {
    const product = Storage.Products.get(id);
    const rows = Inventory.historyForProduct(id);
    Utils.qs('#history-modal-product-name').textContent = product.name;
    Utils.qs('#history-modal-thumb').src = product.image || 'assets/images/products/placeholder.svg';
    const body = Utils.qs('#history-tbody');
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="4"><div class="table-empty">No stock movements recorded yet.</div></td></tr>`;
    } else {
      body.innerHTML = rows.map(r => `
        <tr>
          <td>${Utils.formatDateTime(r.date)}</td>
          <td>${r.type === 'in' ? '<span class="badge badge-good">Stock in</span>' : '<span class="badge badge-bad">Stock out</span>'}</td>
          <td class="mono">${r.type === 'in' ? '+' : '-'}${r.qty}</td>
          <td>${r.reason || '—'}</td>
        </tr>`).join('');
    }
    Utils.qs('#history-modal').classList.add('is-open');
  }

  function closeHistoryModal() {
    Utils.qs('#history-modal').classList.remove('is-open');
  }

  return { init };
})();
