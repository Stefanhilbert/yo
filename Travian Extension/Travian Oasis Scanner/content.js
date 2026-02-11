(function () {
  'use strict';

  const BONUS_MAP = { r1: 'Lumber', r2: 'Clay', r3: 'Iron', r4: 'Crop' };
  const STORAGE_KEY_OASES = 'travian_oasis_oases';
  const STORAGE_KEY_VILLAGES = 'travian_oasis_villages';

  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  function getCoordsInRadius(vx, vy, radius) {
    const coords = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = vx + dx;
        const y = vy + dy;
        if (distance(vx, vy, x, y) <= radius) {
          coords.push({ x: x, y: y });
        }
      }
    }
    return coords;
  }

  let scanAbortFlag = false;

  function scanRadiusByApi(refVillage, maxRadius, onProgress, onComplete) {
    scanAbortFlag = false;
    const coords = getCoordsInRadius(refVillage.x, refVillage.y, maxRadius);
    const total = coords.length;
    let index = 0;
    const url = window.location.origin + '/api/v1/map/tile-details';
    function next() {
      if (scanAbortFlag || index >= total) {
        onComplete();
        return;
      }
      const c = coords[index];
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
        body: JSON.stringify({ x: c.x, y: c.y }),
        credentials: 'include'
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.html && data.html.indexOf('oasis') >= 0) {
          handleTileDetailsApi(data);
        }
        index += 1;
        onProgress(index, total);
        const delay = 80 + Math.random() * 40;
        setTimeout(next, delay);
      }).catch(function () {
        index += 1;
        onProgress(index, total);
        setTimeout(next, 80 + Math.random() * 40);
      });
    }
    next();
  }

  function parseCoord(el) {
    if (!el) return null;
    const t = (el.textContent || '').replace(/[^\d-]/g, '');
    return t === '' ? null : parseInt(t, 10);
  }

  function extractCoordsFromElement(el) {
    if (!el) return null;
    const dataX = el.getAttribute('data-x');
    const dataY = el.getAttribute('data-y');
    if (dataX != null && dataY != null) {
      return { x: parseInt(dataX, 10), y: parseInt(dataY, 10) };
    }
    const link = el.querySelector && el.querySelector('a[href*="karte.php"], a[href*="kid="]') || (el.tagName === 'A' ? el : null);
    const href = link ? (link.getAttribute('href') || '') : '';
    const xM = href.match(/[?&]x=(-?\d+)/);
    const yM = href.match(/[?&]y=(-?\d+)/);
    if (xM && yM) return { x: parseInt(xM[1], 10), y: parseInt(yM[1], 10) };
    const kidM = href.match(/[?&]kid=(\d+)/);
    if (kidM) {
      const kid = parseInt(kidM[1], 10);
      const size = 401;
      const h = Math.floor(size / 2);
      return { x: (kid % size) - h, y: Math.floor(kid / size) - h };
    }
    return null;
  }

  function isOasisElement(el) {
    if (!el) return false;
    if (el.getAttribute && el.getAttribute('data-type') === 'oasis') return true;
    const c = (el.className || '') + ' ' + (el.getAttribute && el.getAttribute('class') || '');
    return /oasis/i.test(c);
  }

  function scanVisibleOases(maxRadius, refVillage) {
    const oasesFound = [];
    const seen = {};
    const mapContainer = document.querySelector('#mapContainer, #map, .mapContainer, .map, [id*="map"]') || document.body;

    function addOasis(x, y, element) {
      const id = x + ',' + y;
      if (seen[id]) return;
      seen[id] = true;
      if (maxRadius != null && refVillage) {
        const d = distance(x, y, refVillage.x, refVillage.y);
        if (d > maxRadius) return;
      }
      oasesFound.push({ x: parseInt(x, 10), y: parseInt(y, 10), id, element });
    }

    const oasisSelectors = '.oasis, [class*="oasis"], .mapTile.oasis, .tile.oasis, [data-type="oasis"]';
    const oasisTiles = mapContainer.querySelectorAll(oasisSelectors);
    oasisTiles.forEach(function (tile) {
      if (!isOasisElement(tile)) return;
      const coords = extractCoordsFromElement(tile);
      if (coords) addOasis(coords.x, coords.y, tile);
    });

    const karteLinks = mapContainer.querySelectorAll('a[href*="karte.php"], a[href*="kid="]');
    karteLinks.forEach(function (a) {
      const oasisParent = a.closest(oasisSelectors);
      if (!oasisParent) return;
      const coords = extractCoordsFromElement(a) || extractCoordsFromElement(oasisParent);
      if (coords) addOasis(coords.x, coords.y, a);
    });

    const tilesWithCoords = mapContainer.querySelectorAll('[data-x][data-y]');
    tilesWithCoords.forEach(function (tile) {
      if (!isOasisElement(tile) && tile.getAttribute('data-type') !== 'oasis') return;
      const coords = extractCoordsFromElement(tile);
      if (coords) addOasis(coords.x, coords.y, tile);
    });

    return oasesFound;
  }

  function parseVillages() {
    const villages = [];
    const entries = document.querySelectorAll('.villageList .listEntry.village, .dropContainer .listEntry.village');
    entries.forEach(function (entry) {
      const xEl = entry.querySelector('.coordinateX');
      const yEl = entry.querySelector('.coordinateY');
      const x = parseCoord(xEl);
      const y = parseCoord(yEl);
      if (x === null || y === null) return;
      const nameEl = entry.querySelector('.name');
      const name = (nameEl ? nameEl.textContent || '' : '').trim() || 'Village';
      const isActive = entry.classList.contains('active');
      const did = entry.getAttribute('data-did') || '';
      villages.push({ x, y, name, isActive, did });
    });
    return villages;
  }

  function parseOasis(tileDetails) {
    if (!tileDetails || !tileDetails.classList.contains('oasis')) return null;

    const xEl = tileDetails.querySelector('.coordinateX');
    const yEl = tileDetails.querySelector('.coordinateY');
    const x = parseCoord(xEl);
    const y = parseCoord(yEl);
    if (x === null || y === null) return null;

    const titleEl = tileDetails.querySelector('.titleInHeader');
    const titleText = titleEl ? (titleEl.textContent || '') : '';
    const isUnoccupied = /unoccupied\s+oasis/i.test(titleText);

    const mapDetails = tileDetails.querySelector('#map_details');
    const troopTable = mapDetails ? mapDetails.querySelector('#troop_info') : null;
    const troops = [];
    if (troopTable) {
      const rows = troopTable.querySelectorAll('tbody tr');
      rows.forEach(function (tr) {
        if (tr.querySelector('a[href*="combatSimulator"]')) return;
        const valEl = tr.querySelector('.val');
        const descEl = tr.querySelector('.desc');
        const imgEl = tr.querySelector('img.unit');
        if (!valEl || !descEl) return;
        const amount = parseInt((valEl.textContent || '').trim(), 10);
        const type = (descEl.textContent || '').trim();
        const unitClass = imgEl ? (imgEl.className || '') : '';
        if (!isNaN(amount) && type) {
          troops.push({ type, amount, unitClass });
        }
      });
    }

    const bonusList = [];
    const distTable = tileDetails.querySelector('#distribution');
    if (distTable) {
      const rows = distTable.querySelectorAll('tbody tr');
      rows.forEach(function (tr) {
        const iconEl = tr.querySelector('.ico i.r1, .ico i.r2, .ico i.r3, .ico i.r4');
        if (iconEl) {
          const m = iconEl.className.match(/\br([1-4])\b/);
          if (m && BONUS_MAP['r' + m[1]]) {
            bonusList.push(BONUS_MAP['r' + m[1]]);
            return;
          }
        }
        const descEl = tr.querySelector('.desc');
        if (descEl) {
          const t = (descEl.textContent || '').trim();
          if (t && !bonusList.includes(t)) {
            bonusList.push(t);
          }
        }
      });
      if (bonusList.length === 0 && distTable) {
        const descs = distTable.querySelectorAll('.desc');
        descs.forEach(function (d) {
          const t = (d.textContent || '').trim();
          if (t) bonusList.push(t);
        });
      }
    }

    let distVal = null;
    const distEl = tileDetails.querySelector('#distance .bold');
    if (distEl) {
      const m = (distEl.textContent || '').match(/[\d.]+/);
      if (m) distVal = parseFloat(m[0]);
    }

    const id = x + ',' + y;
    return {
      id,
      x,
      y,
      isUnoccupied,
      troops,
      hasAnimals: troops.length > 0,
      bonus: bonusList,
      distance: distVal,
      scannedAt: Date.now()
    };
  }

  function saveOasis(oasis) {
    chrome.storage.local.get(STORAGE_KEY_OASES, function (result) {
      const list = result[STORAGE_KEY_OASES] || [];
      const idx = list.findIndex(function (o) { return o.id === oasis.id; });
      if (idx >= 0) list[idx] = oasis;
      else list.push(oasis);
      chrome.storage.local.set({ [STORAGE_KEY_OASES]: list }, function () {
        chrome.runtime.sendMessage({ type: 'oasisScanned', oasis: oasis });
      });
    });
  }

  function handleTileDetailsApi(detail) {
    if (!detail || !detail.html || detail.html.indexOf('oasis') < 0) return;
    const div = document.createElement('div');
    div.innerHTML = detail.html;
    const tileDetails = div.querySelector('#tileDetails.oasis');
    if (!tileDetails) return;
    const oasis = parseOasis(tileDetails);
    if (oasis) saveOasis(oasis);
  }

  document.addEventListener('travianTileDetails', function (e) {
    handleTileDetailsApi(e.detail);
  });

  function observeOasisDialog() {
    const dialogContent = document.querySelector('#dialogContent');
    if (!dialogContent) return;

    const tileDetails = dialogContent.querySelector('#tileDetails.oasis');
    if (tileDetails) {
      const oasis = parseOasis(tileDetails);
      if (oasis) saveOasis(oasis);
    }
  }

  function startObserver() {
    const target = document.body;
    if (!target) return;

    const observer = new MutationObserver(function (mutations) {
      const hasDialog = document.querySelector('#dialogContent #tileDetails.oasis');
      if (hasDialog) observeOasisDialog();
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });

    if (document.querySelector('#dialogContent #tileDetails.oasis')) {
      observeOasisDialog();
    }
  }

  function navigateTo(x, y) {
    const url = window.location.origin + '/karte.php?x=' + x + '&y=' + y;
    window.location.href = url;
  }

  function runClickQueue(oasisElements, onProgress, onComplete) {
    let index = 0;
    function next() {
      if (index >= oasisElements.length) {
        onComplete();
        return;
      }
      const item = oasisElements[index];
      if (item.element && typeof item.element.click === 'function') {
        item.element.click();
        setTimeout(function () {
          const tileDetails = document.querySelector('#dialogContent #tileDetails.oasis');
          if (tileDetails) {
            const oasis = parseOasis(tileDetails);
            if (oasis) saveOasis(oasis);
            const closeBtn = document.querySelector('.windowClosing, .closeWindow, [class*="close"], [class*="Close"]');
            if (closeBtn) closeBtn.click();
            else {
              const overlay = document.querySelector('#dialogContent');
              if (overlay && overlay.parentElement) overlay.parentElement.click();
            }
          }
          index += 1;
          onProgress(index, oasisElements.length);
          setTimeout(next, 500 + Math.random() * 1000);
        }, 600);
      } else {
        index += 1;
        next();
      }
    }
    next();
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getVillages') {
      const villages = parseVillages();
      sendResponse({ villages });
      return false;
    }
    if (request.action === 'abortRadiusScan') {
      scanAbortFlag = true;
      sendResponse({ ok: true });
      return false;
    }
    if (request.action === 'scanRadiusByApi') {
      const villages = parseVillages();
      const refVillage = villages.find(function (v) { return v.isActive; }) || villages[0] || null;
      if (!refVillage) {
        sendResponse({ ok: false, error: 'Ingen aktiv by. Opdater byer først.' });
        return false;
      }
      let maxRadius = parseInt(request.maxRadius, 10);
      if (isNaN(maxRadius) || maxRadius <= 0) maxRadius = 15;
      if (maxRadius > 25) maxRadius = 25;
      scanRadiusByApi(refVillage, maxRadius, function (current, total) {
        chrome.runtime.sendMessage({ type: 'scanProgress', current: current, total: total });
      }, function () {
        chrome.runtime.sendMessage({ type: 'scanComplete' });
      });
      sendResponse({ ok: true });
      return false;
    }
    if (request.action === 'scanVisibleOases') {
      const villages = parseVillages();
      const refVillage = villages.find(function (v) { return v.isActive; }) || villages[0] || null;
      const maxRadius = request.maxRadius != null ? parseInt(request.maxRadius, 10) : null;
      const scanned = scanVisibleOases(maxRadius, refVillage);
      const oasesData = scanned.map(function (o) {
        return {
          id: o.x + ',' + o.y,
          x: o.x,
          y: o.y,
          troops: [],
          bonus: [],
          hasAnimals: false,
          scannedAt: Date.now()
        };
      });
      chrome.storage.local.get(STORAGE_KEY_OASES, function (r) {
        const existing = r[STORAGE_KEY_OASES] || [];
        const byId = {};
        existing.forEach(function (e) { byId[e.id] = e; });
        oasesData.forEach(function (o) {
          if (byId[o.id]) {
            o.troops = byId[o.id].troops || o.troops;
            o.bonus = byId[o.id].bonus || o.bonus;
            o.hasAnimals = (o.troops && o.troops.length > 0) || byId[o.id].hasAnimals;
          }
          byId[o.id] = o;
        });
        const merged = Object.keys(byId).map(function (k) { return byId[k]; });
        chrome.storage.local.set({ [STORAGE_KEY_OASES]: merged });
        sendResponse({ oases: merged, scanned: scanned.length });
      });
      return true;
    }
    if (request.action === 'runClickQueue' && request.oases && Array.isArray(request.oases)) {
      const mapContainer = document.querySelector('#mapContainer, #map, .mapContainer, .map') || document.body;
      const elements = request.oases.map(function (o) {
        const links = mapContainer.querySelectorAll('a[href*="karte.php"], a[href*="kid="]');
        for (let i = 0; i < links.length; i++) {
          const h = links[i].getAttribute('href') || '';
          const xM = h.match(/[?&]x=(-?\d+)/);
          const yM = h.match(/[?&]y=(-?\d+)/);
          if (xM && yM && parseInt(xM[1], 10) === o.x && parseInt(yM[1], 10) === o.y && links[i].closest('.oasis, [class*="oasis"]')) {
            return { x: o.x, y: o.y, element: links[i] };
          }
        }
        const tiles = mapContainer.querySelectorAll('[data-x="' + o.x + '"][data-y="' + o.y + '"]');
        for (let j = 0; j < tiles.length; j++) {
          if (isOasisElement(tiles[j])) return { x: o.x, y: o.y, element: tiles[j] };
        }
        return { x: o.x, y: o.y, element: null };
      });
      runClickQueue(elements, function (i, total) {
        chrome.runtime.sendMessage({ type: 'scanProgress', current: i, total: total });
      }, function () {
        chrome.runtime.sendMessage({ type: 'scanComplete' });
      });
      sendResponse({ ok: true });
      return false;
    }
    if (request.action === 'navigateTo' && typeof request.x === 'number' && typeof request.y === 'number') {
      navigateTo(request.x, request.y);
      sendResponse({ ok: true });
      return false;
    }
    if (request.action === 'getOases') {
      chrome.storage.local.get(STORAGE_KEY_OASES, function (r) {
        sendResponse({ oases: r[STORAGE_KEY_OASES] || [] });
      });
      return true;
    }
    sendResponse({ error: 'Unknown action' });
    return false;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
