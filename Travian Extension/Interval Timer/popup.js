(function () {
  'use strict';

  var ALARM_NAME = 'intervalTimer';
  var startBtn = document.getElementById('startBtn');
  var stopBtn = document.getElementById('stopBtn');
  var countdownEl = document.getElementById('countdown');
  var statusEl = document.getElementById('status');
  var openOptionsBtn = document.getElementById('openOptions');
  var themeToggle = document.getElementById('themeToggle');
  var countdownInterval = null;
  var currentLocale = 'en';

  function L() {
    return window.YOTIMER_I18N && window.YOTIMER_I18N[currentLocale] && window.YOTIMER_I18N[currentLocale].popup;
  }

  function applyTranslations() {
    var p = L();
    if (!p) return;
    var titleEl = document.getElementById('title');
    if (titleEl) titleEl.textContent = p.title;
    if (startBtn) startBtn.textContent = p.startTimer;
    if (stopBtn) stopBtn.textContent = p.stopTimer;
    if (openOptionsBtn) openOptionsBtn.textContent = p.openOptions;
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('theme-dark') ? p.themeLight : p.themeDark;
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-locale') === currentLocale);
    });
    updateStatusAndCountdown();
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    var p = L();
    if (themeToggle && p) themeToggle.textContent = theme === 'dark' ? p.themeLight : p.themeDark;
  }

  function updateStatusAndCountdown() {
    chrome.storage.local.get({ enabled: false }, function (data) {
      var p = L();
      if (data.enabled) {
        statusEl.textContent = p ? p.statusOn : 'Timer is on.';
        countdownEl.style.display = 'block';
      } else {
        statusEl.textContent = p ? p.statusOff : 'Timer is off.';
        countdownEl.style.display = 'none';
      }
    });
  }

  function formatCountdown(ms) {
    var p = L();
    if (!p) return '';
    if (ms <= 0) return p.nextRingSoon;
    var min = Math.floor(ms / 60000);
    return p.nextRingIn + min + p.nextRingMin;
  }

  function tickCountdown() {
    chrome.storage.local.get({ enabled: false }, function (data) {
      if (!data.enabled) {
        countdownEl.style.display = 'none';
        return;
      }
      chrome.alarms.get(ALARM_NAME, function (alarm) {
        if (!alarm || !alarm.scheduledTime) {
          countdownEl.textContent = L() ? L().nextRingSoon : 'Ringing soon…';
          countdownEl.style.display = 'block';
          return;
        }
        var remaining = alarm.scheduledTime - Date.now();
        countdownEl.textContent = formatCountdown(remaining);
        countdownEl.style.display = 'block';
      });
    });
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    tickCountdown();
    countdownInterval = setInterval(tickCountdown, 1000);
  }

  function load() {
    chrome.storage.local.get({ enabled: false, theme: 'light', locale: 'en' }, function (data) {
      currentLocale = (data.locale === 'da' || data.locale === 'en') ? data.locale : 'en';
      applyTranslations();
      applyTheme(data.theme || 'light');
      updateStatusAndCountdown();
      startCountdown();
    });
  }

  startBtn.addEventListener('click', function () {
    chrome.storage.local.set({ enabled: true });
    chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
    updateStatusAndCountdown();
    startCountdown();
    load();
  });

  stopBtn.addEventListener('click', function () {
    chrome.storage.local.set({ enabled: false });
    chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
    updateStatusAndCountdown();
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    load();
  });

  openOptionsBtn.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });

  themeToggle.addEventListener('click', function () {
    var theme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(theme);
    chrome.storage.local.set({ theme: theme });
  });

  document.getElementById('langEn').addEventListener('click', function () {
    currentLocale = 'en';
    chrome.storage.local.set({ locale: 'en' });
    applyTranslations();
    startCountdown();
  });
  document.getElementById('langDa').addEventListener('click', function () {
    currentLocale = 'da';
    chrome.storage.local.set({ locale: 'da' });
    applyTranslations();
    startCountdown();
  });

  load();
})();
