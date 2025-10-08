// api.js
const express = require("express");
const { spawn } = require("child_process");
const app = express();

app.use(express.json());

// 啟動 Minecraft Server 並用 screen 包裹
const screenName = "minecraft";

// 這個 function 發送指令到 screen 裡的 minecraft server console
function sendCommand(cmd) {
  const sanitized = cmd.replace(/"/g, '\\"');  // 避免破壞命令格式
  const exec = `screen -S ${screenName} -p 0 -X stuff "${sanitized}\n"`;
  require("child_process").exec(exec, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error sending command: ${error.message}`);
    }
  });
}

// 讀取 minecraft console log，這邊簡單用 tail -f 讀screen log，或者你可以用 screen -X hardcopy
// 這裡示範用簡單的輪詢（你可以自己改用 SSE/WebSocket）

let lastLogs = [];

app.get("/logs", (req, res) => {
  // TODO: 改成從 screen log 或 minecraft log 檔案讀取最新內容
  // 暫時示範回傳固定訊息
  res.json({ logs: lastLogs });
});

// 健康檢查路由（API 起來回傳 200 OK）
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 立即發送指令
app.post("/command", (req, res) => {
  const { cmd, token } = req.body;
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }
  if (!cmd) return res.status(400).json({ error: "No cmd provided" });

  sendCommand(cmd);
  res.json({ status: "command sent", cmd });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Minecraft API listening on port ${port}`);
});
