import { LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Loading your workspace…' }) {
  return <div className="loading-state" role="status"><LoaderCircle className="spin" size={21} /><span>{label}</span></div>;
}

export function SpinnerButton({ loading, children, ...props }) {
  return <button {...props} disabled={props.disabled || loading}>{loading && <LoaderCircle className="spin" size={17} />}{children}</button>;
}

export function EmptyState({ title, description, action }) {
  return <div className="empty-state"><div className="empty-icon">✦</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Alert({ children, tone = 'error' }) {
  if (!children) return null;
  return <div className={`alert alert-${tone}`} role="alert">{children}</div>;
}

export function ScoreBar({ label, value }) {
  return <div className="score-row"><div className="score-label"><span>{label}</span><strong>{Math.round(value ?? 0)}<small>/100</small></strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} /></div></div>;
}
