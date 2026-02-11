(function () {
  'use strict';

  var MAX_TACTICS = 5;
  var PRESET_TABLE = {
    low: { baseMinutes: 7, randomizationSeconds: 200 },
    medium: { baseMinutes: 5, randomizationSeconds: 100 },
    high: { baseMinutes: 3, randomizationSeconds: 50 }
  };

  var randomPresetEl = document.getElementById('randomPreset');
  var customIntervalRow = document.getElementById('customIntervalRow');
  var customBaseMinutes = document.getElementById('customBaseMinutes');
  var customRandomizationSeconds = document.getElementById('customRandomizationSeconds');
  var tacticsListEl = document.getElementById('tacticsList');
  var addTacticBtn = document.getElementById('addTactic');
  var refreshListsBtn = document.getElementById('refreshLists');
  var farmListsBody = document.getElementById('farmListsBody');
  var noListsHint = document.getElementById('noListsHint');
  var startAllCb = document.getElementById('startAll');
  var farmListUrlEl = document.getElementById('farmListUrl');
  var openFarmListBtn = document.getElementById('openFarmList');
  var linkedStatusEl = document.getElementById('linkedStatus');
  var simulateMouseCb = document.getElementById('simulateMouse');
  var onlyWhenTabVisibleCb = document.getElementById('onlyWhenTabVisible');
  var maxRunsPerHourEnabledCb = document.getElementById('maxRunsPerHourEnabled');
  var rowMaxRunsPerHour = document.getElementById('rowMaxRunsPerHour');
  var maxRunsPerHourIn = document.getElementById('maxRunsPerHour');
  var minDelayMinutesEnabledCb = document.getElementById('minDelayMinutesEnabled');
  var rowMinDelay = document.getElementById('rowMinDelay');
  var minDelayMinutesIn = document.getElementById('minDelayMinutes');
  var confirmBeforeSendEnabledCb = document.getElementById('confirmBeforeSendEnabled');
  var rowConfirmDelay = document.getElementById('rowConfirmDelay');
  var confirmDelaySecondsIn = document.getElementById('confirmDelaySeconds');
  var pauseOnCaptchaEnabledCb = document.getElementById('pauseOnCaptchaEnabled');
  var soundOnSendEnabledCb = document.getElementById('soundOnSendEnabled');
  var notificationOnSendEnabledCb = document.getElementById('notificationOnSendEnabled');
  var timeWindowEnabledCb = document.getElementById('timeWindowEnabled');
  var rowTimeWindow = document.getElementById('rowTimeWindow');
  var timeWindowStartIn = document.getElementById('timeWindowStart');
  var timeWindowEndIn = document.getElementById('timeWindowEnd');
  var extraRandomDelayEnabledCb = document.getElementById('extraRandomDelayEnabled');
  var rowExtraRandomDelay = document.getElementById('rowExtraRandomDelay');
  var extraRandomDelaySecondsIn = document.getElementById('extraRandomDelaySeconds');
  var themeToggle = document.getElementById('themeToggle');
  var localeSelect = document.getElementById('localeSelect');

  var currentLocale = 'en';

  function O() { return window.YOFARMER_I18N && window.YOFARMER_I18N[currentLocale] && window.YOFARMER_I18N[currentLocale].options; }

  function applyTranslations() {
    var o = O();
    if (!o) return;
    var titleEl = document.getElementById('optionsTitle');
    if (titleEl) titleEl.textContent = o.title;
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('theme-dark') ? o.themeLight : o.themeDark;
    if (document.getElementById('headingGlobal')) document.getElementById('headingGlobal').textContent = o.globalInterval;
    if (document.getElementById('hintGlobal')) document.getElementById('hintGlobal').textContent = o.hintGlobal;
    if (document.getElementById('labelPreset')) document.getElementById('labelPreset').textContent = 'Preset';
    var presetSel = document.getElementById('randomPreset');
    if (presetSel) {
      var opts = presetSel.querySelectorAll('option');
      if (opts[0]) opts[0].textContent = o.presetLow;
      if (opts[1]) opts[1].textContent = o.presetMedium;
      if (opts[2]) opts[2].textContent = o.presetHigh;
      if (opts[3]) opts[3].textContent = o.presetCustom;
    }
    if (document.getElementById('labelBaseMin')) document.getElementById('labelBaseMin').textContent = o.baseMin;
    if (document.getElementById('labelRandSec')) document.getElementById('labelRandSec').textContent = o.randSec;
    if (document.getElementById('headingTactics')) document.getElementById('headingTactics').textContent = o.tactics;
    if (document.getElementById('hintTactics')) document.getElementById('hintTactics').textContent = o.hintTactics;
    if (addTacticBtn) addTacticBtn.textContent = o.addTactic;
    if (document.getElementById('headingFarmLists')) document.getElementById('headingFarmLists').textContent = o.farmLists;
    if (document.getElementById('hintFarmLists')) document.getElementById('hintFarmLists').textContent = o.hintFarmLists;
    if (refreshListsBtn) refreshListsBtn.textContent = o.refreshLists;
    if (document.getElementById('thList')) document.getElementById('thList').textContent = o.listCol;
    if (document.getElementById('thInAuto')) document.getElementById('thInAuto').textContent = o.inAutoCol;
    if (document.getElementById('thTactic')) document.getElementById('thTactic').textContent = o.tacticCol;
    if (noListsHint) noListsHint.textContent = o.noListsHint;
    if (document.getElementById('headingStartAll')) document.getElementById('headingStartAll').textContent = o.startAll + ' / selected';
    if (document.getElementById('labelStartAll')) document.getElementById('labelStartAll').textContent = o.startAll;
    if (document.getElementById('selectedListsHint')) document.getElementById('selectedListsHint').textContent = o.hintSelected;
    if (document.getElementById('headingLinkedTab')) document.getElementById('headingLinkedTab').textContent = o.linkedTab;
    if (document.getElementById('hintLinked')) document.getElementById('hintLinked').textContent = o.hintLinked;
    if (document.getElementById('labelFarmListUrl')) document.getElementById('labelFarmListUrl').textContent = o.farmListUrl;
    if (openFarmListBtn) openFarmListBtn.textContent = o.openFarmList;
    if (document.getElementById('headingSafety')) document.getElementById('headingSafety').textContent = o.safetySection;
    if (document.getElementById('labelSimulateMouse')) document.getElementById('labelSimulateMouse').textContent = o.simulateMouse;
    if (document.getElementById('labelOnlyWhenTabVisible')) document.getElementById('labelOnlyWhenTabVisible').textContent = o.onlyWhenTabVisible;
    if (document.getElementById('labelMaxRunsPerHour')) document.getElementById('labelMaxRunsPerHour').textContent = o.maxRunsPerHour;
    if (document.getElementById('hintMaxRunsPerHour')) document.getElementById('hintMaxRunsPerHour').textContent = o.maxRunsPerHourHint || '';
    if (document.getElementById('labelMinDelay')) document.getElementById('labelMinDelay').textContent = o.minDelayBetweenRuns;
    if (document.getElementById('hintMinDelay')) document.getElementById('hintMinDelay').textContent = o.minDelayHint || '';
    if (document.getElementById('labelConfirmBeforeSend')) document.getElementById('labelConfirmBeforeSend').textContent = o.confirmBeforeSend;
    if (document.getElementById('hintConfirmDelay')) document.getElementById('hintConfirmDelay').textContent = o.confirmDelayHint || '';
    if (document.getElementById('labelPauseOnCaptcha')) document.getElementById('labelPauseOnCaptcha').textContent = o.pauseOnCaptcha;
    if (document.getElementById('hintPauseOnCaptcha')) document.getElementById('hintPauseOnCaptcha').textContent = o.pauseOnCaptchaHint || '';
    if (document.getElementById('labelSoundOnSend')) document.getElementById('labelSoundOnSend').textContent = o.soundOnSend;
    if (document.getElementById('labelNotificationOnSend')) document.getElementById('labelNotificationOnSend').textContent = o.notificationOnSend;
    if (document.getElementById('labelTimeWindow')) document.getElementById('labelTimeWindow').textContent = o.timeWindow;
    if (document.getElementById('labelTimeWindowStart')) document.getElementById('labelTimeWindowStart').textContent = o.timeWindowStart;
    if (document.getElementById('labelTimeWindowEnd')) document.getElementById('labelTimeWindowEnd').textContent = o.timeWindowEnd;
    if (document.getElementById('hintTimeWindow')) document.getElementById('hintTimeWindow').textContent = o.timeWindowHint || '';
    if (document.getElementById('labelExtraRandomDelay')) document.getElementById('labelExtraRandomDelay').textContent = o.extraRandomDelay;
    if (document.getElementById('hintExtraRandomDelay')) document.getElementById('hintExtraRandomDelay').textContent = o.extraRandomDelayHint || '';
    if (localeSelect) {
      var langOpts = localeSelect.querySelectorAll('option');
      if (langOpts[0]) langOpts[0].textContent = o.langEn;
      if (langOpts[1]) langOpts[1].textContent = o.langDa;
    }
  }

  function nextTacticId(tactics) {
    var used = {};
    tactics.forEach(function (t) { used[t.id] = true; });
    for (var i = 1; i <= MAX_TACTICS; i++) {
      var id = 't' + i;
      if (!used[id]) return id;
    }
    return null;
  }

  function load() {
    chrome.storage.local.get({
      theme: 'light',
      locale: 'en',
      randomizationPreset: 'medium',
      customBaseMinutes: 5,
      customRandomizationSeconds: 60,
      tactics: [],
      farmListTactic: {},
      farmListsCache: [],
      startAll: true,
      enabledFarmIds: {},
      enabledFarmIdsOrder: [],
      linkedTabId: null,
      farmListUrl: '',
      simulateMouse: true,
      onlyWhenTabVisible: false,
      maxRunsPerHourEnabled: false,
      maxRunsPerHour: 60,
      minDelayMinutesEnabled: false,
      minDelayMinutes: 2,
      confirmBeforeSendEnabled: false,
      confirmDelaySeconds: 0,
      pauseOnCaptchaEnabled: false,
      soundOnSendEnabled: false,
      notificationOnSendEnabled: false,
      timeWindowEnabled: false,
      timeWindowStart: '00:00',
      timeWindowEnd: '23:59',
      extraRandomDelayEnabled: false,
      extraRandomDelaySeconds: 5
    }, function (data) {
      currentLocale = (data.locale === 'da' || data.locale === 'en') ? data.locale : 'en';
      if (localeSelect) localeSelect.value = currentLocale;
      applyTranslations();
      applyTheme(data.theme || 'light');
      randomPresetEl.value = data.randomizationPreset || 'medium';
      customBaseMinutes.value = Math.max(1, Math.min(120, parseInt(data.customBaseMinutes, 10) || 5));
      customRandomizationSeconds.value = Math.max(0, Math.min(300, parseInt(data.customRandomizationSeconds, 10) || 60));
      toggleCustomRow();
      renderTactics(data.tactics || []);
      farmListUrlEl.value = data.farmListUrl || '';
      startAllCb.checked = data.startAll !== false;
      simulateMouseCb.checked = data.simulateMouse !== false;
      if (onlyWhenTabVisibleCb) onlyWhenTabVisibleCb.checked = data.onlyWhenTabVisible === true;
      if (maxRunsPerHourEnabledCb) maxRunsPerHourEnabledCb.checked = data.maxRunsPerHourEnabled === true;
      if (maxRunsPerHourIn) maxRunsPerHourIn.value = Math.max(1, Math.min(200, parseInt(data.maxRunsPerHour, 10) || 60));
      if (minDelayMinutesEnabledCb) minDelayMinutesEnabledCb.checked = data.minDelayMinutesEnabled === true;
      if (minDelayMinutesIn) minDelayMinutesIn.value = Math.max(0, Math.min(60, parseInt(data.minDelayMinutes, 10) || 2));
      if (confirmBeforeSendEnabledCb) confirmBeforeSendEnabledCb.checked = data.confirmBeforeSendEnabled === true;
      if (confirmDelaySecondsIn) confirmDelaySecondsIn.value = Math.max(0, Math.min(30, parseInt(data.confirmDelaySeconds, 10) || 0));
      if (pauseOnCaptchaEnabledCb) pauseOnCaptchaEnabledCb.checked = data.pauseOnCaptchaEnabled === true;
      if (soundOnSendEnabledCb) soundOnSendEnabledCb.checked = data.soundOnSendEnabled === true;
      if (notificationOnSendEnabledCb) notificationOnSendEnabledCb.checked = data.notificationOnSendEnabled === true;
      if (timeWindowEnabledCb) timeWindowEnabledCb.checked = data.timeWindowEnabled === true;
      if (timeWindowStartIn) timeWindowStartIn.value = (data.timeWindowStart || '00:00').substring(0, 5);
      if (timeWindowEndIn) timeWindowEndIn.value = (data.timeWindowEnd || '23:59').substring(0, 5);
      if (extraRandomDelayEnabledCb) extraRandomDelayEnabledCb.checked = data.extraRandomDelayEnabled === true;
      if (extraRandomDelaySecondsIn) extraRandomDelaySecondsIn.value = Math.max(0, Math.min(120, parseInt(data.extraRandomDelaySeconds, 10) || 5));
      toggleSafetySubRows();
      renderFarmLists(data.farmListsCache || [], data.enabledFarmIds || {}, data.farmListTactic || {}, data.tactics || []);
      updateLinkedStatus(data.linkedTabId);
    });
  }

  function toggleSafetySubRows() {
    if (rowMaxRunsPerHour) rowMaxRunsPerHour.style.display = (maxRunsPerHourEnabledCb && maxRunsPerHourEnabledCb.checked) ? 'flex' : 'none';
    if (rowMinDelay) rowMinDelay.style.display = (minDelayMinutesEnabledCb && minDelayMinutesEnabledCb.checked) ? 'flex' : 'none';
    if (rowConfirmDelay) rowConfirmDelay.style.display = (confirmBeforeSendEnabledCb && confirmBeforeSendEnabledCb.checked) ? 'flex' : 'none';
    if (rowTimeWindow) rowTimeWindow.style.display = (timeWindowEnabledCb && timeWindowEnabledCb.checked) ? 'flex' : 'none';
    if (rowExtraRandomDelay) rowExtraRandomDelay.style.display = (extraRandomDelayEnabledCb && extraRandomDelayEnabledCb.checked) ? 'flex' : 'none';
  }

  function saveSafety() {
    var payload = {
      simulateMouse: simulateMouseCb.checked,
      onlyWhenTabVisible: onlyWhenTabVisibleCb ? onlyWhenTabVisibleCb.checked : false,
      maxRunsPerHourEnabled: maxRunsPerHourEnabledCb ? maxRunsPerHourEnabledCb.checked : false,
      maxRunsPerHour: maxRunsPerHourIn ? (parseInt(maxRunsPerHourIn.value, 10) || 60) : 60,
      minDelayMinutesEnabled: minDelayMinutesEnabledCb ? minDelayMinutesEnabledCb.checked : false,
      minDelayMinutes: minDelayMinutesIn ? (parseInt(minDelayMinutesIn.value, 10) || 2) : 2,
      confirmBeforeSendEnabled: confirmBeforeSendEnabledCb ? confirmBeforeSendEnabledCb.checked : false,
      confirmDelaySeconds: confirmDelaySecondsIn ? (parseInt(confirmDelaySecondsIn.value, 10) || 0) : 0,
      pauseOnCaptchaEnabled: pauseOnCaptchaEnabledCb ? pauseOnCaptchaEnabledCb.checked : false,
      soundOnSendEnabled: soundOnSendEnabledCb ? soundOnSendEnabledCb.checked : false,
      notificationOnSendEnabled: notificationOnSendEnabledCb ? notificationOnSendEnabledCb.checked : false,
      timeWindowEnabled: timeWindowEnabledCb ? timeWindowEnabledCb.checked : false,
      timeWindowStart: timeWindowStartIn ? (timeWindowStartIn.value || '00:00').substring(0, 5) : '00:00',
      timeWindowEnd: timeWindowEndIn ? (timeWindowEndIn.value || '23:59').substring(0, 5) : '23:59',
      extraRandomDelayEnabled: extraRandomDelayEnabledCb ? extraRandomDelayEnabledCb.checked : false,
      extraRandomDelaySeconds: extraRandomDelaySecondsIn ? (parseInt(extraRandomDelaySecondsIn.value, 10) || 5) : 5
    };
    chrome.storage.local.set(payload);
    chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    var o = O();
    if (themeToggle && o) themeToggle.textContent = theme === 'dark' ? o.themeLight : o.themeDark;
  }

  function saveGlobal() {
    var theme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    chrome.storage.local.set({
      theme: theme,
      randomizationPreset: randomPresetEl.value,
      customBaseMinutes: parseInt(customBaseMinutes.value, 10) || 5,
      customRandomizationSeconds: parseInt(customRandomizationSeconds.value, 10) || 60,
      startAll: startAllCb.checked,
      farmListUrl: farmListUrlEl.value.trim()
    });
    saveSafety();
  }

  function toggleCustomRow() {
    customIntervalRow.style.display = randomPresetEl.value === 'custom' ? 'flex' : 'none';
  }

  function renderTactics(tactics) {
    tacticsListEl.innerHTML = '';
    (tactics || []).forEach(function (t) {
      var wrap = document.createElement('div');
      wrap.className = 'tactic-row';
      var o = O();
      var phName = o ? o.namePlaceholder : 'Name';
      var phMin = o ? o.minPlaceholder : 'Min';
      var phSec = o ? o.secPlaceholder : 'Sec';
      var delTxt = o ? o.deleteBtn : 'Delete';
      wrap.innerHTML =
        '<input type="text" class="name" placeholder="' + phName + '" value="' + (t.name || '').replace(/"/g, '&quot;') + '">' +
        '<input type="number" class="num" placeholder="' + phMin + '" value="' + (t.baseMinutes != null ? t.baseMinutes : 5) + '" min="1" max="120" title="' + (o ? o.baseMin : 'Base (min)') + '">' +
        '<input type="number" class="num" placeholder="' + phSec + '" value="' + (t.randomizationSeconds != null ? t.randomizationSeconds : 60) + '" min="0" max="300" title="' + (o ? o.randSec : 'Rand (sec)') + '">' +
        '<button type="button" class="btn btn-secondary delete-tactic" data-id="' + (t.id || '').replace(/"/g, '&quot;') + '">' + delTxt + '</button>';
      var nameIn = wrap.querySelector('.name');
      var baseIn = wrap.querySelectorAll('.num')[0];
      var randIn = wrap.querySelectorAll('.num')[1];
      var delBtn = wrap.querySelector('.delete-tactic');
      function saveTactics() {
        var list = [];
        tacticsListEl.querySelectorAll('.tactic-row').forEach(function (row) {
          var id = row.querySelector('.delete-tactic').getAttribute('data-id');
          var n = row.querySelector('.name').value.trim();
          var b = parseInt(row.querySelectorAll('.num')[0].value, 10) || 5;
          var r = parseInt(row.querySelectorAll('.num')[1].value, 10) || 60;
          list.push({ id: id, name: n || id, baseMinutes: b, randomizationSeconds: r });
        });
        chrome.storage.local.set({ tactics: list });
        chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
      }
      nameIn.addEventListener('change', saveTactics);
      baseIn.addEventListener('change', saveTactics);
      randIn.addEventListener('change', saveTactics);
      delBtn.addEventListener('click', function () {
        var id = delBtn.getAttribute('data-id');
        var remaining = [];
        tacticsListEl.querySelectorAll('.tactic-row').forEach(function (row) {
          var rowId = row.querySelector('.delete-tactic').getAttribute('data-id');
          if (rowId === id) return;
          var n = row.querySelector('.name').value.trim();
          var b = parseInt(row.querySelectorAll('.num')[0].value, 10) || 5;
          var r = parseInt(row.querySelectorAll('.num')[1].value, 10) || 60;
          remaining.push({ id: rowId, name: n || rowId, baseMinutes: b, randomizationSeconds: r });
        });
        chrome.storage.local.get({ farmListTactic: {} }, function (data) {
          var ft = data.farmListTactic || {};
          Object.keys(ft).forEach(function (fid) { if (ft[fid] === id) ft[fid] = null; });
          chrome.storage.local.set({ farmListTactic: ft, tactics: remaining });
          load();
          chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
        });
      });
      tacticsListEl.appendChild(wrap);
    });
  }

  addTacticBtn.addEventListener('click', function () {
    chrome.storage.local.get({ tactics: [] }, function (data) {
      var tactics = data.tactics || [];
      if (tactics.length >= MAX_TACTICS) return;
      var id = nextTacticId(tactics);
      if (!id) return;
      var o = O();
      var tacticLabel = o ? o.tacticName + id : 'Tactic ' + id;
      tactics.push({ id: id, name: tacticLabel, baseMinutes: 5, randomizationSeconds: 60 });
      chrome.storage.local.set({ tactics: tactics });
      renderTactics(tactics);
      chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
    });
  });

  function renderFarmLists(lists, enabledFarmIds, farmListTactic, tactics) {
    tactics = tactics || [];
    farmListsBody.innerHTML = '';
    noListsHint.style.display = lists.length ? 'none' : 'block';
    lists.forEach(function (f) {
      var tr = document.createElement('tr');
      var o = O();
      var globalLabel = o ? o.global : 'Global';
      var tacticId = farmListTactic[f.id] || '';
      var sel = document.createElement('select');
      sel.setAttribute('data-farm-id', f.id);
      sel.innerHTML = '<option value="">' + globalLabel + '</option>';
      tactics.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name || t.id;
        if (t.id === tacticId) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-farm-id');
        chrome.storage.local.get({ farmListTactic: {} }, function (data) {
          var ft = data.farmListTactic || {};
          ft[id] = sel.value || null;
          chrome.storage.local.set({ farmListTactic: ft });
          chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
        });
      });
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = enabledFarmIds[f.id] !== false;
      cb.setAttribute('data-farm-id', f.id);
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-farm-id');
        chrome.storage.local.get({ enabledFarmIds: {}, enabledFarmIdsOrder: [] }, function (data) {
          var en = data.enabledFarmIds || {};
          var order = data.enabledFarmIdsOrder || [];
          if (cb.checked) {
            en[id] = true;
            if (order.indexOf(id) === -1) order.push(id);
          } else {
            en[id] = false;
            order = order.filter(function (x) { return x !== id; });
          }
          chrome.storage.local.set({ enabledFarmIds: en, enabledFarmIdsOrder: order });
          chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
        });
      });
      var tdName = document.createElement('td');
      tdName.textContent = (f.name || f.id) + (f.village ? ' (' + f.village + ')' : '');
      var tdCb = document.createElement('td');
      tdCb.appendChild(cb);
      var tdSel = document.createElement('td');
      tdSel.appendChild(sel);
      tr.appendChild(tdName);
      tr.appendChild(tdCb);
      tr.appendChild(tdSel);
      farmListsBody.appendChild(tr);
    });
  }

  refreshListsBtn.addEventListener('click', function () {
    function tryTab(tabId, cb) {
      if (!tabId) return cb();
      chrome.tabs.sendMessage(tabId, { action: 'getFarmLists' }, function (response) {
        if (chrome.runtime.lastError || !response || !response.lists) return cb();
        chrome.storage.local.set({ farmListsCache: response.lists });
        chrome.storage.local.get({ enabledFarmIds: {}, farmListTactic: {}, tactics: [] }, function (data) {
          renderFarmLists(response.lists, data.enabledFarmIds || {}, data.farmListTactic || {}, data.tactics || []);
        });
        cb(true);
      });
    }
    chrome.storage.local.get({ linkedTabId: null }, function (data) {
      tryTab(data.linkedTabId, function (done) {
        if (done) return;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length && tabs[0].id) tryTab(tabs[0].id, function () {});
        });
      });
    });
  });

  openFarmListBtn.addEventListener('click', function () {
    var url = farmListUrlEl.value.trim();
    if (!url) return;
    chrome.storage.local.set({ farmListUrl: url });
    chrome.tabs.create({ url: url }, function (tab) {
      if (tab && tab.id) {
        chrome.storage.local.set({ linkedTabId: tab.id });
        updateLinkedStatus(tab.id);
      }
    });
  });

  function updateLinkedStatus(linkedTabId) {
    linkedStatusEl.setAttribute('data-linked-id', linkedTabId ? String(linkedTabId) : '');
    var o = O();
    if (!linkedTabId) {
      linkedStatusEl.textContent = o ? o.linkedStatusNone : 'No linked tab.';
      return;
    }
    chrome.tabs.get(linkedTabId, function (tab) {
      if (chrome.runtime.lastError || !tab) {
        linkedStatusEl.textContent = o ? o.linkedStatusClosed : 'Linked tab was closed.';
        chrome.storage.local.remove('linkedTabId');
        return;
      }
      linkedStatusEl.textContent = (o ? o.linkedStatusLinked : 'Tab linked (tab ID ') + linkedTabId + (o ? o.linkedStatusLinkedSuffix : ').');
    });
  }

  randomPresetEl.addEventListener('change', function () {
    toggleCustomRow();
    saveGlobal();
    chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
  });
  customBaseMinutes.addEventListener('change', saveGlobal);
  customRandomizationSeconds.addEventListener('change', saveGlobal);
  startAllCb.addEventListener('change', saveGlobal);
  simulateMouseCb.addEventListener('change', function () { saveSafety(); });
  if (onlyWhenTabVisibleCb) onlyWhenTabVisibleCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (maxRunsPerHourEnabledCb) maxRunsPerHourEnabledCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (maxRunsPerHourIn) maxRunsPerHourIn.addEventListener('change', saveSafety);
  if (minDelayMinutesEnabledCb) minDelayMinutesEnabledCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (minDelayMinutesIn) minDelayMinutesIn.addEventListener('change', saveSafety);
  if (confirmBeforeSendEnabledCb) confirmBeforeSendEnabledCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (confirmDelaySecondsIn) confirmDelaySecondsIn.addEventListener('change', saveSafety);
  if (pauseOnCaptchaEnabledCb) pauseOnCaptchaEnabledCb.addEventListener('change', saveSafety);
  if (soundOnSendEnabledCb) soundOnSendEnabledCb.addEventListener('change', saveSafety);
  if (notificationOnSendEnabledCb) notificationOnSendEnabledCb.addEventListener('change', saveSafety);
  if (timeWindowEnabledCb) timeWindowEnabledCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (timeWindowStartIn) timeWindowStartIn.addEventListener('change', saveSafety);
  if (timeWindowEndIn) timeWindowEndIn.addEventListener('change', saveSafety);
  if (extraRandomDelayEnabledCb) extraRandomDelayEnabledCb.addEventListener('change', function () { toggleSafetySubRows(); saveSafety(); });
  if (extraRandomDelaySecondsIn) extraRandomDelaySecondsIn.addEventListener('change', saveSafety);
  farmListUrlEl.addEventListener('change', function () { chrome.storage.local.set({ farmListUrl: farmListUrlEl.value.trim() }); });
  themeToggle.addEventListener('click', function () {
    var theme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(theme);
    chrome.storage.local.set({ theme: theme });
  });

  if (localeSelect) {
    localeSelect.addEventListener('change', function () {
      currentLocale = localeSelect.value === 'da' ? 'da' : 'en';
      chrome.storage.local.set({ locale: currentLocale });
      applyTranslations();
      applyTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
      chrome.storage.local.get({ tactics: [], farmListsCache: [], enabledFarmIds: {}, farmListTactic: {}, linkedTabId: null }, function (data) {
        renderTactics(data.tactics || []);
        renderFarmLists(data.farmListsCache || [], data.enabledFarmIds || {}, data.farmListTactic || {}, data.tactics || []);
        updateLinkedStatus(data.linkedTabId);
      });
    });
  }

  load();
})();
