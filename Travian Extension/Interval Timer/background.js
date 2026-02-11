'use strict';

var ALARM_NAME = 'intervalTimer';

var NOTIFICATION_TEXTS = {
  en: { title: 'YO Timer', message: "Time's up!" },
  da: { title: 'YO Timer', message: 'Tiden er gået!' }
};

function scheduleAlarm() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.get({
    enabled: false,
    intervalMinutes: 30
  }, function (data) {
    if (!data.enabled) return;
    var minutes = Math.max(1, Math.min(120, parseInt(data.intervalMinutes, 10) || 30));
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: minutes });
  });
}

function onAlarmFired() {
  chrome.storage.local.get({
    soundEnabled: true,
    notificationEnabled: true,
    redirectEnabled: false,
    redirectUrl: '',
    locale: 'en'
  }, function (data) {
    var locale = (data.locale === 'da' || data.locale === 'en') ? data.locale : 'en';
    var texts = NOTIFICATION_TEXTS[locale] || NOTIFICATION_TEXTS.en;

    if (data.notificationEnabled) {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/48.png'),
          title: texts.title,
          message: texts.message
        });
      } catch (e) {}
    }

    if (data.soundEnabled) {
      chrome.tabs.create({ url: chrome.runtime.getURL('ring.html') }, function (tab) {
        if (tab && tab.id) {
          setTimeout(function () {
            chrome.tabs.remove(tab.id, function () {});
          }, 2500);
        }
      });
    }

    if (data.redirectEnabled && data.redirectUrl) {
      var url = (data.redirectUrl || '').trim();
      if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
        chrome.tabs.create({ url: url });
      }
    }
  });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== ALARM_NAME) return;
  onAlarmFired();
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== 'local') return;
  if (changes.enabled || changes.intervalMinutes) {
    scheduleAlarm();
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.action === 'reschedule') {
    scheduleAlarm();
    sendResponse();
  }
  return false;
});

chrome.runtime.onInstalled.addListener(function () {
  scheduleAlarm();
});

scheduleAlarm();
