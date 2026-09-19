/* sales.js — invoice creation (cart), sales history, and printing.
   Includes Product Images in cart/invoices, audio chimes, and Real-Time multi-tab sync. */

const SalesPage = (() => {

  let cart = []; // { productId, name, price, qty, stock, image }

  function init() {
    populateCustomerSelect();
    populateProductSelect();
    bindEvents();
    bindRealtime();
    renderCart();
    renderHistory();
  }

  function bindRealtime() {
    Storage.on('products_changed', () => populateProductSelect());
    Storage.on('stock_changed', () => populateProductSelect());
    Storage.on('sales_changed', () => renderHistory());
    Storage.on('customers_changed', () => populateCustomerSelect());
    Storage.on('all_changed', () => {
      populateCustomerSelect();
      populateProductSelect();
      renderHistory();
    });
  }

  function populateCustomerSelect() {
    const select = Utils.qs('#sale-customer');
    if (!select) return;
    const customers = Storage.Customers.all();
    select.innerHTML = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  function populateProductSelect() {
    const select = Utils.qs('#sale-product');
    if (!select) return;
    const products = Storage.Products.all();
    select.innerHTML = '<option value="">Select a product…</option>' +
      products.map(p => `<option value="${p.id}">${p.name} — ${Utils.currency(p.price)} (${p.stock} in stock)</option>`).join('');
  }

  function bindEvents() {
    Utils.qs('#add-to-cart-btn').addEventListener('click', addToCart);
    Utils.qs('#sale-discount').addEventListener('input', renderCart);
    Utils.qs('#apply-tax').addEventListener('change', renderCart);
    Utils.qs('#save-sale-btn').addEventListener('click', saveSale);
    Utils.qs('#clear-cart-btn').addEventListener('click', () => { cart = []; renderCart(); });
    Utils.qs('#invoice-modal-close').addEventListener('click', closeInvoiceModal);
    Utils.qs('#print-invoice-btn').addEventListener('click', () => window.print());
    const search = Utils.qs('#global-search');
    if (search) {
      search.addEventListener('input', Utils.debounce(e => {
        const term = e.target.value.trim().toLowerCase();
        renderHistory(term);
      }, 150));
    }
  }

  function addToCart() {
    const productId = Utils.qs('#sale-product').value;
    const qty = Number(Utils.qs('#sale-qty').value) || 1;
    if (!productId) { Utils.toast('Choose a product first', 'error'); return; }
    const product = Storage.Products.get(productId);
    if (!product) return;

    const existing = cart.find(i => i.productId === productId);
    const currentQtyInCart = existing ? existing.qty : 0;
    if (currentQtyInCart + qty > product.stock) {
      Utils.toast(`Only ${product.stock} in stock for "${product.name}"`, 'error');
      Utils.playChime('alert');
      return;
    }
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price,
        qty,
        stock: product.stock,
        image: product.image || 'assets/images/products/placeholder.svg'
      });
    }

    Utils.qs('#sale-qty').value = 1;
    Utils.qs('#sale-product').value = '';
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter(i => i.productId !== productId);
    renderCart();
  }

  function computeTotals() {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discount = Number(Utils.qs('#sale-discount').value) || 0;
    const taxRate = Utils.qs('#apply-tax').checked ? Number(Storage.getSettings().taxRate || 0) : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (taxRate / 100);
    const total = taxable + tax;
    return { subtotal, discount, taxRate, tax, total };
  }

  function renderCart() {
    const tbody = Utils.qs('#cart-tbody');
    if (!cart.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty">Cart is empty — add products above.</div></td></tr>`;
    } else {
      tbody.innerHTML = cart.map(i => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${i.image || 'assets/images/products/placeholder.svg'}" class="product-thumb-sm" alt="${i.name}" onerror="this.src='assets/images/products/placeholder.svg'">
              <span><strong>${i.name}</strong></span>
            </div>
          </td>
          <td class="mono">${Utils.currency(i.price)}</td>
          <td class="mono">${i.qty}</td>
          <td class="mono">${Utils.currency(i.price * i.qty)}</td>
          <td class="text-right"><button class="btn btn-ghost btn-sm" data-remove="${i.productId}">Remove</button></td>
        </tr>`).join('');
      Utils.qsa('[data-remove]', tbody).forEach(btn =>
        btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-remove'))));
    }
    const t = computeTotals();
    Utils.qs('#sum-subtotal').textContent = Utils.currency(t.subtotal);
    Utils.qs('#sum-tax').textContent = `${Utils.currency(t.tax)} (${t.taxRate}%)`;
    Utils.qs('#sum-total').textContent = Utils.currency(t.total);
    Utils.qs('#save-sale-btn').disabled = cart.length === 0;
  }

  function saveSale() {
    if (!cart.length) return;
    const t = computeTotals();
    const saleId = Utils.uid('sale');
    const sale = {
      id: saleId,
      date: Utils.todayISO(),
      customerId: Utils.qs('#sale-customer').value || null,
      items: cart.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image || 'assets/images/products/placeholder.svg'
      })),
      discount: t.discount,
      tax: Number(t.tax.toFixed(2)),
      total: Number(t.total.toFixed(2))
    };
    Storage.Sales.add(sale);
    cart.forEach(i => Inventory.stockOut(i.productId, i.qty, 'Sale invoice #' + saleId.slice(-6), sale.id));

    Utils.playChime('success');
    Utils.toast('Invoice saved and stock updated!', 'success');
    cart = [];
    Utils.qs('#sale-discount').value = 0;
    renderCart();
    populateProductSelect();
    renderHistory();
    openInvoiceModal(sale.id);
  }

  function renderHistory(searchTerm) {
    const tbody = Utils.qs('#sales-tbody');
    if (!tbody) return;
    const customers = Storage.Customers.all();
    let sales = Storage.Sales.all();
    if (searchTerm) {
      sales = sales.filter(s => {
        const cust = customers.find(c => c.id === s.customerId);
        return (cust && cust.name.toLowerCase().includes(searchTerm)) ||
          s.items.some(i => i.name.toLowerCase().includes(searchTerm));
      });
    }
    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty">No sales recorded yet.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = sales.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      const itemCount = s.items.reduce((n, i) => n + i.qty, 0);
      return `
      <tr>
        <td>${Utils.formatDateTime(s.date)}</td>
        <td>${cust ? cust.name : 'Walk-in Customer'}</td>
        <td class="mono">${itemCount} item${itemCount === 1 ? '' : 's'}</td>
        <td class="mono"><strong>${Utils.currency(s.total)}</strong></td>
        <td class="text-right"><button class="btn btn-ghost btn-sm" data-view="${s.id}">View / print</button></td>
      </tr>`;
    }).join('');
    Utils.qsa('[data-view]', tbody).forEach(btn =>
      btn.addEventListener('click', () => openInvoiceModal(btn.getAttribute('data-view'))));
  }

  function openInvoiceModal(saleId) {
    const sale = Storage.Sales.get(saleId);
    if (!sale) return;
    const customers = Storage.Customers.all();
    const cust = customers.find(c => c.id === sale.customerId);
    const settings = Storage.getSettings();
    const subtotal = sale.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    Utils.qs('#print-area').innerHTML = `
      <div class="invoice-head">
        <div>
          <h2>${settings.storeName || 'My Store'}</h2>
          <div class="field-hint">Invoice #${sale.id.slice(-8).toUpperCase()}</div>
        </div>
        <div class="invoice-meta">
          <div>${Utils.formatDateTime(sale.date)}</div>
          <div><strong>Bill to:</strong> ${cust ? cust.name : 'Walk-in Customer'}</div>
        </div>
      </div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(i => `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <img src="${i.image || 'assets/images/products/placeholder.svg'}" class="product-thumb-sm" alt="${i.name}" onerror="this.src='assets/images/products/placeholder.svg'">
                  <span>${i.name}</span>
                </div>
              </td>
              <td class="mono">${Utils.currency(i.price)}</td>
              <td class="mono">${i.qty}</td>
              <td class="mono">${Utils.currency(i.price * i.qty)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="invoice-totals">
        <div><span>Subtotal</span><span>${Utils.currency(subtotal)}</span></div>
        ${sale.discount ? `<div><span>Discount</span><span>-${Utils.currency(sale.discount)}</span></div>` : ''}
        <div><span>Tax</span><span>${Utils.currency(sale.tax)}</span></div>
        <div class="grand"><span>Total</span><span>${Utils.currency(sale.total)}</span></div>
      </div>`;

    Utils.qs('#invoice-modal').classList.add('is-open');
  }

  function closeInvoiceModal() {
    Utils.qs('#invoice-modal').classList.remove('is-open');
  }

  return { init };
})();
