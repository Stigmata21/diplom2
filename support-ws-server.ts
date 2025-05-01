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
      console.log('[WS][INCOMING]', { userId, isModerator, data });
      if (data.type === 'message') {
        const text = data.text?.trim();
        if (!text) return;
        await updateActiveModerator();
        if (isModerator && data.to) {
          // moderator -> user
          await dbQuery('INSERT INTO support_chat (user_id, moderator_id, message, from_moderator) VALUES ($1, $2, $3, TRUE)', [data.to, userId, text]);
          const target = clients.get(data.to);
          const payload = { from: 'moderator', text, moderatorId: userId, userId: data.to, created_at: new Date().toISOString() };
          console.log('[WS][SEND][mod->user]', payload);
          if (target) target.send(JSON.stringify(payload));
        } else {
          // user -> moderator
          await dbQuery('INSERT INTO support_chat (user_id, message, from_moderator) VALUES ($1, $2, FALSE)', [userId, text]);
          if (activeSupportModeratorId) {
            const modWs = clients.get(activeSupportModeratorId + '_mod');
            const payload = { from: 'user', text, userId, moderatorId: activeSupportModeratorId, created_at: new Date().toISOString() };
            console.log('[WS][SEND][user->mod]', payload);
            if (modWs) modWs.send(JSON.stringify(payload));
          }
        }
      }
    } catch (err) {
      console.error('[WS][ERROR]', err);
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

server.listen(PORT, () => {
  console.log('Support WebSocket server running on port', PORT);
});

// Автоудаление старых сообщений (раз в час)
setInterval(async () => {
  await dbQuery(`DELETE FROM support_chat WHERE created_at < NOW() - INTERVAL '3 days'`);
}, 1000 * 60 * 60); 