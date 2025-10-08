const express = require('express');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const app = express();
const PORT = 3000;

// ⛳ 修改這裡，指向你的 screenlog.0 實際路徑
const logFilePath = path.resolve('./screenlog.0');

let clients = [];

app.get('/logs/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write('\n');
  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

function sendToClients(data) {
  clients.forEach(res => res.write(`data: ${data}\n\n`));
}

function watchScreenLog() {
  let size = 0;

  fs.stat(logFilePath, (err, stats) => {
    if (err) {
      console.error('❌ 找不到 screenlog.0 檔案:', err.message);
      return;
    }

    size = stats.size;

    fs.watch(logFilePath, (eventType) => {
      if (eventType !== 'change') return;

      fs.stat(logFilePath, (err, stats) => {
        if (err || stats.size <= size) return;

        const stream = fs.createReadStream(logFilePath, { start: size, end: stats.size });
        const rl = readline.createInterface({ input: stream });

        rl.on('line', (line) => sendToClients(line));
        rl.on('close', () => (size = stats.size));
      });
    });
  });
}

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`✅ 伺服器啟動於 http://localhost:${PORT}`);
  watchScreenLog();
});
