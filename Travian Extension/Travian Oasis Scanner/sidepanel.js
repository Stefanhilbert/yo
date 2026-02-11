(function () {
  'use strict';

  const STORAGE_KEY_OASES = 'travian_oasis_oases';
  const STORAGE_KEY_HIDDEN = 'travian_oasis_hidden';

  let villages = [];
  let oases = [];
  let activeVillage = null;

  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  let hiddenOases = {};

  function getFilters() {
    return {
      bonusLumber: document.getElementById('bonusLumber').checked,
      bonusClay: document.getElementById('bonusClay').checked,
      bonusIron: document.getElementById('bonusIron').checked,
      bonusCrop: document.getElementById('bonusCrop').checked,
      filterEmpty: document.getElementById('filterEmpty').checked,
      filterWithAnimals: document.getElementById('filterWithAnimals').checked,
      maxRadius: parseInt(document.getElementById('maxRadius').value, 10) || null,
      showHidden: document.getElementById('showHidden').checked
    };
  }

  function matchesBonusFilter(oasis, f) {
    if (!oasis.bonus || oasis.bonus.length === 0) return true;
    const bonuses = oasis.bonus.map(function (b) { return (b || '').toLowerCase(); });
    const hasLumber = bonuses.some(function (b) { return /lumber|wood|holz|træ/i.test(b); });
    const hasClay = bonuses.some(function (b) { return /clay|lehm|ler/i.test(b); });
    const hasIron = bonuses.some(function (b) { return /iron|jern|eisen/i.test(b); });
    const hasCrop = bonuses.some(function (b) { return /crop|korn|getreide|kornsæd/i.test(b); });
    return (f.bonusLumber && hasLumber) || (f.bonusClay && hasClay) || (f.bonusIron && hasIron) || (f.bonusCrop && hasCrop);
  }

  function matchesOasisFilter(oasis, f) {
    if (oasis.hasAnimals) return f.filterWithAnimals;
    return f.filterEmpty;
  }

  function matchesRadius(oasis, refVillage, maxRadius) {
    if (!maxRadius || !refVillage) return true;
    const d = distance(oasis.x, oasis.y, refVillage.x, refVillage.y);
    return d <= maxRadius;
  }

  function getFilteredOases() {
    const f = getFilters();
    const ref = activeVillage || villages[0];
    return oases.filter(function (o) {
      if (!f.showHidden && hiddenOases[o.id]) return false;
      if (!matchesBonusFilter(o, f)) return false;
      if (!matchesOasisFilter(o, f)) return false;
      if (!matchesRadius(o, ref, f.maxRadius)) return false;
      return true;
    }).map(function (o) {
      const d = ref ? distance(o.x, o.y, ref.x, ref.y) : (o.distance || 999);
      return { ...o, _dist: d };
    }).sort(function (a, b) { return a._dist - b._dist; });
  }

  function renderOasisItem(oasis) {
    const troopsStr = oasis.troops && oasis.troops.length
      ? oasis.troops.map(t => t.amount + ' ' + t.type).join(', ')
      : 'Tom';
    const bonusStr = oasis.bonus && oasis.bonus.length ? oasis.bonus.join(', ') : '-';
    const distStr = oasis._dist != null ? oasis._dist.toFixed(1) + ' f' : (oasis.distance != null ? oasis.distance + ' f' : '');

    const div = document.createElement('div');
    div.className = 'oasis-item';
    div.innerHTML =
      '<div class="oasis-coords">(' + oasis.x + '|' + oasis.y + ')</div>' +
      '<div class="oasis-meta">' + distStr + ' - ' + bonusStr + '</div>' +
      '<div class="oasis-troops">' + troopsStr + '</div>' +
      '<div class="oasis-actions">' +
      '<button class="btn" data-action="goto" data-x="' + oasis.x + '" data-y="' + oasis.y + '">Gå til</button>' +
      '<button class="btn btn-secondary" data-action="copy" data-x="' + oasis.x + '" data-y="' + oasis.y + '">Kopier</button>' +
      '<button class="btn btn-secondary" data-action="hide" data-id="' + oasis.id + '">Skjul</button>' +
      '</div>';

    div.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'goto') {
        navigateTo(parseInt(btn.dataset.x, 10), parseInt(btn.dataset.y, 10));
      } else if (btn.dataset.action === 'copy') {
        copyCoords(parseInt(btn.dataset.x, 10), parseInt(btn.dataset.y, 10));
      } else if (btn.dataset.action === 'hide') {
        hideOasis(btn.dataset.id);
      }
    });

    return div;
  }

  function render() {
    const listEl = document.getElementById('oasisList');
    const filtered = getFilteredOases();

    listEl.innerHTML = '';
    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="empty-state">Ingen oaser matcher filtrene. Scroller på kortet – oaser registreres automatisk når Travian loader dem.</div>';
      return;
    }
    filtered.forEach(function (o) {
      listEl.appendChild(renderOasisItem(o));
    });
  }

  function updateActiveVillage() {
    const el = document.getElementById('activeVillage');
    if (activeVillage) {
      el.textContent = 'Aktive by: (' + activeVillage.x + '|' + activeVillage.y + ') ' + activeVillage.name;
    } else if (villages.length) {
      el.textContent = 'Aktive by: Ingen valgt. Første by bruges som reference.';
    } else {
      el.textContent = 'Aktive by: Åbn Travian-kortet og opdater byer.';
    }
  }

  function loadVillages() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) {
        villages = [];
        activeVillage = null;
        updateActiveVillage();
        render();
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getVillages' }, function (response) {
        if (chrome.runtime.lastError || !response) {
          villages = [];
          activeVillage = null;
        } else {
          villages = response.villages || [];
          activeVillage = villages.find(v => v.isActive) || villages[0] || null;
        }
        updateActiveVillage();
        render();
      });
    });
  }

  function loadOases() {
    chrome.storage.local.get([STORAGE_KEY_OASES, STORAGE_KEY_HIDDEN], function (r) {
      oases = r[STORAGE_KEY_OASES] || [];
      hiddenOases = r[STORAGE_KEY_HIDDEN] || {};
      render();
    });
  }

  function navigateTo(x, y) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'navigateTo', x: x, y: y });
    });
  }

  function hideOasis(id) {
    hiddenOases[id] = true;
    chrome.storage.local.set({ [STORAGE_KEY_HIDDEN]: hiddenOases });
    render();
  }

  function copyCoords(x, y) {
    const s = '(' + x + '|' + y + ')';
    navigator.clipboard.writeText(s).then(function () {
      const btn = document.querySelector('[data-action="copy"][data-x="' + x + '"][data-y="' + y + '"]');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Kopieret!';
        setTimeout(function () { btn.textContent = orig; }, 800);
      }
    });
  }

  function exportCsv() {
    const filtered = getFilteredOases();
    const headers = ['x', 'y', 'distance', 'bonus', 'troops', 'empty'];
    const rows = filtered.map(function (o) {
      const troopsStr = o.troops && o.troops.length ? o.troops.map(t => t.amount + ' ' + t.type).join('; ') : '';
      return [
        o.x,
        o.y,
        o._dist != null ? o._dist.toFixed(1) : '',
        (o.bonus || []).join('; '),
        troopsStr,
        o.hasAnimals ? 'no' : 'yes'
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'travian_oases_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function setScanning(isScanning) {
    const btn = document.getElementById('scanRadius');
    const stopBtn = document.getElementById('stopScan');
    if (btn) btn.disabled = isScanning;
    if (stopBtn) stopBtn.style.display = isScanning ? 'inline-block' : 'none';
  }

  function scanRadius() {
    let maxRadius = parseInt(document.getElementById('maxRadius').value, 10);
    if (isNaN(maxRadius) || maxRadius <= 0) maxRadius = 15;
    if (maxRadius > 25) maxRadius = 25;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) {
        alert('Åbn Travian-kortet først.');
        return;
      }
      setScanning(true);
      document.getElementById('scanStatus').style.display = 'block';
      document.getElementById('scanStatusText').textContent = 'Starter scan...';
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scanRadiusByApi', maxRadius: maxRadius }, function (response) {
        if (chrome.runtime.lastError) {
          setScanning(false);
          document.getElementById('scanStatus').style.display = 'none';
          alert('Fejl: Sørg for at kortet er åbent.');
          return;
        }
        if (response && response.error) {
          setScanning(false);
          document.getElementById('scanStatus').style.display = 'none';
          alert(response.error);
          return;
        }
      });
    });
  }

  function stopScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'abortRadiusScan' });
    });
  }

  function fetchDetails() {
    const needDetails = oases.filter(function (o) { return !o.troops || o.troops.length === 0; });
    if (needDetails.length === 0) {
      alert('Alle oaser har allerede troops-data. Klik på oaser for at opdatere.');
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      document.getElementById('scanStatus').style.display = 'block';
      document.getElementById('scanStatusText').textContent = 'Henter detaljer for ' + needDetails.length + ' oaser...';
      chrome.tabs.sendMessage(tabs[0].id, { action: 'runClickQueue', oases: needDetails.map(function (o) { return { x: o.x, y: o.y }; }) });
    });
  }

  document.getElementById('refreshVillages').addEventListener('click', loadVillages);
  document.getElementById('scanRadius').addEventListener('click', scanRadius);
  document.getElementById('stopScan').addEventListener('click', stopScan);
  document.getElementById('fetchDetails').addEventListener('click', fetchDetails);
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  document.getElementById('clearBtn').addEventListener('click', function () {
    if (confirm('Slet alle scannede oaser?')) {
      oases = [];
      hiddenOases = {};
      chrome.storage.local.set({ [STORAGE_KEY_OASES]: [], [STORAGE_KEY_HIDDEN]: {} });
      render();
    }
  });

  ['bonusLumber', 'bonusClay', 'bonusIron', 'bonusCrop', 'filterEmpty', 'filterWithAnimals', 'maxRadius', 'showHidden'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', render);
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes[STORAGE_KEY_OASES]) {
      oases = changes[STORAGE_KEY_OASES].newValue || [];
      render();
    }
  });

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'scanProgress') {
      document.getElementById('scanStatus').style.display = 'block';
      document.getElementById('scanStatusText').textContent = 'Scanner ' + message.current + '/' + message.total + '...';
    } else if (message.type === 'scanComplete') {
      document.getElementById('scanStatus').style.display = 'none';
      setScanning(false);
      loadOases();
    }
  });

  loadVillages();
  loadOases();
})();
