(function () {
  'use strict';

  var localeSelect = document.getElementById('localeSelect');
  var optionsTitle = document.getElementById('optionsTitle');
  var themeToggle = document.getElementById('themeToggle');
  var intervalMinutes = document.getElementById('intervalMinutes');
  var redirectUrl = document.getElementById('redirectUrl');
  var soundEnabled = document.getElementById('soundEnabled');
  var notificationEnabled = document.getElementById('notificationEnabled');
  var redirectEnabled = document.getElementById('redirectEnabled');
  var currentLocale = 'en';

  function O() {
    return window.YOTIMER_I18N && window.YOTIMER_I18N[currentLocale] && window.YOTIMER_I18N[currentLocale].options;
  }

  function applyTranslations() {
    var o = O();
    if (!o) return;
    if (document.getElementById('labelLanguage')) document.getElementById('labelLanguage').textContent = o.language;
    var opts = localeSelect.querySelectorAll('option');
    if (opts[0]) opts[0].textContent = o.langEn;
    if (opts[1]) opts[1].textContent = o.langDa;
    if (optionsTitle) optionsTitle.textContent = o.title;
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('theme-dark') ? o.themeLight : o.themeDark;
    if (document.getElementById('headingInterval')) document.getElementById('headingInterval').textContent = o.intervalHeading;
    if (document.getElementById('hintInterval')) document.getElementById('hintInterval').textContent = o.intervalHint;
    if (document.getElementById('labelInterval')) document.getElementById('labelInterval').textContent = o.intervalLabel;
    if (document.getElementById('headingUrl')) document.getElementById('headingUrl').textContent = o.urlHeading;
    if (document.getElementById('hintUrl')) document.getElementById('hintUrl').textContent = o.urlHint;
    if (document.getElementById('labelUrl')) document.getElementById('labelUrl').textContent = o.urlLabel;
    if (redirectUrl) redirectUrl.placeholder = o.urlPlaceholder || 'https://…';
    var hActions = document.getElementById('headingActions');
    if (hActions && o.whenRingHeading) hActions.textContent = o.whenRingHeading;
    if (document.getElementById('labelSound')) document.getElementById('labelSound').textContent = o.soundLabel;
    if (document.getElementById('labelNotification')) document.getElementById('labelNotification').textContent = o.notificationLabel;
    if (document.getElementById('labelRedirect')) document.getElementById('labelRedirect').textContent = o.redirectLabel;
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    var o = O();
    if (themeToggle && o) themeToggle.textContent = theme === 'dark' ? o.themeLight : o.themeDark;
  }

  function save() {
    var minutes = Math.max(1, Math.min(120, parseInt(intervalMinutes.value, 10) || 30));
    chrome.storage.local.set({
      intervalMinutes: minutes,
      redirectUrl: (redirectUrl.value || '').trim(),
      soundEnabled: soundEnabled.checked,
      notificationEnabled: notificationEnabled.checked,
      redirectEnabled: redirectEnabled.checked,
      locale: currentLocale,
      theme: document.body.classList.contains('theme-dark') ? 'dark' : 'light'
    });
    chrome.runtime.sendMessage({ action: 'reschedule' }, function () {});
  }

  function load() {
    chrome.storage.local.get({
      intervalMinutes: 30,
      redirectUrl: '',
      soundEnabled: true,
      notificationEnabled: true,
      redirectEnabled: false,
      locale: 'en',
      theme: 'light'
    }, function (data) {
      currentLocale = (data.locale === 'da' || data.locale === 'en') ? data.locale : 'en';
      if (localeSelect) localeSelect.value = currentLocale;
      applyTranslations();
      applyTheme(data.theme || 'light');
      intervalMinutes.value = Math.max(1, Math.min(120, data.intervalMinutes || 30));
      redirectUrl.value = data.redirectUrl || '';
      soundEnabled.checked = data.soundEnabled !== false;
      notificationEnabled.checked = data.notificationEnabled !== false;
      redirectEnabled.checked = data.redirectEnabled === true;
    });
  }

  localeSelect.addEventListener('change', function () {
    currentLocale = localeSelect.value === 'da' ? 'da' : 'en';
    chrome.storage.local.set({ locale: currentLocale });
    applyTranslations();
  });

  themeToggle.addEventListener('click', function () {
    var theme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(theme);
    chrome.storage.local.set({ theme: theme });
  });

  intervalMinutes.addEventListener('change', save);
  redirectUrl.addEventListener('change', save);
  soundEnabled.addEventListener('change', save);
  notificationEnabled.addEventListener('change', save);
  redirectEnabled.addEventListener('change', save);

  load();
})();
