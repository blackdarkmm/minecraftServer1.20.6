const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

// === 設定 ===
const screenName = "minecraft";
const screenLogPath = path.join(__dirname, "../screenlog.0"); // ← 根據實際位置調整

// === 發送指令到 screen ===
function sendCommand(cmd) {
  const sanitized = cmd.replace(/"/g, '\\"');  // 避免破壞命令格式
  const command = `screen -S ${screenName} -p 0 -X stuff "${sanitized}\n"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error sending command: ${error.message}`);
    }
  });
}

// === 讀取 log ===
app.get("/logs", (req, res) => {
  fs.readFile(screenLogPath, "utf8", (err, data) => {
    if (err) {
      console.error("讀取 screenlog.0 失敗：", err.message);
      return res.status(500).json({ error: "無法讀取 log 檔案" });
    }
    const lines = data.split("\n");
    const tail = lines.slice(-50); // 最後 50 行
    res.json({ logs: tail });
  });
});

// === 健康檢查 ===
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// === 發送指令 API ===
app.post("/command", (req, res) => {
  const { cmd, token } = req.body;
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }
  if (!cmd) return res.status(400).json({ error: "No cmd provided" });

  sendCommand(cmd);
  res.json({ status: "command sent", cmd });
});

// === 啟動 API 伺服器 ===
const port = 3000;
app.listen(port, () => {
  console.log(`Minecraft API listening on port ${port}`);
});
