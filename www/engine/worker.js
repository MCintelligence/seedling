/* Seedling AI engine worker: runs the subject model off the page's main thread so the app never freezes, and can be stopped instantly */
self.window = self;
importScripts('engine.js');
const ort = self.SeedlingORT;
let session = null;
self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false; ort.env.wasm.wasmPaths = m.wasmPaths;
      let buf;
      if (m.blob) buf = await m.blob.arrayBuffer();
      else { const r = await fetch(m.url); if (!r.ok) throw new Error('The cutout model could not load. Check your connection and try again.'); buf = await r.arrayBuffer(); }
      session = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      buf = null; self.postMessage({ id: m.id, ok: true });
    } else if (m.type === 'run') {
      const res = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', m.x, m.dims) });
      const out = res[session.outputNames[0]].data; self.postMessage({ id: m.id, ok: true, out }, [out.buffer]);
    }
  } catch (err) { self.postMessage({ id: m.id, ok: false, error: String((err && err.message) || err) }); }
};
