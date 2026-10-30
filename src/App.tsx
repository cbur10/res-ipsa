import { useEffect, useMemo, useRef, useState } from 'react';
import type { State } from './store';
import { BUILDINGS, ITEMS, LESSON, addXp, byId, ensureRound, freePlay, grade, load, rank, reset, save, today, freePlay as _fp } from './store';
import { say } from './bailey';
import { Bailey, Gil } from './Art';
import { TOWN_INNER } from './assets/town';
import { MAP_SVG } from './assets/art';
void _fp;

type Session = { title: string; ids: string[]; stop?: string };
type Screen = { k: 'home' } | { k: 'map' } | { k: 'lesson'; s: Session } | { k: 'done'; s: Session; xp: number; right: number; total: number; roundBonus: boolean; newStreak: boolean } | { k: 'me' };

export default function App() {
  const [st, setSt] = useState<State>(() => ensureRound(load()));
  const [scr, setScr] = useState<Screen>({ k: 'home' });
  useEffect(() => save(st), [st]);
  useEffect(() => { const t = setInterval(() => setSt(s => ensureRound(s)), 60000); return () => clearInterval(t); }, []);
  const go = (s: Screen) => { setScr(s); window.scrollTo(0, 0); };
  return (
    <div className="app">
      {scr.k === 'home' && <Home st={st} go={go} />}
      {scr.k === 'map' && <TravelMap st={st} setSt={setSt} />}
      {scr.k === 'me' && <Me st={st} onReset={() => { if (confirm('Reset all progress?')) { reset(); setSt(ensureRound(load())); go({ k: 'home' }); } }} />}
      {scr.k === 'lesson' && <Lesson key={scr.s.title + scr.s.ids.join()} session={scr.s} st={st} setSt={setSt} onExit={() => go({ k: 'home' })} onDone={r => go({ k: 'done', s: scr.s, ...r })} />}
      {scr.k === 'done' && <Done d={scr} st={st} go={go} />}
      {(scr.k === 'home' || scr.k === 'map' || scr.k === 'me') && (
        <nav className="tab">
          <button className={scr.k === 'home' ? 'on' : ''} onClick={() => go({ k: 'home' })}>🏛️<small>Town</small></button>
          <button className={scr.k === 'map' ? 'on' : ''} onClick={() => go({ k: 'map' })}>🗺️<small>Travel</small></button>
          <button className={scr.k === 'me' ? 'on' : ''} onClick={() => go({ k: 'me' })}>🐾<small>Profile</small></button>
        </nav>)}
    </div>);
}

function TopBar({ st }: { st: State }) {
  const r = rank(st.xp);
  return <div className="top">
    <div className="pill" style={{ color: '#ff7a1a' }} data-testid="streak">🔥 {st.streak}</div>
    <div className="pill" style={{ color: '#2f7fd8' }} data-testid="xp">💎 {st.xp.toLocaleString()} XP</div>
    <div className="pill rank" data-testid="rank">🎓 {r.name}</div>
  </div>;
}

function Home({ st, go }: { st: State; go: (s: Screen) => void }) {
  const line = useMemo(() => say('home'), []);
  const stops = st.round!.stops;
  const next = stops.findIndex(s => !s.done);
  const doneN = stops.filter(s => s.done).length;
  const startStop = (i: number) => { const s = stops[i]; const b = BUILDINGS.find(b => b.id === s.id)!; go({ k: 'lesson', s: { title: `Rounds · ${b.name}`, ids: s.items, stop: s.id } }); };
  const route = 'M85 205C140 250 220 250 278 205M278 222C300 300 300 330 278 370M278 380C220 440 140 440 85 380';
  const bpos = next === -1 ? BUILDINGS[3] : BUILDINGS[next];
  return <div className="screen">
    <TopBar st={st} />
    <div className="hdr"><div><div className="eyebrow">HOME · TOWN SQUARE</div><h1>UBE Capital</h1></div><div className="ng">✨ NEXTGEN</div></div>
    <div className="town">
      <svg viewBox="0 95 362 480" dangerouslySetInnerHTML={{ __html: TOWN_INNER +
        `<path d="${route}" stroke="#ff7a1a" stroke-width="3.5" stroke-dasharray="1 7" stroke-linecap="round" fill="none"/>` +
        BUILDINGS.map((b, i) => `<g transform="translate(${b.mx} ${b.my})"><circle r="11" fill="${stops[i].done ? '#3bb273' : i === next ? '#ff7a1a' : '#b9a78f'}" stroke="#fff" stroke-width="2.5"/><text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">${stops[i].done ? '✓' : i + 1}</text></g>`).join('') }} />
      {BUILDINGS.map((b, i) => <button key={b.id} className="bldg" data-testid={`bldg-${b.id}`} style={{ left: `${(b.x / 362) * 100}%`, top: `${((b.y + 28 - 95) / 480) * 100}%` }}
        onClick={() => go({ k: 'lesson', s: { title: `Free play · ${b.name}`, ids: freePlay(st, b.id) } })}>
        <b>{stops[i].done ? '✓ ' : ''}{b.name}</b><span>{b.sub}</span></button>)}
      <div className="walker" style={{ left: `${(bpos.mx / 362) * 100}%`, top: `${((bpos.my - 95) / 480) * 100}%` }}><Bailey size={46} cls="bob" /></div>
    </div>
    <div className="rounds card">
      <div className="row"><b>📋 Today's Rounds</b><span className="muted">{doneN}/4 stops · +20 XP & stamp</span></div>
      <div className="prog"><i style={{ width: `${doneN * 25}%` }} /></div>
      {next !== -1 && <button className="btn" data-testid="start-round" onClick={() => startStop(next)}>{doneN ? 'CONTINUE' : 'START'} ROUNDS · STOP {next + 1}: {BUILDINGS[next].name.toUpperCase()}</button>}
      <div className="speech"><Bailey size={44} /><div className="bub">{next === -1 ? 'Rounds complete! The rest of town is open. Practice anything, as long as you like.' : line}</div></div>
      <p className="muted small">Tap any building for free play. Free play earns XP; the daily round keeps your streak.</p>
    </div>
  </div>;
}

function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - .5); }

function Lesson({ session, st, setSt, onExit, onDone }: { session: Session; st: State; setSt: React.Dispatch<React.SetStateAction<State>>; onExit: () => void; onDone: (r: { xp: number; right: number; total: number; roundBonus: boolean; newStreak: boolean }) => void }) {
  const [queue, setQueue] = useState<string[]>(session.ids);
  const [idx, setIdx] = useState(0);
  const [misses, setMisses] = useState<string[]>([]);
  const [rematch, setRematch] = useState(false);
  const [fb, setFb] = useState<null | { ok: boolean; text: string; why?: string; xp: number }>(null);
  const [earned, setEarned] = useState(0);
  const [right, setRight] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const item = byId(queue[idx]);
  const quizTotal = session.ids.filter(id => byId(id).type !== 'rule_card').length;

  const answer = (ok: boolean, why?: string) => {
    if (fb) return;
    const bonus = rematch && ok ? 5 : 0;
    const xp = ok ? item.xp + bonus : 0;
    setSt(s => addXp(grade(s, item.id, ok), xp));
    setEarned(e => e + xp);
    if (ok && !rematch) setRight(r => r + 1);
    if (!ok && !rematch) setMisses(m => [...m, item.id]);
    setFb({ ok, text: say(ok ? 'right' : 'wrong'), why: why ?? item.explanation, xp });
  };
  const advance = () => {
    setFb(null);
    if (idx + 1 < queue.length) { setIdx(idx + 1); if (byId(queue[idx + 1]).type === 'boss') setBanner(say('boss')); return; }
    if (!rematch && misses.length) { setRematch(true); setQueue(misses); setIdx(0); setBanner(say('rematch')); return; }
    finish();
  };
  const finish = () => {
    const clean = misses.length === 0 && quizTotal > 0;
    let bonusXp = clean ? 10 : 0, roundBonus = false;
    let s = st;
    if (session.stop && s.round) {
      const stops = s.round.stops.map(x => x.id === session.stop ? { ...x, done: true } : x);
      s = { ...s, round: { ...s.round, stops } };
      if (stops.every(x => x.done) && !s.round!.bonus) {
        roundBonus = true;
        const y = new Date(); y.setDate(y.getDate() - 1);
        const cont = s.lastRoundDay === today(y);
        s = { ...s, round: { ...s.round!, bonus: true }, streak: cont ? s.streak + 1 : (s.lastRoundDay === today() ? s.streak : 1), lastRoundDay: today(), stamps: [...new Set([...s.stamps, today()])] };
        s = addXp(s, 20); bonusXp += 20;
      }
    }
    if (clean) s = addXp(s, 10);
    setSt(s);
    onDone({ xp: earned + bonusXp, right, total: quizTotal, roundBonus, newStreak: roundBonus });
  };

  const pct = ((idx + (fb ? 1 : 0)) / queue.length) * 100;
  return <div className={`screen lesson ${item.type === 'boss' ? 'bossbg' : ''}`}>
    <div className="lhead"><button className="x" onClick={onExit} aria-label="Exit">✕</button><div className="prog"><i style={{ width: `${pct}%` }} /></div><span className="muted small">{rematch ? 'Rematch' : `${idx + 1}/${queue.length}`}</span></div>
    <div className="eyebrow pad">{session.title}{rematch ? ' · REMATCH (+5 XP each)' : ''}</div>
    {banner && <div className="banner" onAnimationEnd={() => setBanner(null)}><Gil size={50} /> {banner}</div>}
    <div className="body">
      {item.type === 'rule_card' && <RuleCard item={item} onNext={() => { setSt(s => addXp(grade(s, item.id, true), item.xp)); setEarned(e => e + item.xp); advance(); }} />}
      {item.type === 'fill_blank' && <FillBlank key={item.id + rematch} item={item} locked={!!fb} onAnswer={answer} />}
      {(item.type === 'mcq' || item.type === 'boss') && <Mcq key={item.id + rematch} item={item} locked={!!fb} onAnswer={answer} />}
      {item.type === 'true_false' && <TrueFalse key={item.id + rematch} item={item} locked={!!fb} onAnswer={answer} />}
    </div>
    {fb && <Feedback fb={fb} onNext={advance} />}
  </div>;
}

function RuleCard({ item, onNext }: any) {
  return <div className="card rule">
    <div className="eyebrow">📜 RULE CARD · {item.rule_refs.join(', ')}</div>
    <h2>{item.title}</h2><p>{item.rule}</p>
    {item.hook && <div className="hook">🧠 {item.hook}</div>}
    {item.tip && <div className="speech"><Bailey size={44} /><div className="bub">{item.tip}</div></div>}
    <button className="btn" data-testid="got-it" onClick={onNext}>GOT IT</button>
  </div>;
}

function FillBlank({ item, locked, onAnswer }: any) {
  const blanks = item.blanks as any[];
  const [vals, setVals] = useState<string[]>([]);
  const cur = vals.length;
  const opts = useMemo(() => blanks.map(b => shuffle(b.choices as string[])), [item.id]);
  const parts = (item.prompt as string).split('___');
  const pick = (c: string) => { if (locked || cur >= blanks.length) return; const v = [...vals, c]; setVals(v); if (v.length === blanks.length) { const ok = v.every((x, i) => [blanks[i].answer, ...(blanks[i].accept || [])].map((s: string) => s.toLowerCase()).includes(x.toLowerCase())); onAnswer(ok, ok ? item.explanation : `Answer: ${blanks.map(b => b.answer).join(' / ')}. ${item.explanation}`); } };
  return <div className="card">
    <div className="eyebrow">✏️ FILL IN THE RULE · {item.rule_refs.join(', ')}</div>
    <p className="prompt">{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <span className={`blank ${i === cur ? 'cur' : ''}`}>{vals[i] ?? '\u00a0\u00a0\u00a0\u00a0\u00a0'}</span>}</span>)}</p>
    {cur < blanks.length && <div className="chips">{opts[cur].map(c => <button key={c} className="chip" onClick={() => pick(c)}>{c}</button>)}</div>}
    {cur > 0 && !locked && <button className="link" onClick={() => setVals([])}>Undo</button>}
  </div>;
}

function Mcq({ item, locked, onAnswer }: any) {
  const [sel, setSel] = useState<string | null>(null);
  const boss = item.type === 'boss';
  return <div className={`card ${boss ? 'boss' : ''}`}>
    <div className="eyebrow">{boss ? '👑 BOSS BATTLE · ' : '⚖️ MBE-STYLE · '}{item.rule_refs.join(', ')}</div>
    {boss && <div className="gilrow"><Gil size={56} cls="wobble" /><span>Gil presides. Worth {item.xp} XP.</span></div>}
    <p className="stem">{item.stem}</p><p className="q">{item.question}</p>
    {item.options.map((o: any) => {
      const st = locked ? (o.key === item.answer ? 'right' : o.key === sel ? 'wrong' : '') : sel === o.key ? 'sel' : '';
      return <button key={o.key} className={`opt ${st}`} data-testid={`opt-${o.key}`} onClick={() => !locked && setSel(o.key)}><b>{o.key}</b><span>{o.text}{locked && o.key === sel && o.why_wrong && <em>{o.why_wrong}</em>}</span></button>;
    })}
    {!locked && <button className="btn" data-testid="check" disabled={!sel} onClick={() => onAnswer(sel === item.answer)}>CHECK</button>}
  </div>;
}

function TrueFalse({ item, locked, onAnswer }: any) {
  const lim = item.time_limit_sec || 8;
  const [left, setLeft] = useState<number>(lim);
  const done = useRef(false);
  useEffect(() => {
    if (locked) return;
    const t = setInterval(() => setLeft(l => { if (l <= 0.1) { clearInterval(t); if (!done.current) { done.current = true; onAnswer(false, `Time's up! The answer is ${item.answer ? 'TRUE' : 'FALSE'}. ${item.explanation}`); } return 0; } return l - 0.1; }), 100);
    return () => clearInterval(t);
  }, [locked]);
  const a = (v: boolean) => { if (done.current) return; done.current = true; onAnswer(v === item.answer, `${item.answer ? 'TRUE' : 'FALSE'}. ${item.explanation}`); };
  return <div className="card">
    <div className="eyebrow">⏱️ SPEED ROUND · {lim}s</div>
    <div className="timer"><i style={{ width: `${(left / lim) * 100}%`, background: left < 3 ? '#e5484d' : '#3bb273' }} /></div>
    <p className="prompt big">{item.prompt}</p>
    <div className="tf"><button className="btn" data-testid="tf-true" disabled={locked} onClick={() => a(true)}>TRUE</button><button className="btn red" data-testid="tf-false" disabled={locked} onClick={() => a(false)}>FALSE</button></div>
  </div>;
}

function Feedback({ fb, onNext }: any) {
  useEffect(() => { if (fb.ok && navigator.vibrate) navigator.vibrate(40); }, []);
  return <>{fb.ok && <div className="stampwrap"><div className="stampbox"><Gil size={84} cls="slam" /><div className="stamp">SUSTAINED!</div></div></div>}
  <div className={`fb ${fb.ok ? 'ok' : 'no'}`} data-testid="feedback">
    <div className="fbhead">{fb.ok ? <>✅ Correct <span className="xpchip">+{fb.xp} XP</span></> : <>🐾 Not quite. It'll come back in your rematch.</>}</div>
    <div className="speech"><Bailey size={40} /><div className="bub">{fb.text}</div></div>
    {fb.why && <p className="why">{fb.why}</p>}
    <button className={`btn ${fb.ok ? '' : 'amber'}`} data-testid="continue" onClick={onNext}>CONTINUE</button>
  </div></>;
}

function Done({ d, st, go }: any) {
  const line = useMemo(() => say(d.roundBonus ? 'roundDone' : 'done'), []);
  return <div className="screen done">
    <Bailey size={120} cls="bob" />
    <h1>{d.roundBonus ? 'Rounds complete!' : 'Lesson complete!'}</h1>
    <div className="bub">{line}</div>
    <div className="stats"><div><b>+{d.xp}</b><span>XP earned</span></div><div><b>{d.total ? Math.round((d.right / d.total) * 100) : 100}%</b><span>first-try</span></div><div><b>🔥 {st.streak}</b><span>streak</span></div></div>
    {d.right === d.total && d.total > 0 && <div className="pill">✨ Clean run bonus +10 XP</div>}
    {d.roundBonus && <div className="passport"><div className="pstamp">🐾<br />ROUNDS<br />{today()}</div><span>Daily stamp earned · +20 XP</span></div>}
    <button className="btn" data-testid="done-continue" onClick={() => go({ k: 'home' })}>BACK TO TOWN</button>
  </div>;
}

const CAPITALS = [['sd', 'Pierre, SD'], ['al', 'Montgomery, AL'], ['tx', 'Austin, TX'], ['ca', 'Sacramento, CA'], ['fl', 'Tallahassee, FL']];
function TravelMap({ st, setSt }: { st: State; setSt: React.Dispatch<React.SetStateAction<State>> }) {
  return <div className="screen">
    <TopBar st={st} />
    <div className="hdr"><div><div className="eyebrow">TRAVEL MAP</div><h1>Bar City Station</h1></div></div>
    <div className="mapsvg" dangerouslySetInnerHTML={{ __html: MAP_SVG }} />
    <div className="speech pad"><Bailey size={44} /><div className="bub">{say('map')}</div></div>
    <div className="card"><div className="row"><b>🏛️ UBE Capital</b><span className="tag ok">OPEN · NEXTGEN</span></div><p className="muted small">{LESSON.title} · {ITEMS.length} items</p></div>
    {CAPITALS.map(([id, n]) => <div className="card row" key={id}><div><b>🚧 {n}</b><div className="muted small">State pack · coming soon</div></div>
      <button className={`chip ${st.notify.includes(id) ? 'on' : ''}`} data-testid={`notify-${id}`} onClick={() => setSt(s => ({ ...s, notify: s.notify.includes(id) ? s.notify.filter(x => x !== id) : [...s.notify, id] }))}>{st.notify.includes(id) ? '🔔 On list' : 'Notify me'}</button></div>)}
    <p className="muted small pad">"Notify me" is saved on this phone only for now.</p>
  </div>;
}

function Me({ st, onReset }: { st: State; onReset: () => void }) {
  const r = rank(st.xp);
  const cards = Object.values(st.cards);
  return <div className="screen">
    <TopBar st={st} />
    <div className="card center"><Bailey size={90} /><h2>Rank: {r.name}</h2>
      {r.next && <><div className="prog"><i style={{ width: `${((st.xp - r.floor) / (r.next - r.floor)) * 100}%` }} /></div><p className="muted small">{r.next - st.xp} XP to next rank</p></>}</div>
    <div className="card"><div className="stats"><div><b>{st.xp}</b><span>total XP</span></div><div><b>{st.streak}</b><span>day streak</span></div><div><b>{st.stamps.length}</b><span>stamps</span></div></div>
      <p className="muted small">Mastered (box 4+): {cards.filter(c => c.box >= 4).length} · Learning: {cards.filter(c => c.box < 4).length} · Unseen: {ITEMS.length - cards.length}</p></div>
    <div className="card"><b>🛂 Passport</b><div className="stamps">{st.stamps.length ? st.stamps.map(s => <div key={s} className="pstamp sm">🐾<br />{s.slice(5)}</div>) : <span className="muted small">Finish Today's Rounds to earn your first stamp.</span>}</div></div>
    <button className="btn red" data-testid="reset" onClick={onReset}>RESET PROGRESS</button>
    <p className="muted small pad">Test build · progress is stored on this device only.</p>
  </div>;
}
