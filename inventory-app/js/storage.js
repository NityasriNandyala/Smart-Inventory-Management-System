/* storage.js — the entire data layer. Everything lives in localStorage
   under the "sims_*" (Smart Inventory Management System) namespace.
   Includes Real-Time BroadcastChannel sync and Product Images. */

const Storage = (() => {

  const KEYS = {
    products: 'sims_products',
    customers: 'sims_customers',
    suppliers: 'sims_suppliers',
    sales: 'sims_sales',
    purchases: 'sims_purchases',
    stockHistory: 'sims_stock_history',
    settings: 'sims_settings',
    seeded: 'sims_seeded'
  };

  // ---- Real-Time Event Broadcaster ----
  const channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('sims_realtime_channel') : null;
  const eventListeners = {};

  function emit(event, payload) {
    if (channel) {
      try {
        channel.postMessage({ event, payload });
      } catch (err) {
        console.warn('Realtime channel broadcast warning:', err);
      }
    }
    triggerLocal(event, payload);
  }

  function triggerLocal(event, payload) {
    if (eventListeners[event]) {
      eventListeners[event].forEach(fn => {
        try { fn(payload); } catch (e) { console.error(e); }
      });
    }
    if (event !== '*' && eventListeners['*']) {
      eventListeners['*'].forEach(fn => {
        try { fn({ event, payload }); } catch (e) { console.error(e); }
      });
    }
  }

  if (channel) {
    channel.onmessage = (msg) => {
      const { event, payload } = msg.data || {};
      if (event) {
        triggerLocal(event, payload);
      }
    };
  }

  // Cross-tab fallback listener
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('sims_')) {
      const eventMap = {
        'sims_products': 'products_changed',
        'sims_sales': 'sales_changed',
        'sims_purchases': 'purchases_changed',
        'sims_stock_history': 'stock_changed',
        'sims_customers': 'customers_changed',
        'sims_suppliers': 'suppliers_changed',
        'sims_settings': 'settings_changed'
      };
      const eventName = eventMap[e.key] || 'all_changed';
      triggerLocal(eventName, { key: e.key });
    }
  });

  function on(event, callback) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(callback);
    return () => {
      eventListeners[event] = eventListeners[event].filter(fn => fn !== callback);
    };
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      return false;
    }
  }

  function list(key) { return read(key) || []; }

  // ---- generic CRUD ----
  function insert(key, record) {
    const items = list(key);
    items.push(record);
    write(key, items);
    return record;
  }

  function update(key, id, patch) {
    const items = list(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = Object.assign({}, items[idx], patch);
    write(key, items);
    return items[idx];
  }

  function remove(key, id) {
    const items = list(key).filter(i => i.id !== id);
    write(key, items);
  }

  function findById(key, id) {
    return list(key).find(i => i.id === id) || null;
  }

  // ---- settings ----
  function getSettings() {
    return read(KEYS.settings) || {
      storeName: 'My Store',
      currency: 'USD',
      taxRate: 0,
      soundEnabled: true,
      theme: 'light'
    };
  }
  function saveSettings(settings) {
    const next = Object.assign({}, getSettings(), settings);
    write(KEYS.settings, next);
    emit('settings_changed', next);
  }

  // ---- products ----
  const Products = {
    all: () => list(KEYS.products),
    get: (id) => findById(KEYS.products, id),
    add: (p) => {
      const rec = insert(KEYS.products, p);
      emit('products_changed', { action: 'add', record: rec });
      return rec;
    },
    update: (id, patch) => {
      const rec = update(KEYS.products, id, patch);
      emit('products_changed', { action: 'update', record: rec });
      return rec;
    },
    delete: (id) => {
      remove(KEYS.products, id);
      emit('products_changed', { action: 'delete', id });
    },
    adjustStock: (id, delta) => {
      const p = findById(KEYS.products, id);
      if (!p) return null;
      const newStock = Math.max(0, (Number(p.stock) || 0) + delta);
      const rec = update(KEYS.products, id, { stock: newStock });
      emit('stock_changed', { productId: id, newStock, delta });
      emit('products_changed', { action: 'stock', record: rec });
      return rec;
    }
  };

  // ---- customers ----
  const Customers = {
    all: () => list(KEYS.customers),
    get: (id) => findById(KEYS.customers, id),
    add: (c) => {
      const rec = insert(KEYS.customers, c);
      emit('customers_changed', rec);
      return rec;
    },
    update: (id, patch) => {
      const rec = update(KEYS.customers, id, patch);
      emit('customers_changed', rec);
      return rec;
    },
    delete: (id) => {
      remove(KEYS.customers, id);
      emit('customers_changed', { id });
    }
  };

  // ---- suppliers ----
  const Suppliers = {
    all: () => list(KEYS.suppliers),
    get: (id) => findById(KEYS.suppliers, id),
    add: (s) => {
      const rec = insert(KEYS.suppliers, s);
      emit('suppliers_changed', rec);
      return rec;
    },
    update: (id, patch) => {
      const rec = update(KEYS.suppliers, id, patch);
      emit('suppliers_changed', rec);
      return rec;
    },
    delete: (id) => {
      remove(KEYS.suppliers, id);
      emit('suppliers_changed', { id });
    }
  };

  // ---- sales ----
  const Sales = {
    all: () => list(KEYS.sales).sort((a, b) => new Date(b.date) - new Date(a.date)),
    get: (id) => findById(KEYS.sales, id),
    add: (s) => {
      const rec = insert(KEYS.sales, s);
      emit('sales_changed', { action: 'add', record: rec });
      return rec;
    },
    delete: (id) => {
      remove(KEYS.sales, id);
      emit('sales_changed', { action: 'delete', id });
    }
  };

  // ---- purchases ----
  const Purchases = {
    all: () => list(KEYS.purchases).sort((a, b) => new Date(b.date) - new Date(a.date)),
    get: (id) => findById(KEYS.purchases, id),
    add: (p) => {
      const rec = insert(KEYS.purchases, p);
      emit('purchases_changed', { action: 'add', record: rec });
      return rec;
    },
    delete: (id) => {
      remove(KEYS.purchases, id);
      emit('purchases_changed', { action: 'delete', id });
    }
  };

  // ---- stock history ----
  const StockHistory = {
    all: () => list(KEYS.stockHistory).sort((a, b) => new Date(b.date) - new Date(a.date)),
    forProduct: (productId) => StockHistory.all().filter(h => h.productId === productId),
    add: (entry) => {
      const rec = insert(KEYS.stockHistory, entry);
      emit('stock_history_changed', rec);
      return rec;
    }
  };

  const DEFAULT_PRODUCT_IMAGES = {
    'Ceylon Black Tea 250g': 'assets/images/products/tea.svg',
    'Filter Coffee Powder 200g': 'assets/images/products/coffee.svg',
    'Multigrain Biscuits': 'assets/images/products/biscuits.svg',
    'Roasted Peanuts 100g': 'assets/images/products/peanuts.svg',
    'A4 Notebook 200pg': 'assets/images/products/notebook.svg',
    'Gel Pens (Pack of 5)': 'assets/images/products/pens.svg',
    'USB-C Cable 1m': 'assets/images/products/cable.svg',
    'LED Bulb 9W': 'assets/images/products/bulb.svg',
    'Dish Wash Liquid 500ml': 'assets/images/products/dishwash.svg',
    'Floor Cleaner 1L': 'assets/images/products/cleaner.svg'
  };

  // ---- seed sample data on first run ----
  function seedIfEmpty() {
    const isSeeded = read(KEYS.seeded);
    
    // Auto-migrate if already seeded without images
    if (isSeeded) {
      const existingProducts = list(KEYS.products);
      let needsMigration = false;
      const updated = existingProducts.map(p => {
        if (!p.image) {
          needsMigration = true;
          return Object.assign({}, p, {
            image: DEFAULT_PRODUCT_IMAGES[p.name] || 'assets/images/products/placeholder.svg'
          });
        }
        return p;
      });
      if (needsMigration) {
        write(KEYS.products, updated);
      }
      return;
    }

    const sampleProducts = [
      { name: 'Ceylon Black Tea 250g', category: 'Beverages', price: 4.5, cost: 2.6, stock: 42, lowStockThreshold: 10, barcode: '8901030', image: 'assets/images/products/tea.svg' },
      { name: 'Filter Coffee Powder 200g', category: 'Beverages', price: 6.2, cost: 3.8, stock: 18, lowStockThreshold: 10, barcode: '8901031', image: 'assets/images/products/coffee.svg' },
      { name: 'Multigrain Biscuits', category: 'Snacks', price: 1.8, cost: 1.0, stock: 8, lowStockThreshold: 15, barcode: '8901032', image: 'assets/images/products/biscuits.svg' },
      { name: 'Roasted Peanuts 100g', category: 'Snacks', price: 1.2, cost: 0.6, stock: 60, lowStockThreshold: 20, barcode: '8901033', image: 'assets/images/products/peanuts.svg' },
      { name: 'A4 Notebook 200pg', category: 'Stationery', price: 2.5, cost: 1.4, stock: 30, lowStockThreshold: 12, barcode: '8901034', image: 'assets/images/products/notebook.svg' },
      { name: 'Gel Pens (Pack of 5)', category: 'Stationery', price: 3.0, cost: 1.6, stock: 5, lowStockThreshold: 10, barcode: '8901035', image: 'assets/images/products/pens.svg' },
      { name: 'USB-C Cable 1m', category: 'Electronics', price: 7.5, cost: 4.0, stock: 22, lowStockThreshold: 8, barcode: '8901036', image: 'assets/images/products/cable.svg' },
      { name: 'LED Bulb 9W', category: 'Electronics', price: 3.9, cost: 2.1, stock: 40, lowStockThreshold: 15, barcode: '8901037', image: 'assets/images/products/bulb.svg' },
      { name: 'Dish Wash Liquid 500ml', category: 'Household', price: 2.8, cost: 1.5, stock: 14, lowStockThreshold: 12, barcode: '8901038', image: 'assets/images/products/dishwash.svg' },
      { name: 'Floor Cleaner 1L', category: 'Household', price: 4.1, cost: 2.3, stock: 3, lowStockThreshold: 10, barcode: '8901039', image: 'assets/images/products/cleaner.svg' }
    ].map(p => Object.assign({ id: Utils.uid('prd') }, p));
    write(KEYS.products, sampleProducts);

    const sampleCustomers = ['Aarav Menon', 'Priya Nair', 'Walk-in Customer'].map(name =>
      ({ id: Utils.uid('cus'), name, phone: '', email: '' }));
    write(KEYS.customers, sampleCustomers);

    const sampleSuppliers = ['Sunrise Distributors', 'Metro Wholesale Co.'].map(name =>
      ({ id: Utils.uid('sup'), name, phone: '', email: '' }));
    write(KEYS.suppliers, sampleSuppliers);

    // A few historical sales across the last 6 days for the dashboard chart
    const sales = [];
    const custIds = sampleCustomers.map(c => c.id);
    for (let dayBack = 6; dayBack >= 0; dayBack--) {
      const d = new Date();
      d.setDate(d.getDate() - dayBack);
      const numSales = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numSales; i++) {
        const item = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const qty = 1 + Math.floor(Math.random() * 4);
        const subtotal = item.price * qty;
        const tax = subtotal * 0.05;
        d.setHours(9 + i, 15 * i, 0);
        sales.push({
          id: Utils.uid('sale'),
          date: d.toISOString(),
          customerId: custIds[Math.floor(Math.random() * custIds.length)],
          items: [{ productId: item.id, name: item.name, price: item.price, qty, image: item.image }],
          discount: 0,
          tax: Number(tax.toFixed(2)),
          total: Number((subtotal + tax).toFixed(2))
        });
      }
    }
    write(KEYS.sales, sales);
    write(KEYS.stockHistory, []);
    write(KEYS.settings, { storeName: 'My Store', currency: 'USD', taxRate: 5, theme: 'light', soundEnabled: true });
    write(KEYS.seeded, true);
  }

  function exportAll() {
    const dump = {};
    Object.entries(KEYS).forEach(([name, key]) => { dump[name] = read(key); });
    return JSON.stringify(dump, null, 2);
  }

  function importAll(json) {
    const dump = JSON.parse(json);
    Object.entries(KEYS).forEach(([name, key]) => {
      if (dump[name] !== undefined) write(key, dump[name]);
    });
    emit('all_changed', dump);
  }

  function wipeAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    emit('all_changed', null);
  }

  return {
    KEYS, getSettings, saveSettings,
    Products, Customers, Suppliers, Sales, Purchases, StockHistory,
    DEFAULT_PRODUCT_IMAGES,
    on, emit,
    seedIfEmpty, exportAll, importAll, wipeAll
  };
})();
