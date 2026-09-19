/* app.js — renders the shared shell (sidebar + topbar) on every page,
   handles the dark-mode toggle, keyboard shortcuts, and drives the dashboard (index.html) in real-time. */

const App = (() => {

  const ICONS = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="6" width="13" height="11"/><path d="M14 10h4l4 4v3h-8z"/><circle cx="6" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 13.2c2.8.4 5 2.6 5 5.8"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="12" height="18"/><path d="M16 8h4v13h-4"/><path d="M8 7h.01M12 7h.01M8 11h.01M12 11h.01M8 15h.01M12 15h.01"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V10M12 19V5M20 19v-7"/><path d="M2 19h20"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.3 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1L11 21h4l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2 12h2.4M19.6 12H22M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/></svg>'
  };

  const NAV = [
    { id: 'dashboard', href: 'index.html', label: 'Dashboard', icon: 'grid' },
    { id: 'products', href: 'products.html', label: 'Products', icon: 'box' },
    { id: 'sales', href: 'sales.html', label: 'Sales', icon: 'cart' },
    { id: 'purchases', href: 'purchases.html', label: 'Purchases', icon: 'truck' },
    { id: 'customers', href: 'customers.html', label: 'Customers', icon: 'users' },
    { id: 'suppliers', href: 'suppliers.html', label: 'Suppliers', icon: 'building' },
    { id: 'reports', href: 'reports.html', label: 'Reports', icon: 'chart' },
    { id: 'settings', href: 'settings.html', label: 'Settings', icon: 'settings' }
  ];

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function initTheme() {
    const settings = Storage.getSettings();
    applyTheme(settings.theme || 'light');
  }

  function toggleTheme() {
    const settings = Storage.getSettings();
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    Storage.saveSettings({ theme: next });
    applyTheme(next);
    const btn = Utils.qs('#theme-toggle');
    if (btn) btn.innerHTML = ICONS[next === 'dark' ? 'sun' : 'moon'];
  }

  function renderSidebar(activeId) {
    const root = Utils.qs('#sidebar-root');
    if (!root) return;
    const links = NAV.map(item => `
      <a class="nav-link ${item.id === activeId ? 'is-active' : ''}" href="${item.href}">
        <span class="icon">${ICONS[item.icon]}</span>${item.label}
      </a>`).join('');
    const settings = Storage.getSettings();
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const storeName = (user && user.storeName) || settings.storeName || 'My Store';
    const userName = (user && user.name) || 'Admin User';
    const userRole = (user && user.role) || 'Administrator';
    const initials = Utils.initials(userName);

    root.innerHTML = `
      <aside class="sidebar">
        <div class="brand">
          <img src="assets/images/logo.png" alt="Logo"
            style="width:34px; height:34px; object-fit:contain; border-radius:6px; flex-shrink:0;">
          <div>
            <div class="brand-name">Smart Inventory</div>
            <div class="brand-sub">${storeName}</div>
          </div>
        </div>
        <nav class="nav">${links}</nav>
        <div class="sidebar-foot" style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:50%; background:var(--accent); color:var(--accent-ink); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; flex-shrink:0;">${initials}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userName}</div>
              <div class="field-hint" style="font-size:10.5px; margin:0;">${userRole}</div>
            </div>
          </div>
        </div>
      </aside>`;
  }

  function renderTopbar(title, eyebrow, opts) {
    const root = Utils.qs('#topbar-root');
    if (!root) return;
    const showSearch = opts && opts.search;
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const userName = (user && user.name) || 'Admin';
    const initials = Utils.initials(userName);

    root.innerHTML = `
      <header class="topbar">
        <div class="topbar-title"><span class="eyebrow">${eyebrow || ''}</span>${title}</div>
        ${showSearch ? `<div class="topbar-search"><input id="global-search" type="text" placeholder="${opts.searchPlaceholder || 'Search… (or press /)'}" /></div>` : '<div class="spacer"></div>'}
        <div class="topbar-actions" style="display:flex; align-items:center; gap:10px;">
          <div class="live-badge" title="Real-time multi-tab sync active">
            <span class="live-dot"></span> Live
          </div>
          <button class="icon-btn" id="theme-toggle" title="Toggle dark mode"></button>
          <div style="display:flex; align-items:center; gap:6px; padding:3px 8px 3px 6px; background:var(--paper); border:1px solid var(--line); border-radius:20px;">
            <span style="width:22px; height:22px; border-radius:50%; background:var(--accent); color:var(--accent-ink); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:10px;">${initials}</span>
            <button class="btn btn-ghost btn-sm" id="logout-btn" title="Sign out" style="padding:2px 6px; font-size:11.5px;">Logout</button>
          </div>
        </div>
      </header>`;
    const settings = Storage.getSettings();
    Utils.qs('#theme-toggle').innerHTML = ICONS[settings.theme === 'dark' ? 'sun' : 'moon'];
    Utils.qs('#theme-toggle').addEventListener('click', toggleTheme);
    const logoutBtn = Utils.qs('#logout-btn');
    if (logoutBtn && typeof Auth !== 'undefined') {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }
  }

  function bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay.is-open');
        if (openModal) {
          openModal.classList.remove('is-open');
        }
      }
      // Slash '/' or Ctrl+K focuses search
      if ((e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault();
        const searchInput = Utils.qs('#global-search') || Utils.qs('#product-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  function renderShell(activeId, title, eyebrow, opts) {
    if (typeof Auth !== 'undefined') {
      if (!Auth.requireAuth()) return;
    }
    Storage.seedIfEmpty();
    initTheme();
    renderSidebar(activeId);
    renderTopbar(title, eyebrow, opts);
    bindKeyboardShortcuts();
  }

  // ---------------- Dashboard ----------------
  function initDashboard() {
    updateDashboardData();

    // Real-Time dashboard updates across all tabs
    Storage.on('sales_changed', () => updateDashboardData());
    Storage.on('stock_changed', () => updateDashboardData());
    Storage.on('products_changed', () => updateDashboardData());
    Storage.on('purchases_changed', () => updateDashboardData());
    Storage.on('all_changed', () => updateDashboardData());
  }

  function updateDashboardData() {
    const products = Storage.Products.all();
    const sales = Storage.Sales.all();

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const todaysSales = sales.filter(s => Utils.isToday(s.date)).reduce((sum, s) => sum + Number(s.total || 0), 0);
    const lowStock = products.filter(p => Number(p.stock) <= Number(p.lowStockThreshold || 0));

    if (Utils.qs('#stat-total-products')) {
      Utils.qs('#stat-total-products').textContent = totalProducts;
      Utils.qs('#stat-total-products-sub').textContent = Utils.currency(totalStockValue) + ' in stock value';
      Utils.qs('#stat-total-sales').textContent = Utils.currency(totalSales);
      Utils.qs('#stat-total-sales-sub').textContent = sales.length + ' invoices total';
      Utils.qs('#stat-today-sales').textContent = Utils.currency(todaysSales);
      Utils.qs('#stat-today-sales-sub').textContent = sales.filter(s => Utils.isToday(s.date)).length + ' invoices today';
      Utils.qs('#stat-low-stock').textContent = lowStock.length;
      Utils.qs('#stat-low-stock-sub').textContent = lowStock.length ? 'Needs restocking' : 'All stocked up';

      renderSalesChart(sales);
      renderLowStockList(lowStock);
      renderRecentTransactions(sales.slice(0, 6));
    }
  }

  function renderSalesChart(sales) {
    const host = Utils.qs('#sales-chart');
    if (!host) return;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const totals = days.map(d => sales
      .filter(s => new Date(s.date).toDateString() === d.toDateString())
      .reduce((sum, s) => sum + Number(s.total || 0), 0));
    const max = Math.max(1, ...totals);

    host.innerHTML = days.map((d, i) => `
      <div class="bar-col">
        <div class="bar" style="height:${Math.max(4, (totals[i] / max) * 140)}px">
          <span class="bar-value">${totals[i] ? Utils.currency(totals[i]) : ''}</span>
        </div>
        <span class="bar-label">${d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
      </div>`).join('');
  }

  function renderLowStockList(items) {
    const host = Utils.qs('#low-stock-list');
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<div class="empty-state"><div class="glyph">✓</div>Every product is above its reorder point.</div>';
      return;
    }
    host.innerHTML = items.slice(0, 8).map(p => `
      <div class="low-stock-row" style="display:flex; align-items:center; gap:10px;">
        <img src="${p.image || 'assets/images/products/placeholder.svg'}" class="product-thumb-sm" alt="${p.name}" onerror="this.src='assets/images/products/placeholder.svg'">
        <span class="name" style="flex:1;">${p.name}</span>
        <span class="qty">${p.stock} left</span>
      </div>`).join('');
  }

  function renderRecentTransactions(sales) {
    const host = Utils.qs('#recent-transactions');
    if (!host) return;
    if (!sales.length) {
      host.innerHTML = '<div class="empty-state"><div class="glyph">🧾</div>No sales recorded yet.</div>';
      return;
    }
    const customers = Storage.Customers.all();
    host.innerHTML = sales.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      const itemCount = s.items.reduce((n, i) => n + Number(i.qty), 0);
      return `
      <div class="activity-row">
        <div class="activity-icon">🧾</div>
        <div class="activity-main">
          <div class="activity-title">${cust ? cust.name : 'Walk-in Customer'}</div>
          <div class="activity-sub">${itemCount} item${itemCount === 1 ? '' : 's'} · ${Utils.formatDateTime(s.date)}</div>
        </div>
        <div class="activity-amount">${Utils.currency(s.total)}</div>
      </div>`;
    }).join('');
  }

  return { renderShell, initDashboard, toggleTheme, ICONS };
})();
