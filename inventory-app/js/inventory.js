/* inventory.js — stock movement logic shared by the Products and
   Purchases pages: stock in, stock out, and the movement history log. */

const Inventory = (() => {

  function stockIn(productId, qty, reason, ref) {
    qty = Math.abs(Number(qty) || 0);
    if (!qty) return null;
    const product = Storage.Products.adjustStock(productId, qty);
    Storage.StockHistory.add({
      id: Utils.uid('mov'),
      date: Utils.todayISO(),
      productId,
      type: 'in',
      qty,
      reason: reason || 'Manual stock in',
      ref: ref || null
    });
    return product;
  }

  function stockOut(productId, qty, reason, ref) {
    qty = Math.abs(Number(qty) || 0);
    if (!qty) return null;
    const product = Storage.Products.adjustStock(productId, -qty);
    Storage.StockHistory.add({
      id: Utils.uid('mov'),
      date: Utils.todayISO(),
      productId,
      type: 'out',
      qty,
      reason: reason || 'Manual stock out',
      ref: ref || null
    });
    return product;
  }

  function historyForProduct(productId) {
    return Storage.StockHistory.forProduct(productId);
  }

  function lowStockItems() {
    return Storage.Products.all().filter(p => Number(p.stock) <= Number(p.lowStockThreshold || 0));
  }

  function stockStatus(product) {
    const stock = Number(product.stock) || 0;
    const threshold = Number(product.lowStockThreshold) || 0;
    if (stock <= 0) return 'out';
    if (stock <= threshold) return 'low';
    return 'ok';
  }

  return { stockIn, stockOut, historyForProduct, lowStockItems, stockStatus };
})();
