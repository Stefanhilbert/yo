'use strict';

(function () {
  var DEFAULT_SCAN_TIMES = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  var serverBaseUrlEl = document.getElementById('serverBaseUrl');
  var farmListUrlEl = document.getElementById('farmListUrl');
  var scanTimesContainer = document.getElementById('scanTimesContainer');
  var resetScanTimesBtn = document.getElementById('resetScanTimes');
  var myCoordsEl = document.getElementById('myCoords');
  var useCurrentVillageBtn = document.getElementById('useCurrentVillage');
  var bulkOpenBatchSizeEl = document.getElementById('bulkOpenBatchSize');
  var themeToggle = document.getElementById('themeToggle');

  function loadTheme() {
    chrome.storage.local.get({ theme: 'light' }, function (data) {
      document.body.className = 'theme-' + (data.theme || 'light');
      themeToggle.textContent = (data.theme === 'dark') ? 'Lys tema' : 'Mørk tema';
    });
  }

  themeToggle.addEventListener('click', function () {
    var isDark = document.body.classList.contains('theme-dark');
    var next = isDark ? 'light' : 'dark';
    chrome.storage.local.set({ theme: next });
    document.body.className = 'theme-' + next;
    themeToggle.textContent = next === 'dark' ? 'Lys tema' : 'Mørk tema';
  });

  function saveScanTimes() {
    var inputs = scanTimesContainer.querySelectorAll('input');
    var arr = [];
    for (var i = 0; i < inputs.length; i++) {
      arr.push((inputs[i].value || '').trim() || DEFAULT_SCAN_TIMES[i] || '00:00');
    }
    chrome.storage.local.set({ scanTimes: arr });
  }

  function renderScanTimes(times) {
    scanTimesContainer.innerHTML = '';
    for (var i = 0; i < 6; i++) {
      var row = document.createElement('div');
      row.className = 'scan-time-row';
      var label = document.createElement('label');
      label.textContent = 'Scan ' + (i + 1) + ':';
      label.style.minWidth = '70px';
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'HH:MM';
      input.value = (times[i] || '').trim();
      input.addEventListener('change', saveScanTimes);
      row.appendChild(label);
      row.appendChild(input);
      scanTimesContainer.appendChild(row);
    }
  }

  var mapLinkTemplateEl = document.getElementById('mapLinkTemplate');
  var maxOpenPerClickEl = document.getElementById('maxOpenPerClick');
  chrome.storage.local.get({
    serverBaseUrl: '',
    farmListUrl: '',
    mapLinkTemplate: '{base}/position_details?x={x}&y={y}',
    scanTimes: DEFAULT_SCAN_TIMES,
    myCoords: '',
    bulkOpenBatchSize: 25,
    maxOpenPerClick: 100
  }, function (data) {
    serverBaseUrlEl.value = data.serverBaseUrl || '';
    if (farmListUrlEl) farmListUrlEl.value = data.farmListUrl || '';
    if (mapLinkTemplateEl) mapLinkTemplateEl.value = data.mapLinkTemplate || '{base}/position_details?x={x}&y={y}';
    renderScanTimes(data.scanTimes || DEFAULT_SCAN_TIMES);
    myCoordsEl.value = data.myCoords || '';
    bulkOpenBatchSizeEl.value = Math.max(5, Math.min(50, Number(data.bulkOpenBatchSize) || 25));
    if (maxOpenPerClickEl) maxOpenPerClickEl.value = Math.max(10, Math.min(100, Number(data.maxOpenPerClick) || 100));
  });

  serverBaseUrlEl.addEventListener('change', function () {
    var url = (serverBaseUrlEl.value || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
    chrome.storage.local.set({ serverBaseUrl: url });
  });

  if (farmListUrlEl) {
    farmListUrlEl.addEventListener('change', function () {
      chrome.storage.local.set({ farmListUrl: farmListUrlEl.value.trim() });
    });
  }
  if (mapLinkTemplateEl) {
    mapLinkTemplateEl.addEventListener('change', function () {
      chrome.storage.local.set({ mapLinkTemplate: mapLinkTemplateEl.value || '{base}/position_details?x={x}&y={y}' });
    });
  }

  resetScanTimesBtn.addEventListener('click', function () {
    chrome.storage.local.set({ scanTimes: DEFAULT_SCAN_TIMES.slice() });
    renderScanTimes(DEFAULT_SCAN_TIMES);
  });

  myCoordsEl.addEventListener('change', function () {
    chrome.storage.local.set({ myCoords: myCoordsEl.value.trim() });
  });

  bulkOpenBatchSizeEl.addEventListener('change', function () {
    var n = Math.max(5, Math.min(50, parseInt(bulkOpenBatchSizeEl.value, 10) || 25));
    chrome.storage.local.set({ bulkOpenBatchSize: n });
    bulkOpenBatchSizeEl.value = n;
  });
  if (maxOpenPerClickEl) {
    maxOpenPerClickEl.addEventListener('change', function () {
      var n = Math.max(10, Math.min(100, parseInt(maxOpenPerClickEl.value, 10) || 100));
      chrome.storage.local.set({ maxOpenPerClick: n });
      maxOpenPerClickEl.value = n;
    });
  }

  useCurrentVillageBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getCurrentVillageCoords' }, function (res) {
        if (chrome.runtime.lastError || !res || res.x === undefined) return;
        var line = res.x + ' ' + res.y;
        var cur = myCoordsEl.value.trim();
        if (cur && cur.indexOf(line) === -1) line = cur + '\n' + line;
        myCoordsEl.value = line;
        chrome.storage.local.set({ myCoords: myCoordsEl.value.trim() });
      });
    });
  });

  function parseMyCoords(text) {
    var out = [];
    var lines = (text || '').trim().split(/\n/);
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/(-?\d+)\s*[,|\s]\s*(-?\d+)/);
      if (m) out.push({ x: parseInt(m[1], 10), y: parseInt(m[2], 10) });
    }
    return out;
  }

  function distance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  function minDistanceToMine(candidate, myCoords) {
    if (!myCoords.length) return 999999;
    var d = 999999;
    for (var i = 0; i < myCoords.length; i++) {
      var dist = distance(candidate, myCoords[i]);
      if (dist < d) d = dist;
    }
    return d;
  }

  function updateDataCoverageHint(el, daysBack) {
    if (!el) return;
    chrome.runtime.sendMessage({ action: 'getDataCoverage', daysBack: daysBack || 7 }, function (res) {
      if (chrome.runtime.lastError || !res || !res.ok) {
        el.textContent = '';
        return;
      }
      var oldest = res.oldestAt ? new Date(res.oldestAt).toLocaleDateString() : '';
      var newest = res.newestAt ? new Date(res.newestAt).toLocaleDateString() : '';
      var days = Math.round(res.coverageDays || 0);
      var msg = 'Data fra ' + days + ' dage.';
      if (oldest && newest) msg += ' Ældste scan: ' + oldest + ', nyeste: ' + newest + '.';
      if (res.hasEnoughForDaysBack) {
        msg += ' For ' + (res.daysBack || 7) + '-dages sammenligning: OK.';
      } else {
        var needMore = Math.max(0, (res.daysBack || 7) - days);
        msg += ' For ' + (res.daysBack || 7) + '-dages sammenligning: kom tilbage om ' + needMore + ' dage.';
      }
      el.textContent = msg;
    });
  }

  var growthBody = document.getElementById('growthBody');
  var growthHint = document.getElementById('growthHint');
  var growthDataCoverageEl = document.getElementById('growthDataCoverage');
  var growthDaysBack = document.getElementById('growthDaysBack');
  var refreshGrowthBtn = document.getElementById('refreshGrowth');
  var lastGrowthPlayers = [];
  if (growthBody) {
    refreshGrowthBtn.addEventListener('click', function () {
      growthHint.textContent = 'Henter…';
      chrome.runtime.sendMessage({ action: 'getGrowthData', daysBack: growthDaysBack.value }, function (res) {
        if (chrome.runtime.lastError || !res || !res.ok) {
          growthHint.textContent = res && res.error || 'Fejl';
          return;
        }
        growthHint.textContent = '';
        growthBody.innerHTML = '';
        var players = res.players || [];
        lastGrowthPlayers = players;
        for (var i = 0; i < players.length; i++) {
          var p = players[i];
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + escapeHtml(p.playerName) + '</td><td>' + p.growth + '</td><td>' + p.villages + '</td>';
          growthBody.appendChild(tr);
        }
        if (players.length === 0) growthHint.textContent = res.error || 'Ingen data';
        updateDataCoverageHint(growthDataCoverageEl, parseInt(growthDaysBack.value, 10) || 7);
      });
    });
  }
  var exportGrowthCsvBtn = document.getElementById('exportGrowthCsv');
  if (exportGrowthCsvBtn) {
    exportGrowthCsvBtn.addEventListener('click', function () {
      if (!lastGrowthPlayers.length) {
        alert('Opdater vækst-tabellen først.');
        return;
      }
      var csv = 'Spiller,Vækst,Byer\n';
      for (var i = 0; i < lastGrowthPlayers.length; i++) {
        var p = lastGrowthPlayers[i];
        var name = (p.playerName || '').replace(/"/g, '""');
        csv += '"' + name + '",' + p.growth + ',' + p.villages + '\n';
      }
      var a = document.createElement('a');
      a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
      a.download = 'travian-growth.csv';
      a.click();
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var candidateDays = document.getElementById('candidateDays');
  var findCandidatesBtn = document.getElementById('findCandidates');
  var sortCandidates = document.getElementById('sortCandidates');
  var filterTribe = document.getElementById('filterTribe');
  var filterOneVillage = document.getElementById('filterOneVillage');
  var filterAllianceTag = document.getElementById('filterAllianceTag');
  var maxRadius = document.getElementById('maxRadius');
  var openCandidatesBtn = document.getElementById('openCandidates');
  var openCount = document.getElementById('openCount');
  var candidatesLeft = document.getElementById('candidatesLeft');
  var syncFarmListBtn = document.getElementById('syncFarmList');
  var exportCandidatesBtn = document.getElementById('exportCandidates');
  var importCandidatesBtn = document.getElementById('importCandidates');
  var importFile = document.getElementById('importFile');
  var candidatesList = document.getElementById('candidatesList');
  var candidateListData = [];

  function applySortAndFilter() {
    var myCoords = parseMyCoords(myCoordsEl.value);
    var tribe = (filterTribe.value || '').trim();
    var radius = parseInt(maxRadius.value, 10);
    var valid = radius >= 0;
    var list = candidateListData.slice();
    if (tribe) list = list.filter(function (c) { return String(c.tribe) === tribe; });
    var allianceTag = (filterAllianceTag && filterAllianceTag.value) ? filterAllianceTag.value.trim() : '';
    if (allianceTag) list = list.filter(function (c) { return (c.allianceTag || '').toLowerCase() === allianceTag.toLowerCase(); });
    if (filterOneVillage && filterOneVillage.checked) {
      var villagesByPlayer = {};
      list.forEach(function (c) { villagesByPlayer[c.playerId] = (villagesByPlayer[c.playerId] || 0) + 1; });
      list = list.filter(function (c) { return villagesByPlayer[c.playerId] === 1; });
    }
    if (valid && !isNaN(radius)) list = list.filter(function (c) { return minDistanceToMine(c, myCoords) <= radius; });
    var sortBy = sortCandidates.value || 'distance';
    list.sort(function (a, b) {
      if (sortBy === 'distance') return minDistanceToMine(a, myCoords) - minDistanceToMine(b, myCoords);
      if (sortBy === 'population') return a.population - b.population;
      if (sortBy === 'populationDesc') return b.population - a.population;
      return (a.playerName || '').localeCompare(b.playerName || '');
    });
    return list;
  }

  function renderCandidates() {
    var list = applySortAndFilter();
    chrome.storage.local.get({ farmListCoordKeys: {}, openedCoordKeys: {} }, function (data) {
      var inFarmList = data.farmListCoordKeys || {};
      var opened = data.openedCoordKeys || {};
      var available = list.filter(function (c) { return !inFarmList[c.coordKey] && !opened[c.coordKey]; });
      candidatesList.innerHTML = '';
      for (var i = 0; i < available.length; i++) {
        var c = available[i];
        var div = document.createElement('div');
        div.className = 'candidate-item';
        div.textContent = '(' + c.x + '|' + c.y + ') ' + (c.villageName || '') + ' – ' + (c.playerName || '') + ' pop ' + c.population;
        candidatesList.appendChild(div);
      }
      candidatesLeft.textContent = available.length + ' links tilbage (ekskl. farm list og allerede åbnet)';
    });
  }

  var candidatesDataCoverageEl = document.getElementById('candidatesDataCoverage');
  if (findCandidatesBtn) {
    findCandidatesBtn.addEventListener('click', function () {
      var days = parseInt(candidateDays.value, 10) || 7;
      chrome.runtime.sendMessage({ action: 'getNoGrowthCandidates', daysBack: days }, function (res) {
        if (chrome.runtime.lastError || !res || !res.ok) {
          candidatesList.innerHTML = '<p class="hint">Fejl ved hentning</p>';
          return;
        }
        candidateListData = res.candidates || [];
        chrome.storage.local.set({ candidateListData: candidateListData });
        renderCandidates();
        updateDataCoverageHint(candidatesDataCoverageEl, days);
      });
    });
  }

  sortCandidates.addEventListener('change', renderCandidates);
  filterTribe.addEventListener('change', renderCandidates);
  if (filterOneVillage) filterOneVillage.addEventListener('change', renderCandidates);
  if (filterAllianceTag) filterAllianceTag.addEventListener('change', renderCandidates);
  maxRadius.addEventListener('change', renderCandidates);

  if (openCandidatesBtn) {
    openCandidatesBtn.addEventListener('click', function () {
      var list = applySortAndFilter();
      chrome.storage.local.get({ farmListCoordKeys: {}, bulkOpenBatchSize: 25, maxOpenPerClick: 100, openedCoordKeys: {}, serverBaseUrl: '', mapLinkTemplate: '{base}/position_details?x={x}&y={y}' }, function (data) {
        var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
        var template = (data.mapLinkTemplate || '').trim() || '{base}/position_details?x={x}&y={y}';
        list.forEach(function (c) {
          if (!c.mapLink && base) c.mapLink = template.replace(/\{base\}/g, base).replace(/\{x\}/g, c.x).replace(/\{y\}/g, c.y);
        });
        var opened = data.openedCoordKeys || {};
        var farm = data.farmListCoordKeys || {};
        var toOpen = list.filter(function (c) { return !farm[c.coordKey] && !opened[c.coordKey] && c.mapLink; });
        var maxPerClick = Math.max(10, Math.min(100, Number(data.maxOpenPerClick) || 100));
        var n = Math.min(maxPerClick, parseInt(openCount.value, 10) || 20, toOpen.length);
        toOpen = toOpen.slice(0, n);
        var batchSize = Math.max(5, Math.min(50, data.bulkOpenBatchSize || 25));
        var delay = 300;
        var idx = 0;
        function openNext() {
          if (idx >= toOpen.length) {
            toOpen.forEach(function (c) { opened[c.coordKey] = true; });
            chrome.storage.local.set({ openedCoordKeys: opened });
            renderCandidates();
            return;
          }
          var batch = toOpen.slice(idx, idx + batchSize);
          idx += batch.length;
          batch.forEach(function (c, i) {
            setTimeout(function () { window.open(c.mapLink, '_blank'); }, i * delay);
          });
          setTimeout(openNext, batch.length * delay + 100);
        }
        openNext();
      });
    });
  }

  var resetOpenedLinksBtn = document.getElementById('resetOpenedLinks');
  if (resetOpenedLinksBtn) {
    resetOpenedLinksBtn.addEventListener('click', function () {
      chrome.storage.local.set({ openedCoordKeys: {} });
      renderCandidates();
    });
  }

  if (syncFarmListBtn) {
    syncFarmListBtn.addEventListener('click', function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs.length || !tabs[0].id) {
          candidatesLeft.textContent = 'Åbn farm list-siden i en fane først.';
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getFarmListCoords' }, function (res) {
          if (chrome.runtime.lastError) {
            candidatesLeft.textContent = 'Kunne ikke læse farm list (åbn farm list-siden).';
            return;
          }
          var coords = (res && res.coords) ? res.coords : [];
          var keys = {};
          coords.forEach(function (k) { keys[k] = true; });
          chrome.storage.local.set({ farmListCoordKeys: keys });
          renderCandidates();
          candidatesLeft.textContent = coords.length + ' coords i farm list – listen opdateret.';
        });
      });
    });
  }

  if (exportCandidatesBtn) {
    exportCandidatesBtn.addEventListener('click', function () {
      var list = candidateListData;
      if (!list.length) {
        alert('Ingen kandidater at eksportere. Find kandidater først.');
        return;
      }
      var json = JSON.stringify(list);
      var a = document.createElement('a');
      a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
      a.download = 'travian-tracker-candidates.json';
      a.click();
    });
  }

  if (importCandidatesBtn) {
    importCandidatesBtn.addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function () {
      var f = this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var text = reader.result;
        var list = [];
        try {
          if (f.name.toLowerCase().endsWith('.json')) list = JSON.parse(text);
          else list = parseCsvCandidates(text);
          candidateListData = list;
          chrome.storage.local.set({ candidateListData: list });
          renderCandidates();
          candidatesLeft.textContent = 'Importeret ' + list.length + ' kandidater.';
        } catch (e) {
          alert('Import fejlede: ' + (e && e.message));
        }
        importFile.value = '';
      };
      reader.readAsText(f);
    });
  }

  function parseCsvCandidates(text) {
    var lines = text.split(/\n/);
    var list = [];
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split(/[,;\t]/);
      if (parts.length < 2) continue;
      var x = parseInt(parts[0], 10), y = parseInt(parts[1], 10);
      if (isNaN(x) || isNaN(y)) continue;
      list.push({ x: x, y: y, coordKey: x + '|' + y, villageName: parts[2] || '', playerName: parts[3] || '', population: parseInt(parts[4], 10) || 0, mapLink: '' });
    }
    return list;
  }

  chrome.storage.local.get({ candidateListData: [] }, function (data) {
    candidateListData = data.candidateListData || [];
    if (candidateListData.length) renderCandidates();
  });

  updateDataCoverageHint(growthDataCoverageEl, 7);
  updateDataCoverageHint(candidatesDataCoverageEl, 7);

  var scanFarmListsBtn = document.getElementById('scanFarmLists');
  var dedupeResult = document.getElementById('dedupeResult');
  if (scanFarmListsBtn) {
    scanFarmListsBtn.addEventListener('click', function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs.length || !tabs[0].id) {
          dedupeResult.textContent = 'Åbn farm list-siden i en fane først.';
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'expandAllFarmLists' }, function () {
          setTimeout(function () {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getFarmListCoords' }, function (res) {
              if (chrome.runtime.lastError) {
                dedupeResult.textContent = 'Kunne ikke scanne.';
                return;
              }
              var raw = (res && res.rawCount) ? res.rawCount : 0;
              var coords = (res && res.coords) ? res.coords : [];
              var unique = coords.length;
              dedupeResult.textContent = unique + ' unikke targets, ' + (raw - unique) + ' duplikater fjernet.';
            });
          }, 800);
        });
      });
    });
  }

  loadTheme();
})();
