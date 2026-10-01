import { useEffect, useState } from 'react';
import { Check, Save, UserRound } from 'lucide-react';
import { getErrorMessage } from '../services/api';
import api from '../services/api';
import { Alert, Loading, SpinnerButton } from '../components/common/UI';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { api.get('/api/profile').then(({ data }) => setProfile(data)).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, []);
  const change = (event) => setProfile({ ...profile, [event.target.name]: event.target.value });
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); setSuccess(''); try { const { data } = await api.put('/api/profile', profile); setProfile(data); setUser((user) => ({ ...user, ...data })); setSuccess('Your profile has been saved.'); } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); } };
  if (loading) return <Loading label="Loading your profile…" />;
  if (!profile) return <div className="profile-page"><div className="page-heading"><div><div className="section-kicker">YOUR ACCOUNT</div><h1>Profile</h1><p>We couldn't load your profile right now.</p></div></div><Alert>{error || 'Please refresh the page and try again.'}</Alert></div>;
  return <div className="profile-page"><div className="page-heading"><div><div className="section-kicker">YOUR ACCOUNT</div><h1>Profile</h1><p>Keep your practice focused on the roles you care about.</p></div></div><Alert>{error}</Alert>{success && <Alert tone="success">{success}</Alert>}<form className="card profile-card" onSubmit={submit}><div className="profile-card-heading"><span className="profile-avatar-large"><UserRound size={24} /></span><div><h2>Personal details</h2><p>This information is used to personalize your interview practice.</p></div></div><div className="form-grid profile-fields"><label className="form-label">Full name<input className="form-control" name="name" value={profile.name} onChange={change} required minLength="2" /></label><label className="form-label">Email address<input className="form-control" type="email" value={profile.email} disabled /><small>Email cannot be changed here.</small></label><label className="form-label full">Target job role<input className="form-control" name="target_role" value={profile.target_role || ''} onChange={change} placeholder="e.g. Frontend Developer" /></label><label className="form-label">Experience level<select className="form-control" name="experience_level" value={profile.experience_level} onChange={change}>{['Fresher', 'Junior', 'Mid-Level', 'Senior'].map((v) => <option key={v}>{v}</option>)}</select></label><label className="form-label">Preferred interview type<select className="form-control" name="preferred_interview_type" value={profile.preferred_interview_type} onChange={change}>{['Technical', 'HR', 'Behavioral', 'Coding', 'General', 'Mixed'].map((v) => <option key={v}>{v}</option>)}</select></label></div><div className="profile-save-row"><span className="muted small"><Check size={13} /> Your profile is only visible to you.</span><SpinnerButton className="button button-primary" loading={saving}><Save size={15} /> Save changes</SpinnerButton></div></form></div>;
}
