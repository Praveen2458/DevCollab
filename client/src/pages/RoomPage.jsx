import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import { http } from '../api/http';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Textarea } from '../components/ui';
import { formatDateTime, formatTime } from '../lib/time';

export function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // userId or 'room'
  const [confirmLeave, setConfirmLeave] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  const socketUrl = useMemo(() => {
    return (
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      window.location.origin
    );
  }, []);

  const isOwner = room && user && String(room.createdBy?._id || room.createdBy) === String(user._id);

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

    socket.on('chat:typing', (payload) => {
      if (payload.roomId !== roomId) return;
      const name = payload.user?.name;
      if (!name) return;

      setTypingUsers((prev) => {
        if (prev.includes(name)) return prev;
        return [...prev, name];
      });

      // Auto-clear after 2 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      }, 2000);
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

  // Emit typing indicator (debounced)
  function handleMessageInput(e) {
    setMessageText(e.target.value);

    const socket = socketRef.current;
    if (!socket) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('chat:typing', { roomId });
    }, 150);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const content = messageText.trim();
    if (!content) return;

    socketRef.current?.emit('chat:send', { roomId, content });
    setMessageText('');
  }

  async function copyInviteLink() {
    const link = `${window.location.origin}/app/rooms/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy just the room ID
      try {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  }

  async function handleLeaveRoom() {
    try {
      await http.post(`/api/rooms/${roomId}/leave`);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to leave room');
    }
    setConfirmLeave(false);
  }

  async function handleKickUser(userId) {
    try {
      await http.delete(`/api/rooms/${roomId}/participants/${userId}`);
      setParticipants((prev) => prev.filter((p) => p._id !== userId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to remove user');
    }
    setConfirmDelete(null);
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

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing…`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing…`
        : typingUsers.length > 2
          ? `${typingUsers[0]} and ${typingUsers.length - 1} others are typing…`
          : null;

  return (
    <div className="h-full flex flex-col">
      {/* Room Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-950/40 px-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate font-semibold">{room?.title}</div>
            <button
              onClick={copyInviteLink}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              title="Copy invite link"
            >
              {copied ? '✓ Copied!' : `#${roomId} 📋`}
            </button>
          </div>
          <div className="text-xs text-slate-500">
            Created {room?.createdAt ? formatDateTime(room.createdAt) : ''}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400">
            <span className="text-slate-200">{onlineCount}</span>/{participants.length} online
          </div>
          {!isOwner && (
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs text-slate-400 hover:text-rose-400"
              onClick={() => setConfirmLeave(true)}
            >
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Leave Modal */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Leave Room?</h3>
            <p className="text-sm text-slate-400">You will be removed from this room. You can rejoin later using the Room ID.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmLeave(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleLeaveRoom}>Leave Room</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Kick Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Remove User?</h3>
            <p className="text-sm text-slate-400">This user will be removed from the room. They can rejoin if they have the Room ID.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleKickUser(confirmDelete)}>Remove</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_420px]">
        {/* Chat Section */}
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

            {/* Typing Indicator */}
            {typingText && (
              <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                {typingText}
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="h-14 px-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2">
            <Input
              value={messageText}
              onChange={handleMessageInput}
              placeholder="Message…"
            />
            <Button type="submit">Send</Button>
          </form>
        </section>

        {/* Notes & Participants Section */}
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
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300"
                  title={p.name}
                >
                  <span className={`h-2 w-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="max-w-[140px] truncate">{p.name}</span>
                  {isOwner && String(p._id) !== String(user._id) && (
                    <button
                      onClick={() => setConfirmDelete(p._id)}
                      className="hidden group-hover:inline-flex items-center justify-center h-4 w-4 rounded-full bg-slate-800 text-slate-500 hover:bg-rose-900 hover:text-rose-300 transition-colors text-[10px] leading-none"
                      title={`Remove ${p.name}`}
                    >
                      ✕
                    </button>
                  )}
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
