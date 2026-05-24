export function WelcomePage() {
  return (
    <div className="h-full grid place-items-center p-6">
      <div className="max-w-lg rounded-xl border border-slate-800 bg-slate-950/40 p-6">
        <div className="text-xs uppercase tracking-widest text-slate-500">Workspace</div>
        <h2 className="mt-2 text-xl font-semibold">Pick a room</h2>
        <p className="mt-2 text-sm text-slate-400">
          Select a room from the sidebar to chat live and collaborate on shared notes.
        </p>
      </div>
    </div>
  );
}
