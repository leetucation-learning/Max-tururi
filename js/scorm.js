/* SCORM 2004 (3rd Ed.) — adaptor mic. În afara unui LMS, cursul merge în modul „liber” (localStorage). */
(function () {
  'use strict';
  var api = null, live = false, terminated = false;

  function find(win) {
    var tries = 0;
    while (win && tries < 12) {
      try { if (win.API_1484_11) return win.API_1484_11; } catch (e) { return null; }
      if (win.parent && win.parent !== win) { win = win.parent; tries++; } else break;
    }
    return null;
  }

  var S = {
    init: function () {
      try {
        api = find(window);
        if (!api && window.opener) api = find(window.opener);
        if (!api && window.top && window.top.opener) api = find(window.top.opener);
      } catch (e) { api = null; }
      if (api) {
        try { live = String(api.Initialize('')) === 'true'; } catch (e) { live = false; }
      }
      return live;
    },
    live: function () { return live && !terminated; },
    get: function (k) {
      if (!S.live()) return '';
      try { var v = api.GetValue(k); return v == null ? '' : String(v); } catch (e) { return ''; }
    },
    set: function (k, v) {
      if (!S.live()) return false;
      try { return String(api.SetValue(k, String(v))) === 'true'; } catch (e) { return false; }
    },
    commit: function () {
      if (!S.live()) return false;
      try { return String(api.Commit('')) === 'true'; } catch (e) { return false; }
    },
    err: function () {
      if (!api) return '';
      try { var c = api.GetLastError(); return c + ' ' + api.GetErrorString(c); } catch (e) { return ''; }
    },
    finish: function (exitValue, navExit) {
      if (!S.live()) return;
      S.set('cmi.exit', exitValue || 'suspend');
      if (navExit) S.set('adl.nav.request', 'exitAll');
      S.commit();
      try { api.Terminate(''); } catch (e) { /* nimic */ }
      terminated = true;
    },
    terminated: function () { return terminated; }
  };
  window.SCORM = S;
})();
