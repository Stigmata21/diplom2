"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from '@/store/userStore';

interface Message {
  from: "user" | "moderator";
  text?: string;
  message?: string;
  userId?: string;
  moderatorId?: string;
  created_at: string;
  tempId?: number;
  status?: "pending" | "sent" | "error";
}

export default function SupportChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const [supportAvatarUrl, setSupportAvatarUrl] = useState('/avatar-support.png');
  const supportUnreadCount = useUserStore(s => s.supportUnreadCount);
  const setSupportUnreadCount = useUserStore(s => s.setSupportUnreadCount);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Получаем supportAvatarUrl из settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => setSupportAvatarUrl(data.settings?.supportAvatarUrl || '/avatar-support.png'));
  }, []);

  // Авто-скролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ws connect
  useEffect(() => {
    if (!session?.user?.id) return;
    const socket = new window.WebSocket(`ws://localhost:4001/?userId=${session.user.id}`);
    socket.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        const msgText = msg.text || msg.message;
        if (!msgText) return; // фильтруем пустые
        // Фильтруем чужие сообщения
        if (msg.userId && msg.userId !== session?.user?.id) return;
        // Если есть локальное сообщение с тем же текстом и статусом pending — заменяем его на настоящее
        setMessages(m => {
          const idx = m.findIndex(
            x => x.status === "pending" && x.text === msgText && Math.abs(new Date(x.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000
          );
          if (idx !== -1) {
            const newMsgs = [...m];
            newMsgs[idx] = { ...msg, status: "sent" };
            return newMsgs;
          }
          return [...m, { ...msg, status: "sent" }];
        });
        // Уведомление о новом сообщении, если модалка закрыта
        if (!open && msg.from === "moderator") {
          const next = supportUnreadCount + 1;
          setSupportUnreadCount(next);
          localStorage.setItem('supportUnreadCount', String(next));
          if (audioRef.current) audioRef.current.play();
        }
      } catch {}
    };
    setWs(socket);
    return () => { socket.close(); setWs(null); };
  }, [session?.user?.id, setSupportUnreadCount, supportUnreadCount]);

  // История
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/support/chat")
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .finally(() => setLoading(false));
  }, [open]);

  // Сброс счётчика при открытии чата
  useEffect(() => {
    if (open) {
      setSupportUnreadCount(0);
      localStorage.setItem('supportUnreadCount', '0');
    }
  }, [open, setSupportUnreadCount]);

  const handleSend = () => {
    if (!input.trim() || !ws) return;
    const tempId = Date.now();
    const msg: Message = { from: "user", text: input, created_at: new Date().toISOString(), tempId, status: "pending", userId: String(session?.user?.id) };
    setMessages(m => [...m, msg]);
    ws.send(JSON.stringify({ type: "message", text: input }));
    setInput("");
  };

  // Функция для определения, что сообщение своё
  function isOwnMessage(msg: Message) {
    return msg.from === "user" && String(msg.userId) === String(session?.user?.id);
  }

  // DEBUG
  if (typeof window !== 'undefined') {
    console.log('session.user.id', session?.user?.id);
    console.log('messages', messages);
  }

  return (
    <>
      <audio ref={audioRef} src="/support-notify.mp3" preload="auto" />
      {/* Кнопка чата */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform duration-300"
        onClick={() => setOpen(true)}
        aria-label="Открыть чат поддержки"
      >
        {/* SVG иконка человечка-офисника */}
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        {supportUnreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">{supportUnreadCount}</span>}
      </button>
      {/* Модалка чата */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex items-end justify-end">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-[95vw] max-w-md flex flex-col h-[70vh] animate-[fadeInUp_0.3s]">
            {/* Хедер */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
              <img src={supportAvatarUrl} alt="Модератор" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
              <div>
                <div className="font-bold text-indigo-700 dark:text-white">Модератор</div>
                <div className="text-xs text-gray-400">Онлайн</div>
              </div>
              <button className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={() => setOpen(false)}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
            </div>
            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-indigo-50 dark:bg-gray-950">
              {loading ? <div className="text-gray-400 text-center mt-8">Загрузка...</div> :
                messages.length === 0 ? <div className="text-gray-400 text-center mt-8">Нет сообщений</div> :
                messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 ${isOwnMessage(msg) ? "justify-end" : "justify-start"}`}>
                    {isOwnMessage(msg) ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold ml-2">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || "?"}
                      </div>
                    ) : (
                      <img src={supportAvatarUrl} alt="Модератор" className="w-8 h-8 rounded-full border-2 border-indigo-500 mr-2" />
                    )}
                    <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${isOwnMessage(msg) ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-indigo-100 dark:border-gray-800"}`}>
                      {msg.text || msg.message}
                      {msg.status === "pending" && <span className="ml-2 text-xs text-gray-400">⏳</span>}
                      {msg.status === "error" && <span className="ml-2 text-xs text-red-500">Ошибка</span>}
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Ввод */}
            <form className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-800" onSubmit={e => { e.preventDefault(); handleSend(); }}>
              <input
                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Ваш вопрос..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!ws}
                maxLength={500}
                autoFocus
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" disabled={!input.trim() || !ws}>Отправить</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 