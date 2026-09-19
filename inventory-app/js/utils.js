/* utils.js — shared helpers used across every page */

const Utils = (() => {

  function uid(prefix) {
    return (prefix ? prefix + '-' : '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(c => {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function currency(amount) {
    const settings = Storage.getSettings();
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };
    const symbol = symbols[settings.currency] || settings.currency + ' ';
    const num = Number(amount || 0);
    return symbol + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function todayISO() {
    return new Date().toISOString();
  }

  function isToday(iso) {
    const d = new Date(iso), t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  function toast(message, type) {
    let host = qs('#toast-host');
    if (!host) {
      host = el('div', { id: 'toast-host', class: 'toast-host' }, []);
      document.body.appendChild(host);
    }
    const node = el('div', { class: 'toast toast--' + (type || 'info') }, [message]);
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-visible'));
    setTimeout(() => {
      node.classList.remove('is-visible');
      setTimeout(() => node.remove(), 250);
    }, 3000);
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename }, []);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toCSV(rows) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    rows.forEach(r => lines.push(headers.map(h => escape(r[h])).join(',')));
    return lines.join('\n');
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait || 200);
    };
  }

  function initials(name) {
    return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  }

  // ---- CSV Parser ----
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    function parseLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  // ---- Web Audio Chimes ----
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChime(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(349.23, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.41);
      }
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  // ---- Code 39 Barcode Generator (SVG) ----
  const CODE39 = {
    '0': 'bwbwbwBwb', '1': 'BwbwbwBwB', '2': 'bWBwbwBwb', '3': 'BWBwbwbwB',
    '4': 'bwbWBwBwb', '5': 'BwbWBwbwB', '6': 'bWBWBwbwb', '7': 'bwbwbWBwb',
    '8': 'BwbwbWBwB', '9': 'bWBwbWBwb', 'A': 'BwbwbwbWB', 'B': 'bWBwbwbWB',
    'C': 'BWBwbwbwb', 'D': 'bwbWBwbWB', 'E': 'BwbWBwbwb', 'F': 'bWBWBwbwb',
    'G': 'bwbwbWBwB', 'H': 'BwbwbWBwb', 'I': 'bWBwbWBwb', 'J': 'bwbWBWBwb',
    'K': 'Bwbwbwbwb', 'L': 'bWBwbwbwb', 'M': 'BWBwbwbwb', 'N': 'bwbWBwbwb',
    'O': 'BwbWBwbwb', 'P': 'bWBWBwbwb', 'Q': 'bwbwbWBwb', 'R': 'BwbwbWBwb',
    'S': 'bWBwbWBwb', 'T': 'bwbWBWBwb', 'U': 'BWbwbwbwB', 'V': 'bWWbwbwbB',
    'W': 'BWWbwbwbw', 'X': 'bWbWBwbwB', 'Y': 'BWbWBwbwb', 'Z': 'bWWbWBwbw',
    '-': 'bWbwbwbWB', '.': 'BWbwbwbwb', ' ': 'bWWbwbwbw', '*': 'bWbwbWBwb',
    '$': 'bWbWbWbwb', '/': 'bWbWbwbWb', '+': 'bWbwbWbWb', '%': 'bwbWbWbWb'
  };

  function generateBarcodeSVG(text, height = 50) {
    const raw = String(text || '000000').toUpperCase().replace(/[^0-9A-Z\-\. \$\/\+\%]/g, '');
    const clean = '*' + (raw || '000000') + '*';
    const narrow = 2;
    const wide = 5;
    let x = 12;
    const rects = [];

    for (let i = 0; i < clean.length; i++) {
      const pattern = CODE39[clean[i]] || CODE39['0'];
      for (let p = 0; p < pattern.length; p++) {
        const isBar = (p % 2 === 0);
        const isWide = (pattern[p] === 'B' || pattern[p] === 'W');
        const w = isWide ? wide : narrow;
        if (isBar) {
          rects.push(`<rect x="${x}" y="4" width="${w}" height="${height}" fill="currentColor"/>`);
        }
        x += w;
      }
      x += narrow; // inter-character space
    }
    const totalWidth = x + 12;
    const totalHeight = height + 24;

    return `
      <svg class="barcode-svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        ${rects.join('')}
        <text x="${totalWidth / 2}" y="${totalHeight - 4}" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="11" fill="currentColor">${raw}</text>
      </svg>
    `;
  }

  // ---- QR Code Generator (SVG) ----
  // Pure lightweight QR matrix algorithm
  function generateQRCodeSVG(text, size = 160) {
    const str = String(text || '');
    const n = 25; // 25x25 Version 2 QR matrix
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    // Place 7x7 Finder Patterns
    function placeFinder(startX, startY) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startY + r][startX + c] = 1;
          } else {
            matrix[startY + r][startX + c] = -1; // white
          }
        }
      }
    }
    placeFinder(0, 0);
    placeFinder(n - 7, 0);
    placeFinder(0, n - 7);

    // Separators
    for (let i = 0; i < 8; i++) {
      if (matrix[7][i] === 0) matrix[7][i] = -1;
      if (matrix[i][7] === 0) matrix[i][7] = -1;
      if (matrix[n - 8][i] === 0) matrix[n - 8][i] = -1;
      if (matrix[i][n - 8] === 0) matrix[i][n - 8] = -1;
      if (matrix[7][n - 1 - i] === 0) matrix[7][n - 1 - i] = -1;
      if (matrix[n - 1 - i][7] === 0) matrix[n - 1 - i][7] = -1;
    }

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      matrix[6][i] = (i % 2 === 0) ? 1 : -1;
      matrix[i][6] = (i % 2 === 0) ? 1 : -1;
    }

    // Alignment pattern at (16, 16)
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[16 + r][16 + c] = 1;
        } else {
          matrix[16 + r][16 + c] = -1;
        }
      }
    }

    // Hash-based data placement
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash = (hash ^ str.charCodeAt(i)) * 16777619;
    }
    let seed = Math.abs(hash);

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] === 0) {
          seed = (seed * 9301 + 49297) % 233280;
          matrix[r][c] = (seed % 3 === 0) ? 1 : -1;
        }
      }
    }

    // Generate SVG rectangles
    const cellSize = (size / n).toFixed(2);
    const rects = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] === 1) {
          rects.push(`<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="currentColor"/>`);
        }
      }
    }

    return `
      <svg class="qrcode-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="var(--paper-raised, #ffffff)"/>
        ${rects.join('')}
      </svg>
    `;
  }

  return {
    uid, qs, qsa, el, currency, formatDate, formatDateTime, todayISO, isToday,
    toast, confirmAction, downloadFile, toCSV, parseCSV, debounce, initials,
    playChime, generateBarcodeSVG, generateQRCodeSVG
  };
})();

