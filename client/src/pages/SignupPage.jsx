import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup({ name, email, password });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-black/30">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-slate-500">DevCollab</div>
          <h1 className="mt-2 text-xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-slate-400">Your real-time collaboration workspace.</p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required />
          </div>

          {error ? <div className="text-sm text-rose-400">{error}</div> : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <div className="mt-5 text-sm text-slate-400">
          Already have an account?{' '}
          <Link className="text-indigo-400 hover:text-indigo-300" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
