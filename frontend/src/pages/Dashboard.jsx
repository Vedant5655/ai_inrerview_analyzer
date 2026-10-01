import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Award, CalendarDays, Clock3, Plus, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/interviewService';
import { getErrorMessage } from '../services/api';
import { Alert, EmptyState, Loading } from '../components/common/UI';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { interviewService.list().then(setInterviews).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, []);
  const completed = interviews.filter((item) => item.status === 'completed');
  const average = completed.length ? Math.round(completed.reduce((sum, item) => sum + item.overall_score, 0) / completed.length) : 0;
  const best = completed.length ? Math.max(...completed.map((item) => item.overall_score || 0)) : 0;
  const thisMonth = interviews.filter((item) => { const date = new Date(item.created_at); const today = new Date(); return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(); }).length;
  const chartData = useMemo(() => [...completed].reverse().slice(-8).map((item, i) => ({ name: `Session ${i + 1}`, score: item.overall_score || 0 })), [interviews]);
  if (loading) return <Loading label="Getting your practice overview…" />;
  return <div>
    <div className="dashboard-welcome"><div><div className="section-kicker">YOUR PRACTICE OVERVIEW</div><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'} <span className="wave">✦</span></h1><p>A little practice today can make a big difference tomorrow.</p></div><Link className="button button-primary" to="/interview/new"><Plus size={17} /> New interview</Link></div>
    <Alert>{error}</Alert>
    <div className="stat-grid"><Stat icon={Activity} label="Total interviews" value={interviews.length} helper="Practice sessions" tone="blue" /><Stat icon={TrendingUp} label="Average score" value={completed.length ? `${average}` : '—'} suffix={completed.length ? '/100' : ''} helper={completed.length ? 'Across completed sessions' : 'Complete a session to begin'} tone="mint" /><Stat icon={Award} label="Personal best" value={completed.length ? best : '—'} suffix={completed.length ? '/100' : ''} helper="Your highest score" tone="amber" /><Stat icon={CalendarDays} label="This month" value={thisMonth} helper="Sessions started" tone="lavender" /></div>
    <div className="dashboard-grid"><section className="card chart-card"><div className="card-heading"><div><h2 className="card-title">Your progress</h2><p>Overall score across completed sessions</p></div><span className="chart-period">Last sessions</span></div>{chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#969eac', fontSize: 10 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#969eac', fontSize: 10 }} /><Tooltip contentStyle={{ border: '1px solid #e7ebf2', borderRadius: 10, boxShadow: '0 8px 24px #1d2b4d12' }} /><Line type="monotone" dataKey="score" stroke="#5675ee" strokeWidth={3} dot={{ fill: '#fff', stroke: '#5675ee', strokeWidth: 3, r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div> : <div className="chart-empty"><div className="chart-empty-art"><TrendingUp size={25} /></div><strong>Your progress will show up here</strong><span>Complete your first practice to start tracking.</span><Link to="/interview/new" className="small-link">Start a session <ArrowRight size={14} /></Link></div>}</section>
    <section className="card focus-card"><div className="focus-top"><div className="focus-icon"><Sparkles size={18} /></div><span className="focus-tag">A GOOD PLACE TO START</span></div><h2>One thoughtful answer at a time.</h2><p>Practice at your pace, then use your feedback to strengthen your next response.</p><div className="focus-points"><span><i><Target size={13} /></i> Choose a role that interests you</span><span><i><Clock3 size={13} /></i> A session takes about 10 minutes</span></div><Link to="/interview/new" className="button button-dark">Start practicing <ArrowRight size={15} /></Link></section></div>
    <section className="card recent-card"><div className="card-heading"><div><h2 className="card-title">Recent interviews</h2><p>Your latest practice sessions</p></div><Link className="small-link" to="/history">View all <ArrowRight size={14} /></Link></div>{interviews.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Interview</th><th>Date</th><th>Difficulty</th><th>Score</th><th>Status</th><th /></tr></thead><tbody>{interviews.slice(0, 5).map((item) => <tr key={item.id}><td><span className="table-role">{item.job_role}</span><small>{item.interview_type} interview</small></td><td>{formatDate(item.created_at)}</td><td><span className="badge">{item.difficulty}</span></td><td>{item.overall_score == null ? '—' : <strong>{Math.round(item.overall_score)}<small className="score-total">/100</small></strong>}</td><td><span className={`badge status-badge ${item.status}`}>{item.status === 'completed' ? 'Completed' : item.status === 'in_progress' ? 'In progress' : 'Ready'}</span></td><td><Link className="table-action" to={item.status === 'completed' ? `/interview/${item.id}/result` : `/interview/${item.id}`}>{item.status === 'completed' ? 'View result' : 'Continue'} <ArrowUpRight size={13} /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No interviews yet" description="Your practice sessions will appear here." action={<Link className="button button-primary" to="/interview/new">Start your first interview <ArrowRight size={15} /></Link>} />}</section>
    <p className="assessment-note"><Sparkles size={13} /> Scores and feedback are AI-generated coaching suggestions, not hiring decisions.</p>
  </div>;
}

function Stat({ icon: Icon, label, value, suffix, helper, tone }) { return <div className="stat-card card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-helper">{helper}</div></div>; }
