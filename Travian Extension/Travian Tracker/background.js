'use strict';

const ALARM_NAME = 'travianTrackerScan';
const DEFAULT_SCAN_TIMES = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
const SNAPSHOTS_TO_KEEP = 42;

function parseValues(s) {
  var out = [];
  var i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    if (s[i] === "'") {
      var end = i + 1;
      while (end < s.length) {
        if (s[end] === "'" && s[end - 1] !== '\\') {
          out.push(s.substring(i + 1, end).replace(/''/g, "'"));
          i = end + 1;
          break;
        }
        end++;
      }
      continue;
    }
    if (s.substring(i, i + 4) === 'NULL') {
      out.push('NULL');
      i += 4;
      continue;
    }
    var comma = s.indexOf(',', i);
    if (comma === -1) comma = s.length;
    out.push(s.substring(i, comma).trim());
    i = comma + 1;
  }
  return out;
}

function parseMapSql(text) {
  var rows = [];
  var re = /INSERT\s+INTO\s+`?x_world`?\s+VALUES\s*\(([^)]+)\)\s*;/gi;
  var m;
  while ((m = re.exec(text)) !== null) {
    var values = parseValues(m[1]);
    if (values.length < 11) continue;
    rows.push({
      x: parseInt(values[1], 10),
      y: parseInt(values[2], 10),
      tribe: parseInt(values[3], 10),
      villageId: parseInt(values[4], 10),
      villageName: String(values[5]).replace(/^'|'$/g, '').replace(/''/g, "'"),
      playerId: parseInt(values[6], 10),
      playerName: String(values[7]).replace(/^'|'$/g, '').replace(/''/g, "'"),
      allianceId: values[8] === 'NULL' || values[8] === '' ? null : parseInt(values[8], 10),
      allianceTag: values[9] === 'NULL' || values[9] === '' ? null : String(values[9]).replace(/^'|'$/g, "").replace(/''/g, "'"),
      population: parseInt(values[10], 10) || 0
    });
  }
  return rows;
}

function villagesFromRows(rows) {
  var villages = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    villages[r.villageId] = { x: r.x, y: r.y, tribe: r.tribe, villageName: r.villageName, playerId: r.playerId, playerName: r.playerName, allianceTag: r.allianceTag, population: r.population };
  }
  return villages;
}

function scheduleNext() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.get({
    serverBaseUrl: '',
    scanTimes: DEFAULT_SCAN_TIMES
  }, function (data) {
    if (!data.serverBaseUrl || !(data.scanTimes && data.scanTimes.length)) {
      return;
    }
    const now = new Date();
    const next = getNextScanTime(now, data.scanTimes);
    if (next) {
      chrome.alarms.create(ALARM_NAME, { when: next.getTime() });
    }
  });
}

function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

function getNextScanTime(now, scanTimes) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidates = [];
  for (let i = 0; i < scanTimes.length; i++) {
    const t = parseTime(scanTimes[i]);
    if (!t) continue;
    const d = new Date(today);
    d.setHours(t.h, t.min, 0, 0);
    if (d.getTime() > now.getTime()) candidates.push(d);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(t.h, t.min, 0, 0);
    candidates.push(tomorrow);
  }
  if (candidates.length === 0) {
    const first = parseTime(scanTimes[0]);
    if (first) {
      const next = new Date(today);
      next.setDate(next.getDate() + 1);
      next.setHours(first.h, first.min, 0, 0);
      return next;
    }
    return null;
  }
  candidates.sort(function (a, b) { return a.getTime() - b.getTime(); });
  return candidates[0];
}

function updateBadgeAfterScan() {
  chrome.action.setBadgeText({ text: '1' });
  chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/48.png'),
      title: 'Travian Tracker',
      message: 'Scan færdig'
    });
  }
}

function syncFarmListFromTab(base, farmListUrl, done) {
  if (!farmListUrl || !farmListUrl.trim()) {
    if (done) done();
    return;
  }
  var host = base ? base.replace(/^https?:\/\//, '').replace(/\/map\.sql.*$/, '').replace(/\/+$/, '').split('/')[0] : '';
  chrome.tabs.query({}, function (tabs) {
    var tabId = null;
    for (var i = 0; i < tabs.length; i++) {
      var u = (tabs[i].url || '').toLowerCase();
      if (u.indexOf('farmlist') !== -1 && (!host || u.indexOf(host) !== -1)) {
        tabId = tabs[i].id;
        break;
      }
    }
    if (!tabId) {
      if (done) done();
      return;
    }
    chrome.tabs.sendMessage(tabId, { action: 'getFarmListCoords' }, function (res) {
      if (!chrome.runtime.lastError && res && res.coords) {
        var keys = {};
        res.coords.forEach(function (k) { keys[k] = true; });
        chrome.storage.local.set({ farmListCoordKeys: keys });
      }
      if (done) done();
    });
  });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== ALARM_NAME) return;
  chrome.storage.local.get({ serverBaseUrl: '', farmListUrl: '' }, function (data) {
    var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
    if (!base) {
      scheduleNext();
      return;
    }
    var url = base + '/map.sql';
    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var rows = parseMapSql(text);
        var villages = villagesFromRows(rows);
        var snapshot = { at: Date.now(), villages: villages };
        chrome.storage.local.get({ mapSnapshots: {}, lastScanAt: null }, function (st) {
          var key = base.replace(/^https?:\/\//, '').split('/')[0] || 'default';
          var snapshots = (st.mapSnapshots && st.mapSnapshots[key]) ? st.mapSnapshots[key].slice() : [];
          snapshots.push(snapshot);
          if (snapshots.length > SNAPSHOTS_TO_KEEP) snapshots = snapshots.slice(-SNAPSHOTS_TO_KEEP);
          var mapSnapshots = st.mapSnapshots || {};
          mapSnapshots[key] = snapshots;
          chrome.storage.local.set({ mapSnapshots: mapSnapshots, lastScanAt: snapshot.at });
          syncFarmListFromTab(base, data.farmListUrl, function () {
            updateBadgeAfterScan();
            scheduleNext();
          });
        });
      })
      .catch(function () {
        scheduleNext();
      });
  });
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== 'local') return;
  if (changes.serverBaseUrl || changes.scanTimes) scheduleNext();
});

chrome.runtime.onInstalled.addListener(function () {
  scheduleNext();
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'getDataCoverage') {
    var daysBack = Math.max(0, parseInt(msg.daysBack, 10) || 7);
    var now = Date.now();
    var then = now - daysBack * 24 * 60 * 60 * 1000;
    chrome.storage.local.get({ serverBaseUrl: '', mapSnapshots: {} }, function (data) {
      var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
      var key = base ? base.replace(/^https?:\/\//, '').split('/')[0] : 'default';
      var snapshots = (data.mapSnapshots && data.mapSnapshots[key]) ? data.mapSnapshots[key] : [];
      var oldestAt = null;
      var newestAt = null;
      var hasEnoughForDaysBack = false;
      if (snapshots.length) {
        snapshots.sort(function (a, b) { return a.at - b.at; });
        oldestAt = snapshots[0].at;
        newestAt = snapshots[snapshots.length - 1].at;
        for (var i = 0; i < snapshots.length; i++) {
          if (snapshots[i].at <= then) hasEnoughForDaysBack = true;
        }
      }
      var coverageDays = oldestAt && newestAt ? (newestAt - oldestAt) / (24 * 60 * 60 * 1000) : 0;
      sendResponse({ ok: true, oldestAt: oldestAt, newestAt: newestAt, coverageDays: coverageDays, hasEnoughForDaysBack: hasEnoughForDaysBack, daysBack: daysBack });
    });
    return true;
  }
  if (msg.action === 'getNextScanTime') {
    chrome.storage.local.get({ scanTimes: DEFAULT_SCAN_TIMES }, function (data) {
      const next = getNextScanTime(new Date(), data.scanTimes);
      sendResponse({ when: next ? next.getTime() : null });
    });
    return true;
  }
  if (msg.action === 'reschedule') {
    scheduleNext();
    sendResponse();
    return false;
  }
  if (msg.action === 'getNoGrowthCandidates') {
    var daysBack = Math.max(1, parseInt(msg.daysBack, 10) || 7);
    var now = Date.now();
    var then = now - daysBack * 24 * 60 * 60 * 1000;
    chrome.storage.local.get({ serverBaseUrl: '', mapSnapshots: {}, mapLinkTemplate: '' }, function (data) {
      var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
      var key = base ? base.replace(/^https?:\/\//, '').split('/')[0] : 'default';
      var snapshots = (data.mapSnapshots && data.mapSnapshots[key]) ? data.mapSnapshots[key] : [];
      var template = (data.mapLinkTemplate || '').trim() || '{base}/position_details?x={x}&y={y}';
      function buildMapLink(v) {
        if (!base) return '';
        return template.replace(/\{base\}/g, base).replace(/\{x\}/g, v.x).replace(/\{y\}/g, v.y);
      }
      if (snapshots.length < 2) {
        sendResponse({ ok: true, candidates: [], baseUrl: base });
        return;
      }
      snapshots.sort(function (a, b) { return a.at - b.at; });
      var idxNow = snapshots.length - 1;
      var idxThen = 0;
      for (var i = 0; i < snapshots.length; i++) {
        if (snapshots[i].at <= then) idxThen = i;
      }
      var vNow = snapshots[idxNow].villages;
      var vThen = snapshots[idxThen].villages;
      var playerGrowth = {};
      for (var vid in vNow) {
        if (!vNow[vid]) continue;
        var popThen = vThen[vid] ? (vThen[vid].population || 0) : 0;
        var popNow = vNow[vid].population || 0;
        var pid = vNow[vid].playerId;
        if (!playerGrowth[pid]) playerGrowth[pid] = 0;
        playerGrowth[pid] += (popNow - popThen);
      }
      var candidates = [];
      for (var vid in vNow) {
        var v = vNow[vid];
        if (!v) continue;
        if (playerGrowth[v.playerId] > 0) continue;
        var mapLink = buildMapLink(v);
        candidates.push({
          x: v.x, y: v.y, villageId: v.villageId, villageName: v.villageName,
          playerId: v.playerId, playerName: v.playerName, population: v.population,
          tribe: v.tribe, allianceTag: v.allianceTag || '',
          growth: playerGrowth[v.playerId], mapLink: mapLink,
          coordKey: v.x + '|' + v.y
        });
      }
      sendResponse({ ok: true, candidates: candidates, baseUrl: base });
    });
    return true;
  }
  if (msg.action === 'getGrowthData') {
    var daysBack = Math.max(0, parseInt(msg.daysBack, 10) || 1);
    var now = Date.now();
    var then = now - daysBack * 24 * 60 * 60 * 1000;
    chrome.storage.local.get({ serverBaseUrl: '', mapSnapshots: {} }, function (data) {
      var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
      var key = base ? base.replace(/^https?:\/\//, '').split('/')[0] : 'default';
      var snapshots = (data.mapSnapshots && data.mapSnapshots[key]) ? data.mapSnapshots[key] : [];
      if (snapshots.length < 2) {
        sendResponse({ ok: true, players: [], error: snapshots.length === 0 ? 'Ingen snapshots' : 'Kun ét snapshot – scan igen senere' });
        return;
      }
      snapshots.sort(function (a, b) { return a.at - b.at; });
      var idxNow = snapshots.length - 1;
      var idxThen = 0;
      for (var i = 0; i < snapshots.length; i++) {
        if (snapshots[i].at <= then) idxThen = i;
      }
      var vNow = snapshots[idxNow].villages;
      var vThen = snapshots[idxThen].villages;
      var byPlayer = {};
      for (var vid in vNow) {
        if (!vNow[vid]) continue;
        var thenV = vThen[vid];
        var popThen = thenV ? (thenV.population || 0) : 0;
        var popNow = vNow[vid].population || 0;
        var growth = popNow - popThen;
        var pid = vNow[vid].playerId;
        if (!byPlayer[pid]) byPlayer[pid] = { playerId: pid, playerName: vNow[vid].playerName, growth: 0, villages: 0 };
        byPlayer[pid].growth += growth;
        byPlayer[pid].villages += 1;
      }
      var players = Object.keys(byPlayer).map(function (k) { return byPlayer[k]; });
      players.sort(function (a, b) { return a.growth - b.growth; });
      sendResponse({ ok: true, players: players });
    });
    return true;
  }
  if (msg.action === 'scanNow' || msg.action === 'runScheduledScan') {
    chrome.storage.local.get({ serverBaseUrl: '' }, function (data) {
      var base = (data.serverBaseUrl || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
      if (!base) {
        sendResponse && sendResponse({ ok: false, error: 'Ingen server URL' });
        return;
      }
      var url = base + '/map.sql';
      fetch(url)
        .then(function (res) { return res.text(); })
        .then(function (text) {
          var rows = parseMapSql(text);
          var villages = villagesFromRows(rows);
          var snapshot = { at: Date.now(), villages: villages };
          chrome.storage.local.get({ mapSnapshots: {}, lastScanAt: null }, function (st) {
            var key = base.replace(/^https?:\/\//, '').split('/')[0] || 'default';
            var snapshots = (st.mapSnapshots && st.mapSnapshots[key]) ? st.mapSnapshots[key].slice() : [];
            snapshots.push(snapshot);
            if (snapshots.length > SNAPSHOTS_TO_KEEP) snapshots = snapshots.slice(-SNAPSHOTS_TO_KEEP);
            var mapSnapshots = st.mapSnapshots || {};
            mapSnapshots[key] = snapshots;
            chrome.storage.local.set({ mapSnapshots: mapSnapshots, lastScanAt: snapshot.at });
            if (sendResponse) sendResponse({ ok: true, at: snapshot.at });
          });
        })
        .catch(function (err) {
          if (sendResponse) sendResponse({ ok: false, error: err && err.message || 'Fetch fejlede' });
        });
    });
    return true;
  }
});

scheduleNext();
