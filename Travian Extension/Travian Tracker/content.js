'use strict';

(function () {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getCurrentVillageCoords') {
      try {
        var link = document.querySelector('a[href*="position_details"], a[href*="karte.php"], a[href*="x="].buildingView');
        if (link && link.href) {
          var m = link.href.match(/[?&]x=(-?\d+)[^0-9]*y=(-?\d+)/);
          if (m) {
            sendResponse({ x: parseInt(m[1], 10), y: parseInt(m[2], 10) });
            return true;
          }
        }
        var coords = document.body.innerText.match(/\((-?\d+)\s*[\|,]\s*(-?\d+)\)/);
        if (coords) {
          sendResponse({ x: parseInt(coords[1], 10), y: parseInt(coords[2], 10) });
          return true;
        }
        sendResponse({ error: 'No coords found' });
      } catch (e) {
        sendResponse({ error: String(e && e.message) });
      }
      return true;
    }
    if (request.action === 'getFarmListCoords') {
      try {
        var coords = [];
        var villages = document.querySelectorAll('.villageWrapper');
        for (var v = 0; v < villages.length; v++) {
          var drops = villages[v].querySelectorAll('.dropContainer');
          for (var d = 0; d < drops.length; d++) {
            var wrappers = drops[d].querySelectorAll('.farmListWrapper');
            for (var w = 0; w < wrappers.length; w++) {
              var listBody = wrappers[w].querySelector('.farmListSlotList, .slotList, [class*="slotList"]');
              if (!listBody) continue;
              var rows = listBody.querySelectorAll('tr, .slotRow, [class*="slot"]');
              for (var r = 0; r < rows.length; r++) {
                var link = rows[r].querySelector('a[href*="x="], a[href*="position_details"]');
                if (link && link.href) {
                  var match = link.href.match(/[?&]x=(-?\d+)[^0-9]*y=(-?\d+)/);
                  if (match) coords.push(match[1] + '|' + match[2]);
                }
                var text = (rows[r].textContent || '').match(/\((-?\d+)\s*[\|,]\s*(-?\d+)\)/);
                if (text && !link) coords.push(text[1] + '|' + text[2]);
              }
            }
          }
        }
        var seen = {};
        var unique = [];
        for (var i = 0; i < coords.length; i++) {
          var key = coords[i];
          if (!seen[key]) { seen[key] = true; unique.push(key); }
        }
        sendResponse({ coords: unique, rawCount: coords.length });
      } catch (e) {
        sendResponse({ coords: [], rawCount: 0, error: String(e && e.message) });
      }
      return true;
    }
    if (request.action === 'expandAllFarmLists') {
      try {
        var headers = document.querySelectorAll('.farmListHeader');
        for (var i = 0; i < headers.length; i++) {
          var toggle = headers[i].querySelector('.expandButton, [class*="expand"], .collapseButton, [class*="collapse"]');
          if (toggle && /collapse|open|expanded/i.test((toggle.getAttribute('class') || ''))) continue;
          if (toggle) toggle.click();
        }
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message) });
      }
      return true;
    }
  });
})();
