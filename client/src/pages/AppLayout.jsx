import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

function RoomLink({ room, canDelete, onDelete }) {
  return (
    <NavLink
      to={`/app/rooms/${room.roomId}`}
      className={({ isActive }) =>
        [
          'group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
          isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900',
        ].join(' ')
      }
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{room.title}</div>
        <div className="mt-0.5 text-xs text-slate-500">#{room.roomId}</div>
      </div>
      <div className="ml-3 flex items-center gap-2">
        <div className="text-xs text-slate-500 group-hover:text-slate-400">
          {room.participants?.length ?? 0}
        </div>
        {canDelete ? (
          <Button
            type="button"
            variant="danger"
            className="px-2 py-1 text-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(room);
            }}
            aria-label={`Delete room ${room.title}`}
            title="Delete room"
          >
            Del
          </Button>
        ) : null}
      </div>
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomTitle, setRoomTitle] = useState('');
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [confirmRoom, setConfirmRoom] = useState(null);

  const sortedRooms = useMemo(() => rooms, [rooms]);

  async function loadRooms() {
    setLoadingRooms(true);
    try {
      const { data } = await http.get('/api/rooms');
      setRooms(data.rooms || []);
    } finally {
      setLoadingRooms(false);
    }
  }

  useEffect(() => {
    document.documentElement.classList.add('dark');
    loadRooms().catch(() => {});
  }, []);

  async function onCreateRoom(e) {
    e.preventDefault();
    setError('');
    try {
      const title = roomTitle.trim();
      if (title.length < 2) return;
      const { data } = await http.post('/api/rooms', { title });
      setRoomTitle('');
      await loadRooms();
      navigate(`/app/rooms/${data.room.roomId}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create room');
    }
  }

  async function onJoinRoom(e) {
    e.preventDefault();
    setError('');
    try {
      const id = joinId.trim();
      if (!id) return;
      const { data } = await http.post('/api/rooms/join', { roomId: id });
      setJoinId('');
      await loadRooms();
      navigate(`/app/rooms/${data.room.roomId}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join room');
    }
  }

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function onDeleteRoom(room) {
    setConfirmRoom(room);
  }

  async function confirmDeleteRoom() {
    if (!confirmRoom) return;
    setError('');
    try {
      await http.delete(`/api/rooms/${confirmRoom.roomId}`);

      setRooms((prev) => prev.filter((r) => r._id !== confirmRoom._id));

      if (location.pathname.startsWith(`/app/rooms/${confirmRoom.roomId}`)) {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete room');
    }
    setConfirmRoom(null);
  }

  return (
    <div className="h-full grid grid-cols-[300px_1fr]">
      <aside className="border-r border-slate-800 bg-slate-950/70">
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <Link to="/app" className="font-semibold tracking-tight">
            DevCollab
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400 max-w-[120px] truncate">{user?.name}</div>
            <Button variant="ghost" className="px-2 py-1" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <form onSubmit={onCreateRoom} className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-slate-500">Create room</div>
            <div className="flex gap-2">
              <Input value={roomTitle} onChange={(e) => setRoomTitle(e.target.value)} placeholder="Room title" />
              <Button type="submit">Create</Button>
            </div>
          </form>

          <form onSubmit={onJoinRoom} className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-slate-500">Join room</div>
            <div className="flex gap-2">
              <Input value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Room ID" />
              <Button variant="subtle" type="submit">
                Join
              </Button>
            </div>
          </form>

          {error ? <div className="text-sm text-rose-400">{error}</div> : null}

          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-slate-500">Rooms</div>
              {loadingRooms ? <div className="text-xs text-slate-500">Loading…</div> : null}
            </div>

            <div className="space-y-1">
              {sortedRooms.length === 0 && !loadingRooms ? (
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
                  Create or join a room to start collaborating.
                </div>
              ) : null}
              {sortedRooms.map((r) => (
                <RoomLink
                  key={r._id}
                  room={r}
                  canDelete={String(r.createdBy) === String(user?._id)}
                  onDelete={onDeleteRoom}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet context={{ reloadRooms: loadRooms }} />
      </main>

      {/* Confirm Delete Modal */}
      {confirmRoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Delete Room?</h3>
            <p className="text-sm text-slate-400">
              Permanently delete <strong className="text-slate-200">{confirmRoom.title}</strong> and all its messages and notes? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmRoom(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDeleteRoom}>Delete Room</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
