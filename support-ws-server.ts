import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { query as dbQuery } from './src/lib/db';
import { createServer } from 'http';
import * as http from 'http';

const PORT = 4001;
const wss = new WebSocketServer({ noServer: true });

// userId <-> ws mapping
const clients = new Map<string, any>();
let activeSupportModeratorId: string | null = null;

async function updateActiveModerator() {
  const rows = await dbQuery("SELECT value FROM settings WHERE key = 'activeSupportModeratorId'");
  activeSupportModeratorId = (rows[0] as any)?.value || null;
}

// Инициализация при старте
updateActiveModerator();

wss.on('connection', (ws: any, req: http.IncomingMessage, userId: string, isModerator: boolean) => {
  ws.userId = userId;
  ws.isModerator = isModerator;
  clients.set(userId + (isModerator ? '_mod' : ''), ws);

  ws.on('message', async (msg: Buffer) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'message') {
        const text = data.text?.trim();
        if (!text) return;
        await updateActiveModerator();
        if (isModerator && data.to) {
          // moderator -> user
          await dbQuery('INSERT INTO support_chat (user_id, moderator_id, message, from_moderator) VALUES ($1, $2, $3, TRUE)', [data.to, userId, text]);
          const target = clients.get(data.to);
          const payload = { from: 'moderator', text, moderatorId: userId, userId: data.to, created_at: new Date().toISOString() };
          if (target) target.send(JSON.stringify(payload));
        } else {
          // user -> moderator
          await dbQuery('INSERT INTO support_chat (user_id, message, from_moderator) VALUES ($1, $2, FALSE)', [userId, text]);
          if (activeSupportModeratorId) {
            const modWs = clients.get(activeSupportModeratorId + '_mod');
            const payload = { from: 'user', text, userId, moderatorId: activeSupportModeratorId, created_at: new Date().toISOString() };
            if (modWs) modWs.send(JSON.stringify(payload));
          }
        }
      }
    } catch (err) {
      // No console.error here
    }
  });

  ws.on('close', () => {
    clients.delete(userId + (isModerator ? '_mod' : ''));
  });
});

const server = createServer();
server.on('upgrade', (req, socket, head) => {
  const { query } = parse(req.url || '', true);
  // query: ?userId=...&moderator=1
  const userId = query?.userId as string;
  const isModerator = query?.moderator === '1';
  if (!userId) return socket.destroy();
  wss.handleUpgrade(req, socket as any, head, ws => {
    wss.emit('connection', ws, req, userId, isModerator);
  });
});

// Функция для освобождения порта, если он занят
function tryToFreePort() {
  try {
    const { exec } = require('child_process');
    console.log(`Attempting to free port ${PORT}...`);
    // Освободить порт на macOS
    if (process.platform === 'darwin') {
      exec(`lsof -i tcp:${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
    } 
    // Освободить порт на Linux/Windows
    else {
      exec(`fuser -k ${PORT}/tcp`);
    }
    console.log(`Port ${PORT} should be free now`);
  } catch (err) {
    console.error(`Failed to free port: ${err}`);
  }
}

// Запускаем сервер с обработкой ошибки EADDRINUSE
server.listen(PORT, () => {
  console.log(`Support WebSocket server running on port ${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying to free it...`);
    tryToFreePort();
    // Пробуем запустить сервер снова через 1 секунду
    setTimeout(() => {
      server.close();
      server.listen(PORT, () => {
        console.log(`Support WebSocket server now running on port ${PORT}`);
      });
    }, 1000);
  } else {
    console.error(`Server error: ${err.message}`);
  }
});

// Автоудаление старых сообщений (раз в час)
setInterval(async () => {
  await dbQuery(`DELETE FROM support_chat WHERE created_at < NOW() - INTERVAL '3 days'`);
}, 1000 * 60 * 60); 