/* reports.js — Sales report, Stock report, Profit report, and CSV export.
   Includes Product Images in reports and Real-Time multi-tab sync. */

const ReportsPage = (() => {

  let activeTab = 'sales';

  function init() {
    Utils.qsa('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      Utils.qsa('.tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      Utils.qsa('.tab-panel').forEach(p => p.classList.toggle('is-active', p.id === 'panel-' + activeTab));
    }));

    Utils.qs('#export-sales-csv').addEventListener('click', exportSalesCSV);
    Utils.qs('#export-stock-csv').addEventListener('click', exportStockCSV);
    Utils.qs('#export-profit-csv').addEventListener('click', exportProfitCSV);

    bindRealtime();

    renderSalesReport();
    renderStockReport();
    renderProfitReport();
  }

  function bindRealtime() {
    Storage.on('sales_changed', () => {
      renderSalesReport();
      renderProfitReport();
    });
    Storage.on('stock_changed', () => {
      renderStockReport();
    });
    Storage.on('products_changed', () => {
      renderStockReport();
      renderProfitReport();
    });
    Storage.on('all_changed', () => {
      renderSalesReport();
      renderStockReport();
      renderProfitReport();
    });
  }

  function renderSalesReport() {
    const sales = Storage.Sales.all();
    const customers = Storage.Customers.all();
    const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
    const totalTax = sales.reduce((s, r) => s + r.tax, 0);
    const totalDiscount = sales.reduce((s, r) => s + r.discount, 0);

    Utils.qs('#sales-report-summary').innerHTML = `
      <div class="stat-card"><div class="stat-label">Invoices</div><div class="stat-value">${sales.length}</div></div>
      <div class="stat-card"><div class="stat-label">Revenue</div><div class="stat-value">${Utils.currency(totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Tax collected</div><div class="stat-value">${Utils.currency(totalTax)}</div></div>
      <div class="stat-card"><div class="stat-label">Discounts given</div><div class="stat-value">${Utils.currency(totalDiscount)}</div></div>`;

    const tbody = Utils.qs('#sales-report-tbody');
    if (!sales.length) { tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty">No sales recorded yet.</div></td></tr>`; return; }
    tbody.innerHTML = sales.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      const items = s.items.reduce((n, i) => n + i.qty, 0);
      return `<tr><td>${Utils.formatDateTime(s.date)}</td><td>${cust ? cust.name : 'Walk-in Customer'}</td><td class="mono">${items}</td><td class="mono">${Utils.currency(s.tax)}</td><td class="mono"><strong>${Utils.currency(s.total)}</strong></td></tr>`;
    }).join('');
  }

  function renderStockReport() {
    const products = Storage.Products.all();
    const totalUnits = products.reduce((s, p) => s + Number(p.stock), 0);
    const totalValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.price), 0);
    const lowStock = Inventory.lowStockItems().length;

    Utils.qs('#stock-report-summary').innerHTML = `
      <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">${products.length}</div></div>
      <div class="stat-card"><div class="stat-label">Units in stock</div><div class="stat-value">${totalUnits}</div></div>
      <div class="stat-card"><div class="stat-label">Stock value</div><div class="stat-value">${Utils.currency(totalValue)}</div></div>
      <div class="stat-card"><div class="stat-label">Low stock items</div><div class="stat-value">${lowStock}</div></div>`;

    const tbody = Utils.qs('#stock-report-tbody');
    if (!products.length) { tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty">No products yet.</div></td></tr>`; return; }
    tbody.innerHTML = products.map(p => {
      const status = Inventory.stockStatus(p);
      const badge = status === 'out' ? '<span class="badge badge-bad">Out</span>' : status === 'low' ? '<span class="badge badge-warn">Low</span>' : '<span class="badge badge-good">OK</span>';
      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${p.image || 'assets/images/products/placeholder.svg'}" class="product-thumb-sm" alt="${p.name}" onerror="this.src='assets/images/products/placeholder.svg'">
              <span><strong>${p.name}</strong></span>
            </div>
          </td>
          <td>${p.category || '—'}</td>
          <td class="mono"><strong>${p.stock}</strong></td>
          <td class="mono">${Utils.currency(p.stock * p.price)}</td>
          <td>${badge}</td>
        </tr>`;
    }).join('');
  }

  function renderProfitReport() {
    const sales = Storage.Sales.all();
    const products = Storage.Products.all();
    let revenue = 0, cogs = 0;
    const perProduct = {};

    sales.forEach(s => s.items.forEach(i => {
      const product = products.find(p => p.id === i.productId);
      const cost = product ? Number(product.cost) || 0 : 0;
      const image = product ? (product.image || 'assets/images/products/placeholder.svg') : 'assets/images/products/placeholder.svg';
      revenue += i.price * i.qty;
      cogs += cost * i.qty;
      if (!perProduct[i.productId]) {
        perProduct[i.productId] = { name: i.name, image, qty: 0, revenue: 0, cost: 0 };
      }
      perProduct[i.productId].qty += i.qty;
      perProduct[i.productId].revenue += i.price * i.qty;
      perProduct[i.productId].cost += cost * i.qty;
    }));

    const profit = revenue - cogs;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    Utils.qs('#profit-report-summary').innerHTML = `
      <div class="stat-card"><div class="stat-label">Revenue</div><div class="stat-value">${Utils.currency(revenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Cost of goods</div><div class="stat-value">${Utils.currency(cogs)}</div></div>
      <div class="stat-card"><div class="stat-label">Gross profit</div><div class="stat-value">${Utils.currency(profit)}</div></div>
      <div class="stat-card"><div class="stat-label">Margin</div><div class="stat-value">${margin.toFixed(1)}%</div></div>`;

    const rows = Object.values(perProduct).sort((a, b) => b.revenue - a.revenue);
    const tbody = Utils.qs('#profit-report-tbody');
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty">No sales recorded yet.</div></td></tr>`; return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${r.image || 'assets/images/products/placeholder.svg'}" class="product-thumb-sm" alt="${r.name}" onerror="this.src='assets/images/products/placeholder.svg'">
            <span><strong>${r.name}</strong></span>
          </div>
        </td>
        <td class="mono">${r.qty}</td>
        <td class="mono">${Utils.currency(r.revenue)}</td>
        <td class="mono"><strong>${Utils.currency(r.revenue - r.cost)}</strong></td>
        <td class="mono">${r.revenue ? (((r.revenue - r.cost) / r.revenue) * 100).toFixed(1) : 0}%</td>
      </tr>`).join('');
  }

  function exportSalesCSV() {
    const sales = Storage.Sales.all();
    const customers = Storage.Customers.all();
    const rows = sales.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      return {
        'Invoice ID': s.id,
        'Date': s.date,
        'Customer': cust ? cust.name : 'Walk-in',
        'Items Count': s.items.reduce((n, i) => n + i.qty, 0),
        'Discount': s.discount,
        'Tax': s.tax,
        'Total': s.total
      };
    });
    Utils.downloadFile('sales-report.csv', Utils.toCSV(rows), 'text/csv');
    Utils.toast('Sales report exported to CSV', 'success');
  }

  function exportStockCSV() {
    const products = Storage.Products.all();
    const rows = products.map(p => ({
      'Product': p.name,
      'Category': p.category || '',
      'Barcode': p.barcode || '',
      'Price': p.price,
      'Cost': p.cost || 0,
      'Stock': p.stock,
      'Stock Value': (p.stock * p.price).toFixed(2),
      'Status': Inventory.stockStatus(p)
    }));
    Utils.downloadFile('stock-report.csv', Utils.toCSV(rows), 'text/csv');
    Utils.toast('Stock report exported to CSV', 'success');
  }

  function exportProfitCSV() {
    const sales = Storage.Sales.all();
    const products = Storage.Products.all();
    const perProduct = {};
    sales.forEach(s => s.items.forEach(i => {
      const product = products.find(p => p.id === i.productId);
      const cost = product ? Number(product.cost) || 0 : 0;
      if (!perProduct[i.productId]) perProduct[i.productId] = { name: i.name, qty: 0, revenue: 0, cost: 0 };
      perProduct[i.productId].qty += i.qty;
      perProduct[i.productId].revenue += i.price * i.qty;
      perProduct[i.productId].cost += cost * i.qty;
    }));
    const rows = Object.values(perProduct).map(r => ({
      'Product': r.name,
      'Units Sold': r.qty,
      'Revenue': r.revenue.toFixed(2),
      'COGS': r.cost.toFixed(2),
      'Gross Profit': (r.revenue - r.cost).toFixed(2),
      'Margin %': r.revenue ? (((r.revenue - r.cost) / r.revenue) * 100).toFixed(1) : '0.0'
    }));
    Utils.downloadFile('profit-report.csv', Utils.toCSV(rows), 'text/csv');
    Utils.toast('Profit report exported to CSV', 'success');
  }

  return { init };
})();
