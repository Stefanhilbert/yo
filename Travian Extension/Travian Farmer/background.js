'use strict';

var ALARM_NAME = 'yoFarmerAuto';

var PRESET_TABLE = {
  low: { baseMinutes: 7, randomizationSeconds: 200 },
  medium: { baseMinutes: 5, randomizationSeconds: 100 },
  high: { baseMinutes: 3, randomizationSeconds: 50 }
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getBaseAndRandomization(data) {
  var preset = data.randomizationPreset || 'medium';
  if (preset === 'custom') {
    var base = Math.max(1, Math.min(120, parseInt(data.customBaseMinutes, 10) || 5));
    var rand = Math.max(0, Math.min(300, parseInt(data.customRandomizationSeconds, 10) || 60));
    return { baseMinutes: base, randomizationSeconds: rand };
  }
  var row = PRESET_TABLE[preset] || PRESET_TABLE.medium;
  return { baseMinutes: row.baseMinutes, randomizationSeconds: row.randomizationSeconds };
}

function getIntervalForTactic(tactic) {
  if (!tactic) return null;
  var b = Math.max(1, Math.min(120, tactic.baseMinutes || 5));
  var r = Math.max(0, Math.min(300, tactic.randomizationSeconds || 0));
  return { baseMinutes: b, randomizationSeconds: r };
}

function computeNextDelayMsFromInterval(interval) {
  var baseMs = interval.baseMinutes * 60 * 1000;
  var randMs = interval.randomizationSeconds * 1000;
  var offset = randomBetween(-randMs, randMs);
  var delayMs = baseMs + offset;
  var minDelay = 60 * 1000;
  if (delayMs < minDelay) delayMs = minDelay;
  return delayMs;
}

function computeNextDelayMsWithSafety(data, interval) {
  var base = computeNextDelayMsFromInterval(interval);
  if (data.extraRandomDelayEnabled === true && data.extraRandomDelaySeconds > 0) {
    var sec = Math.min(120, parseInt(data.extraRandomDelaySeconds, 10) || 0) * 1000;
    base += randomBetween(-sec, sec);
    if (base < 60000) base = 60000;
  }
  return base;
}

function isInTimeWindow(now, startHHMM, endHHMM) {
  if (!startHHMM || !endHHMM) return true;
  var d = new Date(now);
  var mins = d.getHours() * 60 + d.getMinutes();
  var partsS = (startHHMM + '').split(':');
  var partsE = (endHHMM + '').split(':');
  var startMins = (parseInt(partsS[0], 10) || 0) * 60 + (parseInt(partsS[1], 10) || 0);
  var endMins = (parseInt(partsE[0], 10) || 0) * 60 + (parseInt(partsE[1], 10) || 0);
  if (startMins <= endMins) return mins >= startMins && mins <= endMins;
  return mins >= startMins || mins <= endMins;
}

function recordRunAndNotify(opts, tabId, cb) {
  var now = Date.now();
  chrome.storage.local.get({ runTimestamps: [], lastRunTimestamp: 0 }, function (data) {
    var ts = (data.runTimestamps || []).filter(function (t) { return now - t < 3600000; });
    ts.push(now);
    chrome.storage.local.set({ runTimestamps: ts, lastRunTimestamp: now });
    if (opts.soundOnSendEnabled === true && tabId) {
      chrome.tabs.sendMessage(tabId, { action: 'playSendSound' }, function () { if (chrome.runtime.lastError) {} });
    }
    if (opts.notificationOnSendEnabled === true) {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/48.png'),
          title: 'YOFarmer',
          message: 'Troops sent.'
        });
      } catch (e) {}
    }
    if (cb) cb();
  });
}

function computeNextDelayMs(data) {
  var o = getBaseAndRandomization(data);
  return computeNextDelayMsFromInterval(o);
}

function getTargetTab(cb) {
  chrome.storage.local.get({ linkedTabId: null }, function (data) {
    var linked = data.linkedTabId;
    if (linked) {
      chrome.tabs.get(linked, function (tab) {
        if (!chrome.runtime.lastError && tab && tab.id) {
          return cb(tab.id);
        }
        chrome.storage.local.remove('linkedTabId');
        tryFallback(cb);
      });
      return;
    }
    tryFallback(cb);
  });
}

function tryFallback(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length && tabs[0].id && (tabs[0].url || '').indexOf('travian') !== -1) {
      return cb(tabs[0].id);
    }
    chrome.tabs.query({ url: '*://*.travian.com/*' }, function (travian) {
      if (travian.length && travian[0].id) return cb(travian[0].id);
      chrome.tabs.query({ url: '*://*.travian.dk/*' }, function (t2) {
        if (t2.length && t2[0].id) return cb(t2[0].id);
        chrome.tabs.query({ url: '*://*.travian.de/*' }, function (t3) {
          if (t3.length && t3[0].id) return cb(t3[0].id);
          cb(null);
        });
      });
    });
  });
}

function scheduleNext() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.get({
    auto: false,
    startAll: true,
    enabledFarmIds: {},
    enabledFarmIdsOrder: [],
    farmListTactic: {},
    tactics: [],
    randomizationPreset: 'medium',
    customBaseMinutes: 5,
    customRandomizationSeconds: 60,
    globalNextRun: 0,
    nextRunPerList: {},
    extraRandomDelayEnabled: false,
    extraRandomDelaySeconds: 5
  }, function (data) {
    if (!data.auto) {
      if (chrome.power) chrome.power.releaseKeepAwake();
      return;
    }
    if (chrome.power) chrome.power.requestKeepAwake('system');

    var useStartAll = data.startAll !== false;
    var now = Date.now();

    if (useStartAll) {
      var interval = getBaseAndRandomization(data);
      var delayMs = computeNextDelayMsWithSafety(data, interval);
      chrome.alarms.create(ALARM_NAME, { when: now + delayMs });
      return;
    }

    var farmIds = [];
    if (data.enabledFarmIdsOrder && data.enabledFarmIdsOrder.length) {
      farmIds = data.enabledFarmIdsOrder.filter(function (id) { return data.enabledFarmIds && data.enabledFarmIds[id]; });
    } else if (data.enabledFarmIds) {
      farmIds = Object.keys(data.enabledFarmIds).filter(function (id) { return data.enabledFarmIds[id]; });
    }
    if (farmIds.length === 0) {
      chrome.alarms.create(ALARM_NAME, { when: now + 60 * 1000 });
      return;
    }

    var tacticsById = {};
    (data.tactics || []).forEach(function (t) { tacticsById[t.id] = t; });
    var globalInterval = getBaseAndRandomization(data);
    var globalDelayMs = computeNextDelayMsWithSafety(data, globalInterval);

    var globalNextRun = data.globalNextRun || 0;
    if (globalNextRun <= now) globalNextRun = now + globalDelayMs;
    var nextRunPerList = data.nextRunPerList || {};

    var nextAlarm = globalNextRun;
    farmIds.forEach(function (id) {
      var tacticId = (data.farmListTactic || {})[id];
      var tactic = tacticId ? tacticsById[tacticId] : null;
      if (tactic) {
        var interval = getIntervalForTactic(tactic);
        var delayMs = computeNextDelayMsWithSafety(data, interval);
        if (!nextRunPerList[id] || nextRunPerList[id] <= now) nextRunPerList[id] = now + delayMs;
        if (nextRunPerList[id] < nextAlarm) nextAlarm = nextRunPerList[id];
      } else {
        if (nextAlarm > globalNextRun) nextAlarm = globalNextRun;
      }
    });

    chrome.storage.local.set({ globalNextRun: globalNextRun, nextRunPerList: nextRunPerList });
    chrome.alarms.create(ALARM_NAME, { when: nextAlarm });
  });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== ALARM_NAME) return;
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
    globalNextRun: 0,
    nextRunPerList: {},
    onlyWhenTabVisible: false,
    maxRunsPerHourEnabled: false,
    maxRunsPerHour: 60,
    minDelayMinutesEnabled: false,
    minDelayMinutes: 2,
    pauseOnCaptchaEnabled: false,
    timeWindowEnabled: false,
    timeWindowStart: '00:00',
    timeWindowEnd: '23:59',
    extraRandomDelayEnabled: false,
    extraRandomDelaySeconds: 5,
    soundOnSendEnabled: false,
    notificationOnSendEnabled: false,
    runTimestamps: [],
    lastRunTimestamp: 0,
    captchaDetected: false
  }, function (opts) {
    var useStartAll = opts.startAll !== false;
    var farmIds = [];
    if (!useStartAll) {
      if (opts.enabledFarmIdsOrder && opts.enabledFarmIdsOrder.length) {
        farmIds = opts.enabledFarmIdsOrder.filter(function (id) { return opts.enabledFarmIds && opts.enabledFarmIds[id]; });
      } else if (opts.enabledFarmIds) {
        farmIds = Object.keys(opts.enabledFarmIds).filter(function (id) { return opts.enabledFarmIds[id]; });
      }
    }
    if (!useStartAll && farmIds.length === 0) {
      scheduleNext();
      return;
    }

    var now = Date.now();
    var tacticsById = {};
    (opts.tactics || []).forEach(function (t) { tacticsById[t.id] = t; });
    var globalInterval = getBaseAndRandomization(opts);

    function runPayload(useStartAllFlag, dueFarmIds, listTimings) {
      return {
        action: 'run',
        useStartAll: useStartAllFlag,
        farmIds: dueFarmIds || [],
        listTimings: listTimings || [],
        randomizationPreset: opts.randomizationPreset || 'medium',
        randomizationSeconds: 0,
        baseMinutes: globalInterval.baseMinutes,
        randomizationSeconds: globalInterval.randomizationSeconds,
        simulateMouse: opts.simulateMouse === true,
        fromAuto: true,
        onlyWhenTabVisible: opts.onlyWhenTabVisible === true
      };
    }

    function trySendRun(tabId) {
      if (opts.onlyWhenTabVisible === true) {
        chrome.tabs.get(tabId, function (tab) {
          if (chrome.runtime.lastError || !tab || !tab.active) {
            scheduleNext();
            return;
          }
          doChecksAndSend(tabId);
        });
      } else {
        doChecksAndSend(tabId);
      }
    }

    function doChecksAndSend(tabId) {
      if (opts.pauseOnCaptchaEnabled === true && opts.captchaDetected === true) {
        scheduleNext();
        return;
      }
      if (opts.timeWindowEnabled === true && !isInTimeWindow(now, opts.timeWindowStart, opts.timeWindowEnd)) {
        scheduleNext();
        return;
      }
      var runTs = (opts.runTimestamps || []).filter(function (t) { return now - t < 3600000; });
      if (opts.maxRunsPerHourEnabled === true && runTs.length >= Math.max(1, parseInt(opts.maxRunsPerHour, 10) || 60)) {
        scheduleNext();
        return;
      }
      var minDelayMs = (Math.max(0, parseInt(opts.minDelayMinutes, 10) || 0)) * 60 * 1000;
      if (opts.minDelayMinutesEnabled === true && minDelayMs > 0 && (now - (opts.lastRunTimestamp || 0)) < minDelayMs) {
        scheduleNext();
        return;
      }

      if (useStartAll) {
        chrome.tabs.sendMessage(tabId, runPayload(true, [], []), function () {
          if (chrome.runtime.lastError) {}
          recordRunAndNotify(opts, tabId, scheduleNext);
        });
        return;
      }

      chrome.tabs.sendMessage(tabId, runPayload(false, dueFarmIds, listTimings), function () {
        if (chrome.runtime.lastError) {}
        recordRunAndNotify(opts, tabId, scheduleNext);
      });
    }

    if (useStartAll) {
      getTargetTab(function (tabId) {
        if (!tabId) { scheduleNext(); return; }
        trySendRun(tabId);
      });
      return;
    }

    var dueFarmIds = [];
    var listTimings = [];
    var newGlobalNextRun = opts.globalNextRun || (now + computeNextDelayMsWithSafety(opts, globalInterval));
    var newNextRunPerList = opts.nextRunPerList || {};

    farmIds.forEach(function (id) {
      var tacticId = (opts.farmListTactic || {})[id];
      var tactic = tacticId ? tacticsById[tacticId] : null;
      if (tactic) {
        var interval = getIntervalForTactic(tactic);
        var nextRun = newNextRunPerList[id];
        if (!nextRun || nextRun <= now) {
          dueFarmIds.push(id);
          listTimings.push({ farmId: id, baseMinutes: interval.baseMinutes, randomizationSeconds: interval.randomizationSeconds });
          newNextRunPerList[id] = now + computeNextDelayMsWithSafety(opts, interval);
        }
      } else {
        if (newGlobalNextRun <= now) {
          dueFarmIds.push(id);
          listTimings.push({ farmId: id, baseMinutes: globalInterval.baseMinutes, randomizationSeconds: globalInterval.randomizationSeconds });
        }
      }
    });
    var ranGlobal = dueFarmIds.some(function (id) { return !(opts.farmListTactic || {})[id]; });
    if (ranGlobal) {
      newGlobalNextRun = now + computeNextDelayMsWithSafety(opts, globalInterval);
    }

    chrome.storage.local.set({ globalNextRun: newGlobalNextRun, nextRunPerList: newNextRunPerList });

    if (dueFarmIds.length === 0) {
      scheduleNext();
      return;
    }

    getTargetTab(function (tabId) {
      if (!tabId) { scheduleNext(); return; }
      trySendRun(tabId);
    });
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.action === 'reschedule') {
    scheduleNext();
    sendResponse();
    return false;
  }
  if (message && message.action === 'setLinkedTab') {
    if (sender.tab && sender.tab.id) {
      chrome.storage.local.set({ linkedTabId: sender.tab.id });
    }
    sendResponse();
    return false;
  }
  if (message && message.action === 'getTargetTab') {
    getTargetTab(function (tabId) { sendResponse(tabId); });
    return true;
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== 'local') return;
  var reschedule = changes.auto || changes.randomizationPreset || changes.customBaseMinutes || changes.customRandomizationSeconds ||
    changes.startAll || changes.enabledFarmIds || changes.enabledFarmIdsOrder || changes.farmListTactic || changes.tactics ||
    changes.onlyWhenTabVisible || changes.maxRunsPerHourEnabled || changes.maxRunsPerHour || changes.minDelayMinutesEnabled || changes.minDelayMinutes ||
    changes.timeWindowEnabled || changes.timeWindowStart || changes.timeWindowEnd || changes.extraRandomDelayEnabled || changes.extraRandomDelaySeconds ||
    changes.captchaDetected;
  if (reschedule) scheduleNext();
});

chrome.runtime.onInstalled.addListener(function () {
  scheduleNext();
});

scheduleNext();
