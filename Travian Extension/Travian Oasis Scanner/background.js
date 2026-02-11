'use strict';

const TRAVIAN_PATTERNS = [
  '*://*.travian.com/*',
  '*://*.travian.dk/*',
  '*://*.travian.de/*',
  '*://*.international.travian.com/*'
];

chrome.sidePanel.setOptions({
  path: 'sidepanel.html',
  enabled: true
}).catch(() => {});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
