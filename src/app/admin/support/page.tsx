"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface Message {
  from: "user" | "moderator";
  text?: string;
  message?: string;
  userId?: string;
  moderatorId?: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
}

export default function SupportModeratorPanel() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const [supportAvatarUrl, setSupportAvatarUrl] = useState('/avatar-support.png');
  const [unread, setUnread] = useState<{ [userId: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Получаем supportAvatarUrl из settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => setSupportAvatarUrl(data.settings?.supportAvatarUrl || '/avatar-support.png'));
  }, []);

  // Получить список пользователей с активными чатами
  useEffect(() => {
    fetch("/api/admin/support/active-users")
      .then(r => r.json())
      .then(data => setUsers(data.users || []));
  }, []);

  // ws connect
  useEffect(() => {
    if (!session?.user?.id) return;
    const socket = new window.WebSocket(`ws://localhost:4001/?userId=${session.user.id}&moderator=1`);
    socket.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        const msgText = msg.text || msg.message;
        if (!msgText) return;
        if (msg.userId && (!selectedUser || String(msg.userId) !== String(selectedUser.id))) {
          setUnread(u => ({ ...u, [msg.userId]: (u[msg.userId] || 0) + 1 }));
          if (audioRef.current) audioRef.current.play();
        }
        if (!msg.userId || (selectedUser && String(msg.userId) === String(selectedUser.id))) {
          setMessages(m => [...m, msg]);
        }
      } catch {}
    };
    setWs(socket);
    return () => { socket.close(); setWs(null); };
    // eslint-disable-next-line
  }, [session?.user?.id, selectedUser?.id]);

  // История
  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    fetch(`/api/admin/support/chat?userId=${selectedUser.id}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .finally(() => setLoading(false));
  }, [selectedUser]);

  // Авто-скролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // Сброс счётчика при открытии чата
  useEffect(() => {
    if (selectedUser) setUnread(u => ({ ...u, [selectedUser.id]: 0 }));
  }, [selectedUser]);

  const handleSend = () => {
    if (!input.trim() || !ws || !selectedUser) return;
    const msg = { from: "moderator" as const, text: input, userId: selectedUser.id, moderatorId: String(session?.user?.id), created_at: new Date().toISOString() };
    ws.send(JSON.stringify({ type: "message", text: input, to: selectedUser.id }));
    setMessages(m => [...m, msg]);
    setInput("");
  };

  // Функция для определения, что сообщение своё (от модератора)
  function isOwnMessage(msg: Message) {
    return msg.from === "moderator" && (String(msg.moderatorId) === String(session?.user?.id) || msg.moderatorId === '1');
  }

  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden animate-[fadeInUp_0.3s]">
      <audio ref={audioRef} src="/support-notify.mp3" preload="auto" />
      {/* Список пользователей */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 overflow-y-auto">
        <div className="font-bold text-indigo-700 mb-4">Пользователи</div>
        {users.length === 0 ? <div className="text-gray-400">Нет активных чатов</div> :
          users.map(u => (
            <div
              key={u.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 ${selectedUser?.id === u.id ? "bg-indigo-100 dark:bg-indigo-900" : ""}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="relative w-8 h-8">
                <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold text-lg">{u.name[0]}</div>
                {unread[u.id] > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{unread[u.id]}</span>}
              </div>
              <div className="truncate">{u.name}</div>
            </div>
          ))}
      </div>
      {/* Чат */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          {selectedUser ? (
            <>
              <img src={supportAvatarUrl} alt="Модератор" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
              <div className="font-bold text-indigo-700 dark:text-white">{selectedUser.name}</div>
            </>
          ) : <div className="text-gray-400">Выберите пользователя</div>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-indigo-50 dark:bg-gray-950">
          {loading ? <div className="text-gray-400 text-center mt-8">Загрузка...</div> :
            (!selectedUser ? <div className="text-gray-400 text-center mt-8">Нет чата</div> :
              messages.length === 0 ? <div className="text-gray-400 text-center mt-8">Нет сообщений</div> :
                messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 ${isOwnMessage(msg) ? "justify-end" : "justify-start"}`}>
                    {msg.from === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold mr-2">
                        {selectedUser?.name?.[0] || "?"}
                      </div>
                    ) : (
                      <img src={supportAvatarUrl} alt="Модератор" className="w-8 h-8 rounded-full border-2 border-indigo-500 ml-2" />
                    )}
                    <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${isOwnMessage(msg) ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-indigo-100 dark:border-gray-800"}`}>
                      {msg.text || msg.message}
                    </div>
                  </div>
                )))}
          <div ref={messagesEndRef} />
        </div>
        {/* Ввод */}
        {selectedUser && <form className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-800" onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="Ответ..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!ws}
            maxLength={500}
            autoFocus
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" disabled={!input.trim() || !ws}>Отправить</button>
        </form>}
      </div>
    </div>
  );
} 