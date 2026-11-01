#!/usr/bin/env bash
# Builds the optional "Detailed · full size" model files for hosting (see README, "Optional: the full-size model").
# Downloads ISNet (general use, Apache-2.0) from the rembg project, checks it, and splits it into 15 parts of 12 MiB.
set -euo pipefail
OUT="${1:-hosted-model}"
URL="https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx"
SHA="60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a"
mkdir -p "$OUT"
curl -fL --retry 3 -o "$OUT/isnet.onnx" "$URL"
echo "$SHA  $OUT/isnet.onnx" | sha256sum -c -
split -b 12582912 -d -a 2 --additional-suffix=.wasm "$OUT/isnet.onnx" "$OUT/isnet-f-"
rm "$OUT/isnet.onnx"
ls -l "$OUT"
echo "Upload everything in $OUT/ to the folder you set as modelBaseUrl in www/config.js."
