import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, LoaderCircle, Mic, MicOff, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import { Alert, Loading } from '../components/common/UI';
import { getErrorMessage } from '../services/api';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../services/voiceService';

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const current = interview?.questions?.[index];
  const progress = interview ? ((index + 1) / interview.questions.length) * 100 : 0;
  const clock = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  useEffect(() => {
    let active = true;
    interviewService.get(id).then(async (data) => {
      if (data.status === 'completed') { navigate(`/interview/${id}/result`, { replace: true }); return; }
      if (data.status !== 'in_progress') data = await interviewService.start(id);
      if (active) setInterview(data);
    }).catch((e) => setError(getErrorMessage(e))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, navigate]);

  useEffect(() => { if (!current) return; setAnswer(sessionStorage.getItem(`draft-${id}-${current.id}`) || current.answer_text || ''); }, [id, current?.id]);
  useEffect(() => () => recognition.current?.stop(), []);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, []);

  if (loading) return <Loading label="Preparing your interview…" />;
  if (error && !interview) return <div className="session-error"><Alert>{error}</Alert><Link to="/dashboard" className="button button-white"><ArrowLeft size={15} /> Back to overview</Link></div>;
  if (!interview || !current) return null;

  const saveAnswer = async () => {
    if (!answer.trim()) { setError('Add an answer before moving on.'); return false; }
    setError(''); setSaving(true);
    try { await interviewService.answer(id, { question_id: current.id, answer_text: answer.trim() }); sessionStorage.removeItem(`draft-${id}-${current.id}`); setInterview((value) => ({ ...value, questions: value.questions.map((question) => question.id === current.id ? { ...question, answered: true, answer_text: answer.trim() } : question) })); return true; }
    catch (e) { setError(getErrorMessage(e)); return false; } finally { setSaving(false); }
  };
  const next = async () => { const saved = await saveAnswer(); if (saved) { if (index < interview.questions.length - 1) setIndex(index + 1); else setConfirmFinish(true); } };
  const finish = async () => { setSaving(true); setError(''); try { await interviewService.finish(id); navigate(`/interview/${id}/result`); } catch (e) { setError(getErrorMessage(e)); setConfirmFinish(false); } finally { setSaving(false); } };
  const toggleVoice = () => {
    if (listening) { recognition.current?.stop(); return; }
    recognition.current = createSpeechRecognizer({
      onResult: (transcript) => setAnswer((value) => {
        const updated = `${value}${value && !value.endsWith(' ') ? ' ' : ''}${transcript}`;
        sessionStorage.setItem(`draft-${id}-${current.id}`, updated);
        return updated;
      }),
      onError: (message) => setError(message),
      onEnd: () => setListening(false),
    });
    if (!recognition.current) { setError('Voice input is unavailable in this browser. You can still type your answer.'); return; }
    setError('');
    try { recognition.current.start(); setListening(true); } catch { setError('Microphone access could not start. Please use text input instead.'); }
  };

  return <div className="session-page"><header className="session-header"><Link to="/dashboard" className="session-brand"><span className="brand-mark">✳</span><span>interviewly</span></Link><div className="session-title"><strong>{interview.job_role}</strong><span>{interview.interview_type} practice</span></div><div className="session-tools"><span className="session-timer"><Clock3 size={15} /> {clock}</span><span className="session-save"><i /> Autosaved</span></div></header><div className="session-content"><div className="session-progress-head"><div><span>QUESTION <strong>{String(index + 1).padStart(2, '0')}</strong></span><i>/</i><span>{String(interview.questions.length).padStart(2, '0')}</span></div><span>{Math.round(progress)}% complete</span></div><div className="session-progress"><span style={{ width: `${progress}%` }} /></div><div className="session-layout"><main className="session-main"><div className="question-meta"><span className="badge">{current.category}</span><span className="badge difficulty-badge">{current.difficulty} difficulty</span></div><h1>{current.question_text}</h1><p className="question-prompt">Take a moment to think it through. There is no rush.</p><div className="answer-label-row"><label className="answer-label" htmlFor="answer">YOUR ANSWER</label>{isSpeechRecognitionSupported() && <button className={`voice-button ${listening ? 'listening' : ''}`} type="button" onClick={toggleVoice} aria-pressed={listening}>{listening ? <MicOff size={14} /> : <Mic size={14} />}{listening ? 'Stop voice input' : 'Answer by voice'}</button>}</div><textarea id="answer" className="answer-box" value={answer} onChange={(event) => { setAnswer(event.target.value); sessionStorage.setItem(`draft-${id}-${current.id}`, event.target.value); }} placeholder="Share your answer here. A specific example can help bring your response to life…" maxLength={12000} /><div className="answer-footer"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><span>Your answer is only used to generate coaching feedback.</span></div><Alert>{error}</Alert><div className="session-actions"><button className="ghost-button" disabled={index === 0 || saving} onClick={() => setIndex(index - 1)}><ArrowLeft size={15} /> Previous</button><button className="button button-primary" disabled={saving || !answer.trim()} onClick={next}>{saving ? <LoaderCircle className="spin" size={16} /> : index === interview.questions.length - 1 ? <Flag size={15} /> : <Check size={15} />}{index === interview.questions.length - 1 ? 'Review & finish' : 'Save & continue'}{index < interview.questions.length - 1 && <ArrowRight size={15} />}</button></div></main><aside className="session-aside"><div className="session-aside-icon"><Sparkles size={17} /></div><span className="section-kicker">A SMALL TIP</span><h3>Use a clear structure.</h3><p>For experience-based questions, try explaining the situation, what you did, and what changed as a result.</p><div className="session-tip-divider" /><span className="session-aside-foot">Your answers will be analyzed after you submit them.</span></aside></div></div>{confirmFinish && <div className="modal-scrim" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="finish-title"><div className="section-kicker">ALMOST THERE</div><h2 id="finish-title">Finish this interview?</h2><p className="muted">Your answer will be analyzed and your feedback will be ready to review. You can’t edit answers after finishing.</p><Alert>{error}</Alert><div className="modal-actions"><button className="ghost-button" onClick={() => setConfirmFinish(false)}>Keep practicing</button><button className="button button-primary" onClick={finish} disabled={saving}>{saving ? 'Finishing…' : 'Finish interview'} <ArrowRight size={15} /></button></div></div></div>}</div>;
}
