(function () {
  'use strict';

  const origFetch = window.fetch;
  if (!origFetch) return;

  window.fetch = function () {
    const args = Array.prototype.slice.call(arguments);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    const p = origFetch.apply(this, args);
    if (url.indexOf('tile-details') >= 0) {
      p.then(function (r) {
        r.clone().json().then(function (data) {
          try {
            document.dispatchEvent(new CustomEvent('travianTileDetails', { detail: data }));
          } catch (e) {}
        }).catch(function () {});
      }).catch(function () {});
    }
    return p;
  };
})();
