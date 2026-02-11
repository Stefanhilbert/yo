'use strict';

(function () {
  var serverUrlEl = document.getElementById('serverUrl');
  var scanNowBtn = document.getElementById('scanNow');
  var scanStatusEl = document.getElementById('scanStatus');
  var nextScanHintEl = document.getElementById('nextScanHint');
  var themeToggle = document.getElementById('themeToggle');
  var openOptionsBtn = document.getElementById('openOptions');

  function loadTheme() {
    chrome.storage.local.get({ theme: 'light' }, function (data) {
      document.body.className = 'theme-' + (data.theme || 'light');
      themeToggle.textContent = (data.theme === 'dark') ? 'Lys' : 'Mørk';
    });
  }

  themeToggle.addEventListener('click', function () {
    var isDark = document.body.classList.contains('theme-dark');
    var next = isDark ? 'light' : 'dark';
    chrome.storage.local.set({ theme: next });
    document.body.className = 'theme-' + next;
    themeToggle.textContent = next === 'dark' ? 'Lys' : 'Mørk';
  });

  openOptionsBtn.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });

  chrome.storage.local.get({ serverBaseUrl: '' }, function (data) {
    serverUrlEl.value = data.serverBaseUrl || '';
  });

  serverUrlEl.addEventListener('change', function () {
    var url = (serverUrlEl.value || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
    chrome.storage.local.set({ serverBaseUrl: url });
  });

  function setStatus(msg, isError) {
    scanStatusEl.textContent = msg || '';
    scanStatusEl.className = 'status' + (isError ? ' error' : ' ok');
  }

  function updateNextScan() {
    chrome.runtime.sendMessage({ action: 'getNextScanTime' }, function (res) {
      if (res && res.when) {
        var d = new Date(res.when);
        nextScanHintEl.textContent = 'Næste scan: ' + d.toLocaleString();
      } else {
        nextScanHintEl.textContent = '';
      }
    });
  }

  scanNowBtn.addEventListener('click', function () {
    var url = (serverUrlEl.value || '').trim().replace(/\/map\.sql.*$/, '').replace(/\/+$/, '');
    if (!url) {
      setStatus('Indtast server URL', true);
      return;
    }
    chrome.storage.local.set({ serverBaseUrl: url });
    setStatus('Scanner…', false);
    scanNowBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'scanNow' }, function (response) {
      scanNowBtn.disabled = false;
      if (chrome.runtime.lastError) {
        setStatus('Fejl: ' + (chrome.runtime.lastError.message || 'Ukendt'), true);
        return;
      }
      if (response && response.ok) {
        setStatus('Sidste scan: ' + (response.at ? new Date(response.at).toLocaleString() : 'nu'));
        updateNextScan();
      } else {
        setStatus((response && response.error) || 'Scan fejlede', true);
      }
    });
  });

  chrome.action.setBadgeText({ text: '' });
  loadTheme();
  chrome.storage.local.get({ lastScanAt: null }, function (data) {
    if (data.lastScanAt) {
      setStatus('Sidste scan: ' + new Date(data.lastScanAt).toLocaleString(), false);
    }
    updateNextScan();
  });
})();
