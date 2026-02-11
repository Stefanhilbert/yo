(function () {
  'use strict';

  var ALARM_NAME = 'yoFarmerAuto';
  var PRESET_TABLE = {
    low: { baseMinutes: 7, randomizationSeconds: 200 },
    medium: { baseMinutes: 5, randomizationSeconds: 100 },
    high: { baseMinutes: 3, randomizationSeconds: 50 }
  };

  var sendNowBtn = document.getElementById('sendNow');
  var autoCb = document.getElementById('auto');
  var stopBtn = document.getElementById('stopBtn');
  var countdownEl = document.getElementById('countdown');
  var statusEl = document.getElementById('status');
  var themeToggle = document.getElementById('themeToggle');
  var linkTabBtn = document.getElementById('linkTab');
  var openOptionsBtn = document.getElementById('openOptions');
  var countdownInterval = null;
  var currentLocale = 'en';

  function L() { return window.YOFARMER_I18N[currentLocale] && window.YOFARMER_I18N[currentLocale].popup; }

  function applyPopupTranslations() {
    var p = L();
    if (!p) return;
    var titleEl = document.getElementById('title');
    if (titleEl) titleEl.textContent = p.title;
    if (sendNowBtn) sendNowBtn.textContent = p.sendNow;
    var autoLabel = document.getElementById('autoLabel');
    if (autoLabel) autoLabel.textContent = p.auto;
    if (stopBtn) stopBtn.textContent = p.stop;
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('theme-dark') ? p.themeLight : p.themeDark;
    if (linkTabBtn) linkTabBtn.textContent = p.linkTab;
    if (openOptionsBtn) openOptionsBtn.textContent = p.openOptions;
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-locale') === currentLocale);
    });
  }

  function setStatus(text, isError) {
    statusEl.textContent = text || '';
    statusEl.className = isError ? 'error' : '';
    var p = L();
    if (p && text === p.statusSending) countdownEl.style.display = 'none';
    else if (autoCb.checked) countdownEl.style.display = 'block';
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    var p = L();
    if (themeToggle && p) themeToggle.textContent = theme === 'dark' ? p.themeLight : p.themeDark;
  }

  function getBaseAndRandomizationFromData(data) {
    var preset = data.randomizationPreset || 'medium';
    if (preset === 'custom') {
      return {
        baseMinutes: Math.max(1, Math.min(120, parseInt(data.customBaseMinutes, 10) || 5)),
        randomizationSeconds: Math.max(0, Math.min(300, parseInt(data.customRandomizationSeconds, 10) || 60))
      };
    }
    var row = PRESET_TABLE[preset] || PRESET_TABLE.medium;
    return { baseMinutes: row.baseMinutes, randomizationSeconds: row.randomizationSeconds };
  }

  function buildListTimings(farmIds, data) {
    var tacticsById = {};
    (data.tactics || []).forEach(function (t) { tacticsById[t.id] = t; });
    var global = getBaseAndRandomizationFromData(data);
    var listTimings = [];
    farmIds.forEach(function (id) {
      var tacticId = (data.farmListTactic || {})[id];
      var tactic = tacticId ? tacticsById[tacticId] : null;
      var base = global.baseMinutes;
      var rand = global.randomizationSeconds;
      if (tactic) {
        base = Math.max(1, Math.min(120, tactic.baseMinutes || 5));
        rand = Math.max(0, Math.min(300, tactic.randomizationSeconds || 60));
      }
      listTimings.push({ farmId: id, baseMinutes: base, randomizationSeconds: rand });
    });
    return listTimings;
  }

  function loadOptions() {
    chrome.storage.local.get({
      auto: false,
      theme: 'light',
      locale: 'en'
    }, function (data) {
      currentLocale = (data.locale === 'da' || data.locale === 'en') ? data.locale : 'en';
      applyPopupTranslations();
      autoCb.checked = data.auto;
      applyTheme(data.theme || 'light');
      startCountdown();
    });
  }

  function formatCountdown(ms) {
    var p = L();
    if (!p) return '';
    if (ms <= 0) return p.countdownSoon;
    var sec = Math.floor(ms / 1000);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return p.countdownNext + m + p.countdownMin + (s < 10 ? '0' : '') + s + p.countdownSec;
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    if (!autoCb.checked) {
      countdownEl.style.display = 'none';
      return;
    }
    function tick() {
      chrome.alarms.get(ALARM_NAME, function (alarm) {
        if (!alarm || !alarm.scheduledTime) {
          var p = L();
          countdownEl.textContent = p ? p.autoOn : 'Auto is on.';
          countdownEl.style.display = 'block';
          return;
        }
        var remaining = alarm.scheduledTime - Date.now();
        countdownEl.textContent = formatCountdown(remaining);
        countdownEl.style.display = 'block';
      });
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  function doSendNow(tabId, data) {
    var useStartAll = data.startAll !== false;
    var farmIds = [];
    if (!useStartAll) {
      if (data.enabledFarmIdsOrder && data.enabledFarmIdsOrder.length) {
        farmIds = data.enabledFarmIdsOrder.filter(function (id) { return data.enabledFarmIds && data.enabledFarmIds[id]; });
      } else {
        farmIds = Object.keys(data.enabledFarmIds || {}).filter(function (id) { return data.enabledFarmIds[id]; });
      }
    }
    if (!useStartAll && farmIds.length === 0) {
      var p2 = L();
      setStatus(p2 ? p2.statusSelectList : 'Select at least one list in settings.', true);
      startCountdown();
      return;
    }
    var global = getBaseAndRandomizationFromData(data);
    var listTimings = useStartAll ? [] : buildListTimings(farmIds, data);
    var p3 = L();
    setStatus(p3 ? p3.statusSending : 'Sending…');
    chrome.tabs.sendMessage(tabId, {
      action: 'run',
      useStartAll: useStartAll,
      farmIds: farmIds,
      listTimings: listTimings,
      randomizationPreset: data.randomizationPreset || 'medium',
      randomizationSeconds: 0,
      baseMinutes: global.baseMinutes,
      randomizationSeconds: global.randomizationSeconds,
      simulateMouse: data.simulateMouse === true,
      fromAuto: false,
      onlyWhenTabVisible: data.onlyWhenTabVisible === true
    }, function (response) {
      var p4 = L();
      if (chrome.runtime.lastError) {
        setStatus(p4 ? p4.statusErrorFarmList : 'Error: Open Travian farm list page.', true);
        startCountdown();
        return;
      }
      if (response && response.ok) {
        setStatus(p4 ? p4.statusSent : 'Sent.');
      } else {
        setStatus((response && response.error) || (p4 ? 'Fejl' : 'Error'), true);
      }
      if (autoCb.checked) {
        chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
      }
      startCountdown();
    });
  }

  sendNowBtn.addEventListener('click', function () {
    var p = L();
    chrome.runtime.sendMessage({ action: 'getTargetTab' }, function (tabId) {
      if (!tabId) {
        setStatus(p ? p.statusNoTab : 'No tab. Open farm list or link a tab.', true);
        startCountdown();
        return;
      }
      chrome.storage.local.get({
        startAll: true,
        enabledFarmIds: {},
        enabledFarmIdsOrder: [],
        farmListTactic: {},
        tactics: [],
        randomizationPreset: 'medium',
        customBaseMinutes: 5,
        customRandomizationSeconds: 60,
        simulateMouse: true,
        onlyWhenTabVisible: false,
        confirmBeforeSendEnabled: false,
        confirmDelaySeconds: 0
      }, function (data) {
        var confirmSec = Math.max(0, Math.min(30, parseInt(data.confirmDelaySeconds, 10) || 0));
        if (data.confirmBeforeSendEnabled === true && confirmSec > 0) {
          var remaining = confirmSec;
          var pMsg = L();
          var msg = (pMsg && pMsg.confirmSendingIn) ? pMsg.confirmSendingIn.replace('%s', remaining) : 'Sending in ' + remaining + ' sec…';
          setStatus(msg);
          var iv = setInterval(function () {
            remaining--;
            var px = L();
            var txt = (px && px.confirmSendingIn) ? px.confirmSendingIn.replace('%s', remaining) : 'Sending in ' + remaining + ' sec…';
            setStatus(txt);
            if (remaining <= 0) {
              clearInterval(iv);
              doSendNow(tabId, data);
            }
          }, 1000);
          return;
        }
        doSendNow(tabId, data);
      });
    });
  });

  stopBtn.addEventListener('click', function () {
    autoCb.checked = false;
    chrome.storage.local.set({ auto: false });
    startCountdown();
  });

  autoCb.addEventListener('change', function () {
    chrome.storage.local.set({ auto: autoCb.checked });
    startCountdown();
  });

  themeToggle.addEventListener('click', function () {
    var theme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(theme);
    chrome.storage.local.set({ theme: theme });
  });

  linkTabBtn.addEventListener('click', function () {
    var p4 = L();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length || !tabs[0].id) {
        setStatus(p4 ? p4.statusNoTab : 'No tab.', true);
        return;
      }
      var url = (tabs[0].url || '');
      if (url.indexOf('travian') === -1) {
        setStatus(p4 ? p4.statusOpenFarmList : 'Open Travian farm list tab first.', true);
        return;
      }
      chrome.storage.local.set({ linkedTabId: tabs[0].id });
      setStatus(p4 ? p4.statusTabLinked : 'Tab linked.');
    });
  });

  openOptionsBtn.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('langEn').addEventListener('click', function () {
    currentLocale = 'en';
    chrome.storage.local.set({ locale: 'en' });
    applyPopupTranslations();
    applyTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
    startCountdown();
  });
  document.getElementById('langDa').addEventListener('click', function () {
    currentLocale = 'da';
    chrome.storage.local.set({ locale: 'da' });
    applyPopupTranslations();
    applyTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
    startCountdown();
  });

  window.addEventListener('unload', function () {
    if (countdownInterval) clearInterval(countdownInterval);
  });

  loadOptions();
})();
