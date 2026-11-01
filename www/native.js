/* Seedling: native glue for the Android and iOS apps (Capacitor).
   Loaded after the main script. In a normal browser it does nothing. */
(function () {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const P = C.Plugins, platform = C.getPlatform();
  document.documentElement.classList.add('native', 'native-' + platform);

  /* ---------- AI models ----------
     "Detailed" ships inside the app, so it works offline and needs no download.
     "Detailed · full size" (179 MB) is too big to ship; it is offered only when a download host is set in config.js. */
  const CFG = window.SEEDLING_CONFIG || {};
  MODELS.detailed.builtIn = true;
  MODELS.detailed.src = 'models/isnet-detailed.onnx';
  delete MODELS.detailed.chunks;
  MODELS.detailed.about = 'Included in the app. ' + MODELS.detailed.about;
  const base = (CFG.modelBaseUrl || '').trim();
  if (base) {
    const b = base.endsWith('/') ? base : base + '/';
    MODELS.detailedFull.chunks = MODELS.detailedFull.chunks.map(u => b + u.split('/').pop());
  } else {
    delete MODELS.detailedFull;
    if (SET.model === 'detailedFull') { SET.model = 'detailed'; saveSet(); }
  }

  /* ---------- saving to the photo library ----------
     SeedlingGallery is a small plugin inside the app (android/app/src/main/java/.../GalleryPlugin.java and ios/App/App/GalleryPlugin.swift).
     Android 10+: written straight to Pictures/Seedling with no permission. iOS: asks for "add photos only" access. */
  const blobToBase64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  async function shareInstead(data, filename, type) {
    const { Filesystem, Share } = P;
    if (!Filesystem || !Share) throw new Error('no share');
    const w = await Filesystem.writeFile({ path: filename, data, directory: 'CACHE' });
    await Share.share({ title: filename, files: [w.uri], dialogTitle: 'Save or share image' });
  }
  window.saveCanvas = async function (c, filename, type = 'image/png') {
    const blob = await new Promise(r => c.toBlob(r, type, .92));
    if (!blob) { toast('That image is too large to save. Try a smaller size in Settings.'); return; }
    const data = await blobToBase64(blob);
    try {
      await P.SeedlingGallery.saveImage({ data, mimeType: type, fileName: filename });
      toast(platform === 'android' ? 'Saved to Pictures › Seedling' : 'Saved to Photos');
      buzz(14);
    } catch (e) {
      if (e && e.code === 'denied') {
        toast('Seedling isn’t allowed to add photos. You can allow it in your phone’s Settings, or share the image instead.');
        try { await shareInstead(data, filename, type); } catch (e2) {}
        return;
      }
      try { await shareInstead(data, filename, type); }
      catch (e2) { if (!/cancel/i.test(String(e2 && e2.message))) toast('The image could not be saved. Please try again.'); }
    }
  };

  /* ---------- haptics ----------
     Same patterns as the web version (vibrate, pause, vibrate...), played as native taps so they feel crisp. */
  const H = P.Haptics;
  if (H) window.buzz = function (pattern) {
    if (!SET.haptics) return;
    const pat = Array.isArray(pattern) ? pattern : [pattern];
    const style = ms => ms <= 9 ? 'LIGHT' : ms <= 20 ? 'MEDIUM' : 'HEAVY';
    let t = 0;
    pat.forEach((ms, i) => {
      if (i % 2 === 0) { const s = style(ms); setTimeout(() => H.impact({ style: s }).catch(() => {}), t); }
      t += ms;
    });
  };

  /* ---------- status and navigation bars follow the app theme ---------- */
  const isDark = () => { const a = document.documentElement.getAttribute('data-theme'); return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  function syncBars() {
    const style = isDark() ? 'DARK' : 'LIGHT';   // DARK = light icons for a dark background
    if (P.SystemBars && P.SystemBars.setStyle) P.SystemBars.setStyle({ style }).catch(() => {});
    else if (P.StatusBar) P.StatusBar.setStyle({ style }).catch(() => {});
  }
  const origApply = window.applySettings;
  if (origApply) window.applySettings = function () { origApply.apply(this, arguments); syncBars(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncBars);
  syncBars();

  /* ---------- Android back button: step back one level, like any Android app ---------- */
  const visible = sel => { const e = document.querySelector(sel); return e && !e.hidden; };
  function goBack() {
    const legal = document.getElementById('legalPage');
    if (legal) { legal.remove(); return; }
    if (visible('#overlay')) {
      const pk = document.getElementById('pkCancel');
      if (pk) pk.click(); else if (!busy) closeOverlay();
      return;
    }
    if (visible('#settings')) { closeSettings(); return; }
    if (visible('#ts')) { const x = document.getElementById('tsCancel'); if (x) x.click(); return; }
    if (railPopKey) { closeRailPop(); return; }
    if (railOpen) { toggleRail(false); return; }
    if (typeof mode !== 'undefined' && mode !== 'main') { mode = 'main'; refresh(); return; }
    if (!visible('#home')) { showHome(); return; }
    P.App.minimizeApp ? P.App.minimizeApp() : P.App.exitApp();
  }
  if (P.App) P.App.addListener('backButton', () => { try { goBack(); } catch (e) { softError(e); } });

  /* Hide the native launch screen once the web sprout animation is on screen */
  if (P.SplashScreen) requestAnimationFrame(() => P.SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => {}));
})();
