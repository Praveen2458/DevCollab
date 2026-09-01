import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { http } from '../api/http';
import { Button, Input, Textarea } from '../components/ui';
import { formatDateTime, formatTime } from '../lib/time';

export function RoomPage() {
  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const listRef = useRef(null);

  const socketUrl = useMemo(() => {
    return (
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      window.location.origin
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [roomRes, msgRes, noteRes] = await Promise.all([
          http.get(`/api/rooms/${roomId}`),
          http.get(`/api/rooms/${roomId}/messages`),
          http.get(`/api/rooms/${roomId}/notes`),
        ]);

        if (cancelled) return;

        setRoom(roomRes.data.room);
        setParticipants(roomRes.data.room.participants?.map((p) => ({ ...p, isOnline: false })) || []);
        setMessages(msgRes.data.messages || []);
        setNoteText(noteRes.data.note?.content || '');
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Failed to load room');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(socketUrl, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', { roomId });
    });

    socket.on('room:participants', (payload) => {
      if (payload.roomId !== roomId) return;
      setParticipants(payload.participants || []);
    });

    socket.on('chat:new', (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('notes:sync', (payload) => {
      if (payload.roomId !== roomId) return;
      setNoteText(payload.content ?? '');
    });

    socket.on('room:error', (payload) => {
      setError(payload?.message || 'Room error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, socketUrl]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const t = setTimeout(() => {
      socket.emit('notes:update', { roomId, content: noteText });
    }, 250);

    return () => clearTimeout(t);
  }, [noteText, roomId]);

  async function sendMessage(e) {
    e.preventDefault();
    const content = messageText.trim();
    if (!content) return;

    socketRef.current?.emit('chat:send', { roomId, content });
    setMessageText('');
  }

  if (loading) {
    return (
      <div className="h-full grid place-items-center">
        <div className="text-sm text-slate-400">Loading room…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full grid place-items-center p-6">
        <div className="max-w-lg rounded-xl border border-slate-800 bg-slate-950/40 p-6">
          <div className="text-sm text-rose-400">{error}</div>
        </div>
      </div>
    );
  }

  const onlineCount = participants.filter((p) => p.isOnline).length;

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-slate-800 bg-slate-950/40 px-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate font-semibold">{room?.title}</div>
            <div className="text-xs text-slate-500">#{roomId}</div>
          </div>
          <div className="text-xs text-slate-500">
            Created {room?.createdAt ? formatDateTime(room.createdAt) : ''}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <span className="text-slate-200">{onlineCount}</span>/{participants.length} online
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
            <div className="text-xs uppercase tracking-widest text-slate-500">Chat</div>
            <div className="text-xs text-slate-500">Live</div>
          </div>

          <div ref={listRef} className="min-h-0 h-[calc(100%-2.5rem-3.5rem)] overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-400">
                No messages yet. Say hi.
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m._id} className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-md bg-slate-800 grid place-items-center text-xs text-slate-200">
                  {(m.sender?.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm font-medium text-slate-100">{m.sender?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{m.createdAt ? formatTime(m.createdAt) : ''}</div>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-200 whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="h-14 px-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Message…"
            />
            <Button type="submit">Send</Button>
          </form>
        </section>

        <section className="min-h-0">
          <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
            <div className="text-xs uppercase tracking-widest text-slate-500">Shared notes</div>
            <div className="text-xs text-slate-500">Auto-saves</div>
          </div>

          <div className="p-4 h-[calc(100%-2.5rem)] flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {participants.slice(0, 6).map((p) => (
                <div
                  key={p._id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300"
                  title={p.name}
                >
                  <span className={`h-2 w-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="max-w-[140px] truncate">{p.name}</span>
                </div>
              ))}
              {participants.length > 6 ? (
                <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                  +{participants.length - 6}
                </div>
              ) : null}
            </div>

            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="flex-1 min-h-[240px] resize-none font-mono text-[13px] leading-relaxed"
              placeholder="Shared notes / code snippets…"
            />

            <div className="text-xs text-slate-500">
              Tip: paste code snippets here — everyone in the room sees updates instantly.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
