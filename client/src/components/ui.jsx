export function Button({ className = '', variant = 'primary', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-500 hover:bg-indigo-400 text-slate-950',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-100',
    subtle: 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800',
    danger: 'bg-rose-500 hover:bg-rose-400 text-slate-950',
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${className}`}
      {...props}
    />
  );
}
