/* Seedling app settings. Edit, then run `npx cap sync`. */
window.SEEDLING_CONFIG = {
  /* Optional. Where the 179 MB "Detailed · full size" model is hosted, e.g. 'https://downloads.example.com/seedling/1/'.
     Upload models/hosted/isnet-f-00.wasm ... isnet-f-14.wasm there. The host must allow CORS from
     https://localhost (Android) and capacitor://localhost (iOS), and you must add the host to connect-src
     in the Content-Security-Policy at the top of index.html.
     Leave empty to hide that option: the app then needs no internet connection at all. */
  modelBaseUrl: ''
};
