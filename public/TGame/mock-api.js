/*
 * Offline mock for the 动物运动会 (Animal Olympics) Cocos game.
 *
 * The packaged game drives its UI from a backend at /api/AnimalOlympic/* plus a
 * realtime WebSocket. When embedded standalone (dev / GitHub Pages) those aren't
 * reachable, so it never shows the betting/countdown + 近100期 leaderboard screen.
 *
 * This script (loaded first in rank.html) intercepts the game's XHR calls and
 * returns believable data so the normal betting → race → next-round cycle runs
 * offline. It also neutralises the game's WebSocket so it doesn't spam reconnect
 * attempts to an unreachable host.
 *
 * Response envelope the game expects: { err_code: 0, data: {...} }.
 *  - getinfo → { issueId, countdown (betting secs), countdown1 (race secs),
 *               leaderboard: ["A_21", ...] }  (letter A-F = animal sprite 0-5)
 *  - GetSettle → { lotteryCode: "CAEBFD" (A-F → 1-6 finishing order), issueId }
 *  - Rank → {} (ranking popup; not needed for the main screen)
 */
(function () {
  var BETTING_SECS = 40; // how long the open/countdown+stats screen shows
  var RACE_SECS = 8;     // race animation duration

  function pad(n, len) {
    n = '' + n;
    while (n.length < len) n = '0' + n;
    return n;
  }
  function datePrefix() {
    var d = new Date();
    return '' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2);
  }

  // Rolling issue sequence; advances by one each settled round.
  var seq = 581;
  function currentIssue() {
    return datePrefix() + pad(seq, 4);
  }

  // A random finishing order as a 6-letter A-F permutation (e.g. "CAEBFD").
  function randomLotteryCode() {
    var letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (var i = letters.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = letters[i]; letters[i] = letters[j]; letters[j] = t;
    }
    return letters.join('');
  }

  // 近100期冠军数据统计: 6 animals with win counts (summing ~100), sorted desc.
  function leaderboard() {
    var counts = [21, 18, 18, 16, 14, 13];
    var letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    // Rotate which animal leads so it isn't visually identical every round.
    var offset = seq % 6;
    var out = [];
    for (var i = 0; i < 6; i++) {
      out.push(letters[(i + offset) % 6] + '_' + counts[i]);
    }
    return out;
  }

  function buildResponse(url) {
    var data;
    if (url.indexOf('/getinfo') !== -1) {
      data = {
        issueId: currentIssue(),
        countdown: BETTING_SECS,
        countdown1: RACE_SECS,
        leaderboard: leaderboard(),
      };
    } else if (url.indexOf('/GetSettle') !== -1) {
      data = { lotteryCode: randomLotteryCode(), issueId: currentIssue() };
      seq += 1; // this issue is settled; advance to the next betting round
    } else if (url.indexOf('/Rank') !== -1) {
      data = { list: [], myrank: null };
    } else {
      // e.g. the external getlatestdata history endpoint — return no records.
      data = { record: [] };
    }
    return JSON.stringify({ err_code: 0, err_msg: '', data: data });
  }

  function isMockUrl(url) {
    return typeof url === 'string' &&
      (url.indexOf('/api/AnimalOlympic/') !== -1 || url.indexOf('getlatestdata') !== -1);
  }

  // ---- XHR interception (the game uses XMLHttpRequest via its Http wrapper) ----
  var OrigOpen = window.XMLHttpRequest.prototype.open;
  var OrigSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function (method, url) {
    this.__mockUrl = url;
    this.__isMock = isMockUrl(url);
    return OrigOpen.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.send = function () {
    if (!this.__isMock) return OrigSend.apply(this, arguments);
    var self = this;
    var payload = buildResponse(this.__mockUrl);
    setTimeout(function () {
      try {
        Object.defineProperty(self, 'readyState', { configurable: true, get: function () { return 4; } });
        Object.defineProperty(self, 'status', { configurable: true, get: function () { return 200; } });
        Object.defineProperty(self, 'responseText', { configurable: true, get: function () { return payload; } });
        Object.defineProperty(self, 'response', { configurable: true, get: function () { return payload; } });
      } catch (e) { /* ignore */ }
      if (typeof self.onreadystatechange === 'function') { try { self.onreadystatechange(); } catch (e) {} }
      if (typeof self.onprogress === 'function') { try { self.onprogress(); } catch (e) {} }
      if (typeof self.onloadend === 'function') { try { self.onloadend(); } catch (e) {} }
    }, 40);
  };

  // ---- Neutralise the game WebSocket (unreachable host → reconnect spam) ----
  var RealWebSocket = window.WebSocket;
  function StubSocket() {
    this.readyState = 0;
  }
  StubSocket.prototype.send = function () {};
  StubSocket.prototype.close = function () {};
  StubSocket.prototype.addEventListener = function () {};
  StubSocket.prototype.removeEventListener = function () {};
  window.WebSocket = function (url, protocols) {
    // Only stub the game's realtime host; leave any other ws untouched.
    if (typeof url === 'string' && /101\.200\.124\.192|:8888|ws:\/\//.test(url)) {
      return new StubSocket();
    }
    return new RealWebSocket(url, protocols);
  };
  try { window.WebSocket.prototype = RealWebSocket.prototype; } catch (e) {}

  console.log('[animal mock] API + WebSocket stubs installed');
})();
