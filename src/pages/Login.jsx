import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('owner');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const activeFieldRef = useRef(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
      if (inset > 0 && activeFieldRef.current) {
        window.setTimeout(() => activeFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    };

    viewport.addEventListener('resize', updateKeyboardInset);
    viewport.addEventListener('scroll', updateKeyboardInset);
    updateKeyboardInset();
    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset);
      viewport.removeEventListener('scroll', updateKeyboardInset);
    };
  }, []);

  const keepFieldVisible = (event) => {
    const field = event.currentTarget;
    activeFieldRef.current = field;
    window.setTimeout(() => field.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password, role);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto bg-slate-950 flex items-start sm:items-center justify-center px-4 py-6 sm:py-4 font-sans"
      style={{ paddingBottom: `${keyboardInset + 24}px` }}
    >
      <div className="w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-6 sm:p-8 text-white">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl mb-5">🚜</div>
          <p className="text-amber-400 text-xs font-black uppercase tracking-widest">Loganathan Earth Movers</p>
          <h1 className="text-2xl font-black mt-2">Secure business login</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in with your Owner or Manager account.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">Login as</label>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">{role}</span>
            </div>
            <div className="relative grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-5">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform duration-200 ${role === 'manager' ? 'translate-x-full' : 'translate-x-0'}`}
              />
              {['owner', 'manager'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setRole(option); setUsername(option); }}
                  className={`relative z-10 py-2.5 text-sm font-black capitalize flex items-center justify-center gap-2 ${role === option ? 'text-indigo-700' : 'text-slate-500'}`}
                >
                  <UserRound className="w-4 h-4" /> {option}
                </button>
              ))}
            </div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
            <input
              required
              autoComplete="username"
              value={username}
              onFocus={keepFieldVisible}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
              placeholder={`${role} username`}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onFocus={keepFieldVisible}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
          <button
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Passwords are securely hashed on the server
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
