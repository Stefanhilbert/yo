(function () {
  'use strict';

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function getRandomizationRanges(preset, customSeconds) {
    var sec = Math.max(0, Math.min(60, Number(customSeconds) || 0)) * 1000;
    var low = { before: [300, 800], after: [2000, 5000], between: [3000, 15000] };
    var medium = { before: [500, 1500], after: [3000, 12000], between: [5000, 30000] };
    var high = { before: [1000, 3000], after: [5000, 20000], between: [10000, 60000] };
    var base = medium;
    if (preset === 'low') base = low;
    else if (preset === 'high') base = high;
    else if (preset === 'custom' && sec > 0) {
      base = { before: [500, 500 + sec], after: [3000, 3000 + sec], between: [5000, 5000 + sec] };
    }
    return base;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function isFarmListPage() {
    return (
      document.querySelector('.farmListHeader') ||
      document.querySelector('.villageWrapper')
    );
  }

  function findStartAllButton() {
    var ids = ['startAllFarmLists', 'start-all-farmlists', 'startAll'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) return el;
    }
    var cssSelectors = [
      'button.textButtonV2.startAllFarmLists',
      'button.startAllFarmLists',
      'button[class*="startAllFarmLists"]',
      'button.startAll'
    ];
    for (var j = 0; j < cssSelectors.length; j++) {
      var btn = document.querySelector(cssSelectors[j]);
      if (btn) return btn;
    }
    var xpaths = [
      "//button[contains(@class, 'startAllFarmLists')]",
      "//button[contains(@class, 'startAll')]",
      "//button[contains(., 'Start all')]",
      "//button[contains(., 'Start alle')]",
      "//*[contains(text(), 'Start all farm lists')]",
      "//*[contains(text(), 'Start alle farm lister')]",
      "//*[contains(text(), 'Start alle farm')]"
    ];
    for (var k = 0; k < xpaths.length; k++) {
      try {
        var result = document.evaluate(
          xpaths[k],
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        if (result.singleNodeValue) return result.singleNodeValue;
      } catch (e) {}
    }
    return null;
  }

  function dispatchMouseOver(el) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    ['mouseenter', 'mousemove'].forEach(function (type) {
      var evt = new MouseEvent(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      el.dispatchEvent(evt);
    });
  }

  function safeClick(el, simulateMouse) {
    if (!el) return Promise.resolve();
    el.scrollIntoView({ block: 'center' });
    if (simulateMouse) {
      dispatchMouseOver(el);
      var waitMs = randomBetween(100, 250);
      return delay(waitMs).then(function () { el.click(); });
    }
    el.click();
    return Promise.resolve();
  }

  function runStartAll(ranges, simulateMouse, fromAuto) {
    ranges = ranges || getRandomizationRanges('medium');
    var firstDelayMs = (fromAuto ? randomBetween(200, 600) : randomBetween(ranges.before[0], ranges.before[1]));
    return new Promise(function (resolve) {
      if (!isFarmListPage()) {
        resolve({ ok: false, error: 'Åbn farm list-siden først.' });
        return;
      }
      var btn = findStartAllButton();
      if (!btn) {
        resolve({ ok: false, error: 'Kunne ikke finde "Start alle lister"-knappen.' });
        return;
      }
      delay(firstDelayMs)
        .then(function () { return safeClick(btn, simulateMouse); })
        .then(function () { return delay(randomBetween(ranges.after[0], ranges.after[1])); })
        .then(function () { resolve({ ok: true }); })
        .catch(function (err) {
          resolve({ ok: false, error: String(err && err.message) || 'Fejl' });
        });
    });
  }

  function fetchFarmLists() {
    var lists = [];
    try {
      var villages = document.querySelectorAll('.villageWrapper');
      for (var v = 0; v < villages.length; v++) {
        var villageName = 'Unknown village';
        var header = villages[v].querySelector('.villageHeader .villageName');
        if (header) villageName = (header.textContent || '').trim();
        var drops = villages[v].querySelectorAll('.dropContainer');
        for (var d = 0; d < drops.length; d++) {
          var wrappers = drops[d].querySelectorAll('.farmListWrapper');
          for (var w = 0; w < wrappers.length; w++) {
            var farmHeader = wrappers[w].querySelector('.farmListHeader');
            if (!farmHeader) continue;
            var drag = farmHeader.querySelector('.dragAndDrop');
            var nameEl = farmHeader.querySelector('.farmListName .name');
            if (drag && nameEl) {
              var id = (drag.getAttribute('data-list') || '').trim();
              var name = (nameEl.textContent || '').trim();
              if (id) lists.push({ id: id, name: name, village: villageName });
            }
          }
        }
      }
    } catch (e) {}
    return lists;
  }

  function findStartButtonForList(farmId) {
    var drag = document.querySelector(".farmListHeader .dragAndDrop[data-list='" + farmId + "']");
    if (!drag) return null;
    var header = drag.closest('.farmListHeader');
    if (!header) return null;
    var btn = header.querySelector('button.startFarmList');
    if (btn) return btn;
    var buttons = header.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || buttons[i].innerText || '').trim();
      if (t.indexOf('Start') === 0) return buttons[i];
    }
    btn = header.querySelector('button[class*="start"]');
    if (btn) return btn;
    btn = header.querySelector('button.textButtonV2');
    if (btn) return btn;
    try {
      var result = document.evaluate(
        ".//button[contains(., 'Start')]",
        header,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      if (result.singleNodeValue) return result.singleNodeValue;
    } catch (e) {}
    return null;
  }

  function getTimingForList(listTimings, farmId, defaultBase, defaultRand) {
    if (listTimings && listTimings.length) {
      for (var i = 0; i < listTimings.length; i++) {
        if (listTimings[i].farmId === farmId) {
          return {
            baseMinutes: Math.max(1, Math.min(120, Number(listTimings[i].baseMinutes) || 5)),
            randomizationSeconds: Math.max(0, Math.min(300, Number(listTimings[i].randomizationSeconds) || 0))
          };
        }
      }
    }
    return { baseMinutes: defaultBase, randomizationSeconds: defaultRand };
  }

  function runSelectedLists(farmIds, ranges, baseMinutes, randomizationSeconds, simulateMouse, fromAuto, listTimings) {
    ranges = ranges || getRandomizationRanges('medium');
    var defaultBase = Math.max(1, Math.min(120, Number(baseMinutes) || 5));
    var defaultRand = Math.max(0, Math.min(300, Number(randomizationSeconds) || 0));
    return new Promise(function (resolve) {
      if (!isFarmListPage()) {
        resolve({ ok: false, error: 'Åbn farm list-siden først.' });
        return;
      }
      var ids = farmIds.slice();
      function next(index) {
        if (index >= ids.length) {
          resolve({ ok: true });
          return;
        }
        var farmId = ids[index];
        var btn = findStartButtonForList(farmId);
        if (!btn) {
          next(index + 1);
          return;
        }
        var timing = getTimingForList(listTimings, farmId, defaultBase, defaultRand);
        var baseMin = timing.baseMinutes;
        var randSec = timing.randomizationSeconds;
        var beforeMs;
        if (index === 0) {
          beforeMs = fromAuto ? randomBetween(200, 600) : randomBetween(ranges.before[0], ranges.before[1]);
        } else {
          var baseMs = baseMin * 60 * 1000;
          var randMs = randSec * 1000;
          var offset = randomBetween(-randMs, randMs);
          beforeMs = baseMs + offset;
          if (beforeMs < 60 * 1000) beforeMs = 60 * 1000;
        }
        delay(beforeMs).then(function () { return safeClick(btn, simulateMouse); })
          .then(function () { return delay(randomBetween(ranges.after[0], ranges.after[1])); })
          .then(function () { next(index + 1); })
          .catch(function () { next(index + 1); });
      }
      next(0);
    });
  }

  function playSendSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      try {
        var a = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUtvT1c=');
        if (a.play) a.play().catch(function () {});
      } catch (e2) {}
    }
  }

  function checkCaptcha() {
    var body = document.body;
    if (!body) return false;
    var text = (body.innerText || body.textContent || '').toLowerCase();
    if (text.indexOf('captcha') !== -1 || text.indexOf('human verification') !== -1 || text.indexOf('verify you are human') !== -1 || text.indexOf('verificer at du er menneske') !== -1) return true;
    var captchaEl = document.querySelector('[class*="captcha" i], [id*="captcha" i], [class*="verify" i], [id*="verify" i]');
    if (captchaEl && captchaEl.offsetParent !== null) return true;
    return false;
  }

  function startCaptchaObserver() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    function check() {
      if (checkCaptcha()) {
        chrome.storage.local.set({ captchaDetected: true });
      } else {
        chrome.storage.local.set({ captchaDetected: false });
      }
    }
    if (document.body) {
      check();
      var obs = new MutationObserver(function () { check(); });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { check(); startCaptchaObserver(); });
      }
    }
  }
  startCaptchaObserver();

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getFarmLists') {
      sendResponse({ lists: fetchFarmLists() });
      return false;
    }
    if (request.action === 'playSendSound') {
      playSendSound();
      sendResponse({});
      return false;
    }
    if (request.action !== 'run') {
      sendResponse({ ok: false, error: 'Ukendt handling' });
      return true;
    }
    if (request.onlyWhenTabVisible === true && document.hidden) {
      sendResponse({ ok: false, error: 'Tab not visible' });
      return true;
    }
    var useStartAll = request.useStartAll !== false;
    var farmIds = request.farmIds || [];
    var ranges = getRandomizationRanges(request.randomizationPreset || 'medium', request.randomizationSeconds);
    var baseMinutes = request.baseMinutes;
    var randomizationSeconds = request.randomizationSeconds;
    var simulateMouse = request.simulateMouse === true;
    var fromAuto = request.fromAuto === true;
    if (useStartAll) {
      runStartAll(ranges, simulateMouse, fromAuto).then(sendResponse);
    } else if (farmIds.length) {
      runSelectedLists(farmIds, ranges, baseMinutes, randomizationSeconds, simulateMouse, fromAuto, request.listTimings).then(sendResponse);
    } else {
      sendResponse({ ok: false, error: 'Vælg mindst én liste.' });
    }
    return true;
  });
})();
