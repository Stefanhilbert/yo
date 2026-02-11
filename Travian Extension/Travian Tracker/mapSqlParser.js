'use strict';

/**
 * Parse Travian map.sql text.
 * x_world columns: fieldId, x, y, tribe, villageId, villageName, playerId, playerName, allianceId, allianceTag, population, ...
 * Returns array of { x, y, tribe, villageId, villageName, playerId, playerName, allianceId, allianceTag, population }
 */
function parseMapSql(text) {
  var rows = [];
  var re = /INSERT\s+INTO\s+`?x_world`?\s+VALUES\s*\(([^)]+)\)\s*;/gi;
  var m;
  while ((m = re.exec(text)) !== null) {
    var values = parseValues(m[1]);
    if (values.length < 11) continue;
    rows.push({
      x: parseInt(values[1], 10),
      y: parseInt(values[2], 10),
      tribe: parseInt(values[3], 10),
      villageId: parseInt(values[4], 10),
      villageName: String(values[5]).replace(/^'|'$/g, '').replace(/''/g, "'"),
      playerId: parseInt(values[6], 10),
      playerName: String(values[7]).replace(/^'|'$/g, '').replace(/''/g, "'"),
      allianceId: values[8] === 'NULL' || values[8] === '' ? null : parseInt(values[8], 10),
      allianceTag: values[9] === 'NULL' || values[9] === '' ? null : String(values[9]).replace(/^'|'$/g, '').replace(/''/g, "'"),
      population: parseInt(values[10], 10) || 0
    });
  }
  return rows;
}

function parseValues(s) {
  var out = [];
  var i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }
    if (s[i] === "'") {
      var end = i + 1;
      var escaped = false;
      while (end < s.length) {
        if (escaped) {
          escaped = false;
          end++;
          continue;
        }
        if (s[end] === '\\') {
          escaped = true;
          end++;
          continue;
        }
        if (s[end] === "'") {
          out.push(s.substring(i + 1, end).replace(/''/g, "'"));
          i = end + 1;
          break;
        }
        end++;
      }
      continue;
    }
    if (s[i] === 'N' && s.substring(i, i + 4) === 'NULL') {
      out.push('NULL');
      i += 4;
      continue;
    }
    var comma = s.indexOf(',', i);
    if (comma === -1) comma = s.length;
    var num = s.substring(i, comma).trim();
    out.push(num);
    i = comma + 1;
  }
  return out;
}

if (typeof self !== 'undefined') self.parseMapSql = parseMapSql;
if (typeof module !== 'undefined' && module.exports) module.exports = { parseMapSql: parseMapSql };
