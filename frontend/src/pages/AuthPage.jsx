import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Alert, SpinnerButton } from '../components/common/UI';
import { getErrorMessage } from '../services/api';

export default function AuthPage({ mode }) {
  const registering = mode === 'register';
  const navigate = useNavigate();
  const { acceptAuth } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const result = registering ? await authService.register(form) : await authService.login({ email: form.email, password: form.password });
      acceptAuth(result); navigate('/dashboard');
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };
  return <main className="auth-shell"><div className="auth-side"><Link to="/" className="brand auth-brand"><span className="brand-mark">✳</span><span>interviewly</span></Link><Link to="/" className="back-home"><ArrowLeft size={15} /> Back to home</Link><div className="auth-side-message"><div className="auth-side-mark"><Sparkles size={22} /></div><span className="section-kicker">MAKE PRACTICE COUNT</span><h2>Great interviews<br />start with practice.</h2><p>Build a little more confidence with every answer you give.</p><div className="auth-quote"><div className="quote-stars">★★★★★</div><p>“The feedback helped me organize my answers and feel more prepared.”</p><small>— A practice session reflection</small></div></div><span className="auth-side-footer">Thoughtful practice, at your own pace.</span></div><section className="auth-main"><div className="auth-card"><div className="auth-mobile-brand"><Link to="/" className="brand"><span className="brand-mark">✳</span><span>interviewly</span></Link></div><span className="section-kicker">{registering ? 'YOUR PRACTICE STARTS HERE' : 'WELCOME BACK'}</span><h1>{registering ? 'Create your account' : 'Good to see you again'}</h1><p className="auth-lead">{registering ? 'Set up a free account and take the first step.' : 'Log in to continue where you left off.'}</p><Alert>{error}</Alert><form onSubmit={submit} className="auth-form">{registering && <label>Full name<div className="input-wrap"><UserRound size={17} /><input name="name" value={form.name} onChange={update} placeholder="Jordan Lee" autoComplete="name" required minLength="2" /></div></label>}<label>Email address<div className="input-wrap"><Mail size={17} /><input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={update} placeholder={registering ? 'At least 8 characters' : 'Enter your password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : 1} required /><button type="button" className="reveal-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><SpinnerButton className="button button-primary auth-submit" loading={loading}>{registering ? 'Create account' : 'Log in'} <ArrowRight size={16} /></SpinnerButton></form><p className="auth-switch">{registering ? 'Already have an account?' : 'New to Interviewly?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Log in' : 'Create an account'}</Link></p><div className="auth-privacy"><LockKeyhole size={13} /> Your account is private. Practice answers stay in your account.</div></div></section></main>;
}
