# Jalankan uji UI: bash run.sh   (DIST=1 bash run.sh untuk menguji file gabungan)
cd "$(dirname "$0")"
pkill -f "node server.js" 2>/dev/null; sleep 0.3
(TZ=Asia/Jakarta node server.js > server.log 2>&1 &); sleep 1
node ui.js 2>&1 | tail -5
pkill -f "node server.js"
