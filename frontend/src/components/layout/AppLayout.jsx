import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, Plus, Settings, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/history', label: 'Interview history', icon: ClipboardList },
  { to: '/profile', label: 'My profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = () => { logout(); navigate('/'); };
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark">✳</span><span>interviewly</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8} />{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><strong>Need a hand?</strong><p>Practice is the first step to progress.</p></div>
        <button className="profile-mini" onClick={() => navigate('/profile')}><span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span><span className="profile-mini-copy"><strong>{user?.name || 'Your account'}</strong><small>{user?.email}</small></span><ChevronDown size={15} /></button>
      </div>
    </aside>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <main className="main-panel">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X size={21} /> : <Menu size={21} />}</button><div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>Interview practice</strong></div><div className="topbar-actions"><span className="mode-pill"><i /> Demo AI ready</span><button className="user-chip" onClick={signOut}><span className="avatar avatar-small">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span><span>{user?.name?.split(' ')[0] || 'Account'}</span><LogOut size={15} /></button></div></header>
      <div className="page-content"><Outlet /></div>
    </main>
  </div>;
}
