import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';

// --- DATA & CONSTANTS ---
const EV = { Earnings: 30, Regulatory: 205, Product: 150, Management: 275, Macro: 340 };
const cls = { Positive: 'pos', Negative: 'neg', Neutral: 'neu' };
const VIEWS = [['dash', 'Dashboard'], ['news', 'News feed'], ['ai', 'AI summary'], ['model', 'Model comparison'], ['corr', 'Correlation'], ['about', 'How it works']];

const FE = [
  ['Event tagging', 'Every headline is sorted into Earnings, Regulatory, Product, Management or Macro news.', ['#6366F1', '#06B6D4']],
  ['Two sentiment models', 'FinBERT and a general model score each headline, so you can see which one to trust.', ['#06B6D4', '#10B981']],
  ['AI market briefing', 'Generate a short plain-English summary of what is driving a company today.', ['#10B981', '#84CC16']],
  ['Price correlation', 'See how tone lines up with price on the same day, next day, 3 days and 5 days.', ['#8B5CF6', '#6366F1']]
];

const EVR = [
  ['Earnings', 'Moves the price fastest, usually within a day.'],
  ['Regulatory', 'Builds slower, often visible by day 3.'],
  ['Product', 'A mild, short-lived lift.'],
  ['Management', 'Sharp but brief, depends on the role.'],
  ['Macro', 'Rarely moves a single company.']
];

const LS = [
  ['Collect', 'News headlines and daily prices are merged by date and ticker.'],
  ['Tag', 'Each headline gets an event type.'],
  ['Score', 'FinBERT and a general model rate the tone.'],
  ['Test', 'Tone is compared with price moves at four horizons.']
];

const ST = [
  ['Collect data', 'NewsAPI headlines and yfinance prices merged by date and ticker'],
  ['Classify events', 'Zero-shot model tags Earnings, Regulatory, Product, Management or Macro'],
  ['Score sentiment twice', 'FinBERT and a general model each give a label and confidence'],
  ['Compare models', "Cohen's Kappa, accuracy and disagreement review on labelled headlines"],
  ['Write the briefing', 'An LLM turns event-tagged headlines into a plain-English summary'],
  ['Test the link to price', 'Correlation at same-day, next-day, 3-day and 5-day horizons']
];

const BASE_NEWS = [
  ['TCS', 'Earnings', 'TCS Q2 profit beats estimates as deal wins hit record', 'Positive', .94, 'Positive', .81, 'Today 09:10'],
  ['TCS', 'Management', 'TCS names new head of cloud business after senior exit', 'Neutral', .77, 'Negative', .58, 'Today 08:40'],
  ['TCS', 'Macro', 'IT stocks steady as rupee weakens against dollar', 'Neutral', .71, 'Neutral', .66, 'Yesterday'],
  ['Reliance', 'Regulatory', 'SEBI seeks clarification from Reliance on related-party deals', 'Negative', .88, 'Negative', .74, 'Today 10:05'],
  ['Reliance', 'Earnings', 'Reliance retail losses narrowed in the latest quarter', 'Positive', .86, 'Negative', .61, 'Today 09:30'],
  ['Reliance', 'Product', 'Jio unveils low-cost AI service bundle for home users', 'Positive', .83, 'Positive', .79, 'Yesterday'],
  ['Apple', 'Product', 'Apple launches new iPhone lineup with on-device AI features', 'Positive', .91, 'Positive', .88, 'Today 07:55'],
  ['Apple', 'Regulatory', 'EU fines Apple over App Store payment rules', 'Negative', .93, 'Negative', .85, 'Today 06:20'],
  ['Apple', 'Earnings', 'Apple services revenue tops forecasts despite flat hardware sales', 'Positive', .89, 'Neutral', .52, 'Yesterday'],
  ['Tesla', 'Management', 'Tesla finance chief to step down after four years', 'Negative', .79, 'Negative', .7, 'Today 11:15'],
  ['Tesla', 'Product', 'Tesla delays cheaper model, sparking demand worries', 'Negative', .84, 'Negative', .76, 'Today 09:45'],
  ['Tesla', 'Earnings', 'Tesla deliveries beat low expectations in third quarter', 'Positive', .87, 'Neutral', .55, 'Yesterday']
];

const CO = {
  TCS: { s: 'TCS', n: 'Tata Consultancy Services', p: '₹3,892.40', c: 1.2, m: 'India' },
  Infosys: { s: 'INFY', n: 'Infosys Ltd.', p: '₹1,764.25', c: 0.4, m: 'India' },
  Reliance: { s: 'RELIANCE', n: 'Reliance Industries', p: '₹2,945.10', c: -0.6, m: 'India' },
  'HDFC Bank': { s: 'HDFCBANK', n: 'HDFC Bank Ltd.', p: '₹1,688.70', c: 0.3, m: 'India' },
  'ICICI Bank': { s: 'ICICIBANK', n: 'ICICI Bank Ltd.', p: '₹1,245.90', c: 0.9, m: 'India' },
  'Tata Motors': { s: 'TATAMOTORS', n: 'Tata Motors Ltd.', p: '₹962.35', c: -1.1, m: 'India' },
  Apple: { s: 'AAPL', n: 'Apple Inc.', p: '$231.85', c: 0.8, m: 'US' },
  Microsoft: { s: 'MSFT', n: 'Microsoft Corp.', p: '$428.10', c: 0.5, m: 'US' },
  Nvidia: { s: 'NVDA', n: 'NVIDIA Corp.', p: '$134.60', c: 2.3, m: 'US' },
  Tesla: { s: 'TSLA', n: 'Tesla Inc.', p: '$248.30', c: -1.9, m: 'US' },
  Amazon: { s: 'AMZN', n: 'Amazon.com Inc.', p: '$189.40', c: -0.2, m: 'US' },
  Alphabet: { s: 'GOOGL', n: 'Alphabet Inc.', p: '$171.25', c: 0.6, m: 'US' }
};

const TP = {
  Earnings: [['{c} Q2 profit beats estimates on strong demand', 'Positive', .9, 'Positive', .8], ['{c} quarterly losses narrowed from a year earlier', 'Positive', .86, 'Negative', .6], ['{c} revenue misses analyst forecasts as growth slows', 'Negative', .88, 'Negative', .74], ['{c} raises full-year guidance after a strong quarter', 'Positive', .92, 'Positive', .85]],
  Regulatory: [['Regulator opens inquiry into {c} disclosures', 'Negative', .87, 'Negative', .72], ['{c} wins approval for its expansion plan', 'Positive', .84, 'Positive', .7], ['{c} fined over compliance lapses', 'Negative', .91, 'Negative', .8]],
  Product: [['{c} unveils new AI-powered product line', 'Positive', .9, 'Positive', .82], ['{c} delays flagship launch amid supply issues', 'Negative', .83, 'Negative', .7], ['{c} launches lower-priced plan to win new customers', 'Positive', .78, 'Neutral', .55]],
  Management: [['{c} names new chief executive after leadership review', 'Neutral', .74, 'Positive', .57], ['{c} finance chief to step down after four years', 'Negative', .79, 'Negative', .66], ['{c} appoints new head of international business', 'Neutral', .72, 'Neutral', .64]],
  Macro: [['Rate decision leaves {c} and its sector steady', 'Neutral', .73, 'Neutral', .68], ['Currency swings weigh on {c} export outlook', 'Negative', .77, 'Neutral', .52]]
};

const BRIEF = {
  TCS: 'Positive earnings news led the day for TCS, with record deal wins outweighing a leadership change in cloud. Macro headlines were quiet. Expect the earnings tone to matter most over the next day.',
  Reliance: 'Reliance faced a regulatory question from SEBI, which weighed on tone, while narrowing retail losses and a new Jio product gave balancing positives. Mixed picture overall.',
  Apple: 'Product launches and strong services revenue lifted sentiment for Apple, partly offset by an EU fine. Net tone is moderately positive.',
  Tesla: 'Tesla headlines leaned negative today: a finance chief exit and a delayed cheaper model. A delivery beat from yesterday offers limited support.'
};

function rng(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const HAND = new Set(BASE_NEWS.map(n => n[0]));
const NEWS = [...BASE_NEWS];
Object.keys(CO).filter(k => !HAND.has(k)).forEach((k, ki) => {
  const r = rng(ki * 131 + 17);
  Object.keys(TP).filter((e, j) => j < 3 || r() > .5).slice(0, 4).forEach((e, j) => {
    const p = TP[e][Math.floor(r() * TP[e].length)];
    NEWS.push([k, e, p[0].replace('{c}', k), p[1], p[2], p[3], p[4], j < 2 ? 'Today 0' + (8 + j) + ':' + (10 + ki * 4) : 'Yesterday']);
  });
});
const T_KEYS = Object.keys(CO);
const score = n => ({ Positive: 1, Negative: -1, Neutral: 0 }[n[3]] * n[4]);

function series(t) {
  const r = rng([...t].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483000 + 11);
  let p = 100; const out = [];
  for (let i = 0; i < 30; i++) {
    const s = (r() - .5) * 1.7;
    p *= 1 + (r() - .5) * .025 + s * .008;
    out.push({ p, s });
  }
  return out;
}

// --- UTILITY COMPONENTS ---
const EvChip = ({ e }) => <span className="chip" style={{ background: `hsl(${EV[e]} 70% 50% / .16)`, color: `hsl(${EV[e]} 65% 45%)` }}>{e}</span>;
const SChip = ({ l, c }) => <span className={`chip text-${cls[l]}`} style={{ background: `color-mix(in srgb, var(--${cls[l]}) 15%, transparent)` }}>{l} {Math.round(c * 100)}%</span>;

const LogoIcon = () => (
  <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="lgx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366F1"/><stop offset=".55" stopColor="#06B6D4"/><stop offset="1" stopColor="#10B981"/></linearGradient></defs>
    <rect width="40" height="40" rx="12" fill="url(#lgx)"/>
    <path d="M10 31h12M10 26h7" stroke="#fff" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M10 22l7-7 5 4 9-9M25 10h6v6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- DASHBOARD TABS ---
const TabDash = ({ cur, items, onGoAI }) => {
  const avg = items.reduce((a, n) => a + score(n), 0) / items.length;
  const lab = avg > .15 ? 'Positive' : avg < -.15 ? 'Negative' : 'Neutral';
  
  const d = useMemo(() => series(cur), [cur]);
  const W = 720, H = 270;
  const mn = Math.min(...d.map(x => x.p));
  const mx = Math.max(...d.map(x => x.p));
  const x = i => 20 + i * (W - 40) / 29;
  const y = p => 10 + (1 - (p - mn) / (mx - mn)) * 150;
  
  const linePath = d.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q.p).toFixed(1)).join(' ');
  const bars = d.map((q, i) => {
    const h = Math.abs(q.s) * 34;
    return <rect key={i} x={x(i) - 5} y={q.s >= 0 ? 228 - h : 228} width="10" height={h.toFixed(1)} rx="2" fill={`var(--${q.s >= 0 ? 'pos' : 'neg'})`} opacity=".8" />
  });

  const cnt = {}; items.forEach(n => cnt[n[1]] = (cnt[n[1]] || 0) + 1);
  const P = items.filter(n => n[3] === 'Positive');
  const N = items.filter(n => n[3] === 'Negative');
  const autoBriefStr = `${cur} has ${items.length} tagged headlines today. ${P.length ? 'Positive: ' + P[0][2] + '. ' : ''}${N.length ? 'Negative: ' + N[0][2] + '. ' : ''}Net tone is ${avg > .15 ? 'positive' : avg < -.15 ? 'negative' : 'mixed'}.`;
  
  return (
    <div className="view on">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><p className="text-sm text-mute">Headlines today</p><p className="fd mt-1 text-2xl font-bold">{items.length}</p><p className="text-xs text-mute">from NewsAPI</p></div>
        <div className="card p-4"><p className="text-sm text-mute">Average sentiment</p><p className={`fd mt-1 text-2xl font-bold text-${cls[lab]}`}>{(avg >= 0 ? '+' : '') + avg.toFixed(2)}</p><p className="text-xs text-mute">{lab}</p></div>
        <div className="card p-4"><p className="text-sm text-mute">Model agreement</p><p className="fd mt-1 text-2xl font-bold">71%</p><p className="text-xs text-mute">FinBERT vs general</p></div>
        <div className="card p-4"><p className="text-sm text-mute">Strongest horizon</p><p className="fd mt-1 text-2xl font-bold">Next day</p><p className="text-xs text-mute">r = 0.42, Earnings</p></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Price and daily sentiment, last 30 days</h2><span className="text-xs text-mute">Line: price. Bars: sentiment</span></div>
          <div className="mt-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              <path d={`${linePath} L${x(29)} 170 L${x(0)} 170Z`} fill="var(--acc)" opacity=".1"/>
              <path d={linePath} fill="none" stroke="var(--acc)" strokeWidth="2.5" strokeLinejoin="round"/>
              <line x1="20" x2={W-20} y1="228" y2="228" stroke="var(--line)"/>
              {bars}
              <text x="20" y="262" fill="var(--mute)" fontSize="11">30 days ago</text>
              <text x={W-20} y="262" fill="var(--mute)" fontSize="11" textAnchor="end">Today</text>
            </svg>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">AI market briefing</h2>
          <p className="mt-1 text-xs text-mute">Written by an LLM from today's event-tagged headlines</p>
          <p className="mt-3 text-[15px] leading-relaxed">{BRIEF[cur] || autoBriefStr}</p>
          <button className="grad mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white" onClick={onGoAI}>Generate AI summary</button>
          <div className="mt-4 border-t border-line pt-3">
            <h3 className="text-sm font-semibold">Event mix</h3>
            <div className="mt-2 space-y-2">
              {Object.entries(cnt).map(([e, c]) => (
                <div key={e} className="flex items-center gap-2 text-sm">
                  <span className="w-24"><EvChip e={e} /></span>
                  <span className="h-2 rounded-full" style={{ width: `${(c / items.length) * 100}%`, background: `hsl(${EV[e]} 70% 55%)` }}></span>
                  <span className="text-mute">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabNews = ({ items }) => {
  const [evSel, setEvSel] = useState('All');
  const evs = ['All', ...Object.keys(EV)];
  const l = items.filter(n => evSel === 'All' || n[1] === evSel);
  return (
    <div className="view on">
      <div className="mb-4 flex flex-wrap gap-2">
        {evs.map(e => <button key={e} className="pill" aria-pressed={e === evSel} onClick={() => setEvSel(e)}>{e}</button>)}
      </div>
      <div className="grid gap-3">
        {l.length ? l.map((n, idx) => (
          <article key={idx} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><EvChip e={n[1]} /><span className="text-xs text-mute">{n[7]}</span></div>
              <h3 className="mt-1 font-medium">{n[2]}</h3>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs text-mute">
              <span>FinBERT <SChip l={n[3]} c={n[4]} /></span>
              <span>General <SChip l={n[5]} c={n[6]} /></span>
            </div>
          </article>
        )) : <p className="card p-5 text-mute">No headlines for this event type. Pick another filter.</p>}
      </div>
    </div>
  );
};

const TabModel = () => {
  const bar = (n, v, c) => (
    <div key={n}>
      <div className="flex justify-between text-sm"><span>{n}</span><b>{v}%</b></div>
      <div className="mt-1 h-2.5 rounded-full bg-line"><div className="h-2.5 rounded-full" style={{ width: `${v}%`, background: c }}></div></div>
    </div>
  );
  return (
    <div className="view on">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-mute">Agreement between models</p><p className="fd mt-1 text-4xl font-bold">71%</p><p className="mt-1 text-sm text-mute">Cohen's Kappa 0.54, moderate agreement</p></div>
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">Accuracy and confidence on the hand-labelled set</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3"><p className="text-sm font-semibold">Accuracy</p>{bar('FinBERT', 84, 'var(--acc)')}{bar('General model', 67, 'var(--neu)')}</div>
            <div className="space-y-3"><p className="text-sm font-semibold">Average confidence</p>{bar('FinBERT', 86, 'var(--acc)')}{bar('General model', 69, 'var(--neu)')}</div>
          </div>
        </div>
      </div>
      <div className="card mt-4 p-5">
        <h2 className="font-semibold">Where the models disagree</h2>
        <p className="text-sm text-mute">Finance wording flips everyday meaning, so a general model often misses the point.</p>
        <div className="scroll-x mt-3">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-mute"><tr><th className="py-2 pr-3">Headline</th><th className="pr-3">Language type</th><th className="pr-3">FinBERT</th><th>General model</th></tr></thead>
            <tbody>
              {NEWS.filter(n => n[3] !== n[5]).map((n, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-2 pr-3 text-ink">{n[2]}</td>
                  <td className="pr-3 text-mute">{/loss|beat|top|tops/i.test(n[2]) ? 'Finance wording' : 'Mixed tone'}</td>
                  <td className="pr-3"><SChip l={n[3]} c={n[4]} /></td>
                  <td><SChip l={n[5]} c={n[6]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TabCorr = () => {
  const H = [['All events',[.21,.34,.29,.18]],['Earnings',[.38,.42,.35,.24]],['Regulatory',[.12,.27,.31,.2]],['Product',[.18,.22,.16,.09]],['Management',[.09,.15,.12,.06]],['Macro / Other',[.03,.05,.02,-.02]]];
  const cell = (v, i) => {
    const a = Math.min(Math.abs(v) * 1.6, .9);
    return <div key={i} className="rounded-lg py-3 text-center text-sm font-semibold text-ink" style={{ background: `color-mix(in srgb, var(--${v >= 0 ? 'pos' : 'neg'}) ${Math.round(a * 100)}%, var(--card))`, border: '1px solid var(--line)' }}>{v.toFixed(2)}</div>;
  };
  return (
    <div className="view on">
      <div className="card p-5">
        <h2 className="font-semibold">Does sentiment move the price? Correlation by event and horizon</h2>
        <p className="text-sm text-mute">Each cell is the Pearson correlation between daily sentiment and the percentage price change.</p>
        <div className="scroll-x mt-4">
          <div className="grid min-w-[520px] gap-1.5" style={{ gridTemplateColumns: '150px repeat(4, 1fr)' }}>
             <div></div>{['Same day','Next day','3 day','5 day'].map(h => <div key={h} className="text-center text-sm text-mute">{h}</div>)}
             {H.map((r, i) => (
               <React.Fragment key={i}>
                 <div className="self-center text-sm font-medium">{r[0]}</div>
                 {r[1].map((v, idx) => cell(v, idx))}
               </React.Fragment>
             ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-mute">
          <span>Negative</span><span className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, var(--neg), var(--line), var(--pos))' }}></span><span>Positive</span>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><h3 className="font-semibold">Strongest horizon</h3><p className="mt-1 text-sm text-mute">Next-day returns show the clearest link for Earnings news in this sample.</p></div>
        <div className="card p-5"><h3 className="font-semibold">Weakest signal</h3><p className="mt-1 text-sm text-mute">Macroeconomic news barely moves single-company prices over any horizon.</p></div>
      </div>
    </div>
  );
};

const TabAI = ({ cur, items }) => {
  const [per, setPer] = useState(0);
  const [sty, setSty] = useState(0);
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState(0);
  const [typedTxt, setTypedTxt] = useState('');
  
  const PER = ['Today', 'Last 3 days', 'This week'];
  const STY = ['Simple', 'Analyst'];
  
  useEffect(() => { setStatus('idle'); }, [cur, per, sty]);

  const handleGen = () => {
    setStatus('generating'); setStep(0);
    const st = ['Reading ' + items.length + ' headlines', 'Grouping by event type', 'Comparing both sentiment models', 'Writing the briefing'];
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= st.length) { clearInterval(t); setStatus('generated'); typeText(); } else setStep(i);
    }, 600);
  };

  const typeText = () => {
    const avg = items.reduce((a, n) => a + score(n), 0) / items.length;
    const lab = avg > .15 ? 'Positive' : avg < -.15 ? 'Negative' : 'Neutral';
    const ag = items.filter(n => n[3] === n[5]).length;
    const when = ['today', 'over the last 3 days', 'this week'][per];
    const lead = lab === 'Positive' ? 'leaned positive' : lab === 'Negative' ? 'leaned negative' : 'was mixed';
    const P = items.filter(n => n[3] === 'Positive');
    const N = items.filter(n => n[3] === 'Negative');
    
    const txt = sty === 0 
      ? `News about ${CO[cur].n} ${when} ${lead}. ${P.length ? 'On the good side: ' + P[0][2] + '. ' : ''}${N.length ? 'On the worry side: ' + N[0][2] + '. ' : ''}Earlier results suggest price reacts more clearly to earnings news than to other types, so watch that first.`
      : `Net FinBERT sentiment is ${avg >= 0 ? '+' : ''}${avg.toFixed(2)} across ${items.length} headlines ${when}. The two models agree on ${ag} of ${items.length}; disagreements cluster around finance-specific wording. In the sample, earnings (r 0.42) and regulatory items (r 0.27) show the strongest next-day link.`;
    
    setTypedTxt('');
    let i = 0;
    const t = setInterval(() => {
      i++; setTypedTxt(txt.slice(0, i));
      if (i >= txt.length) clearInterval(t);
    }, 14);
  };

  const W = { Earnings: 'Price reaction to the earnings tone tomorrow', Regulatory: 'Follow-up statements from the regulator within 3 days', Product: 'Early demand signals after the launch', Management: 'Who replaces the departing executive', Macro: 'Currency and rate moves that touch the sector' };
  const avg = items.reduce((a, n) => a + score(n), 0) / items.length;
  const lab = avg > .15 ? 'Positive' : avg < -.15 ? 'Negative' : 'Neutral';

  return (
    <div className="view on">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Generate AI summary</h2>
          <p className="text-sm text-mute">Turns the selected company's event-tagged headlines into a short briefing.</p>
          <p className="mt-4 text-sm font-medium">Company</p><p className="mt-1 text-sm text-mute">{CO[cur].n} ({cur}), chosen above</p>
          <p className="mt-4 text-sm font-medium">Time period</p>
          <div className="mt-2 flex flex-wrap gap-2">{PER.map((p, i) => <button key={p} className="pill" aria-pressed={i === per} onClick={() => setPer(i)}>{p}</button>)}</div>
          <p className="mt-4 text-sm font-medium">Reading level</p>
          <div className="mt-2 flex gap-2">{STY.map((p, i) => <button key={p} className="pill" aria-pressed={i === sty} onClick={() => setSty(i)}>{p}</button>)}</div>
          <button className="grad mt-6 w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60" disabled={status === 'generating'} onClick={handleGen}>Generate summary</button>
        </div>
        
        <div className="card p-5 lg:col-span-3">
          {status === 'idle' && (
            <div className="grid h-full min-h-[260px] place-items-center text-center text-mute">
              <div><p className="fd text-lg font-semibold text-ink">No summary yet</p><p className="mt-1 text-sm">Choose a time period and reading level, then select Generate summary.</p></div>
            </div>
          )}
          {status === 'generating' && (
            <div>
              <p className="fd font-semibold">Generating summary</p>
              <ul className="mt-3 space-y-2 text-sm">
                {['Reading ' + items.length + ' headlines', 'Grouping by event type', 'Comparing both sentiment models', 'Writing the briefing'].map((s, j) => (
                   <li key={j} className={j > step ? 'opacity-30' : ''}>{j < step ? 'Done: ' : j === step ? 'Now: ' : ''}{s}</li>
                ))}
              </ul>
            </div>
          )}
          {status === 'generated' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="fd text-lg font-semibold">{cur} briefing</h2>
                <span className={`chip text-${cls[lab]}`} style={{ background: `color-mix(in srgb, var(--${cls[lab]}) 15%, transparent)` }}>Overall {lab}</span>
              </div>
              <p className="text-xs text-mute">{PER[per]}, {STY[sty].toLowerCase()} style. Sample output made in your browser.</p>
              <p className="mt-4 leading-relaxed">{typedTxt}</p>
              <h3 className="mt-5 text-sm font-semibold">Key drivers</h3>
              <ul className="mt-2 space-y-2">
                {items.map((n, i) => <li key={i} className="flex flex-wrap items-center gap-2 text-sm"><EvChip e={n[1]}/><span>{n[2]}</span><SChip l={n[3]} c={n[4]}/></li>)}
              </ul>
              <h3 className="mt-5 text-sm font-semibold">What to watch</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-mute">
                {[...new Set(items.map(n => n[1]))].map((e, i) => <li key={i}>{W[e]}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabAbout = () => {
  return (
    <div className="view on">
      <div className="card p-6">
        <h2 className="font-semibold">How News2Market works</h2>
        <p className="text-sm text-mute">Six stages, each handing its output to the next.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ST.map((s, i) => (
            <li key={i} className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-acc text-sm font-bold text-white">{i + 1}</span>
                <h3 className="font-semibold">{s[0]}</h3>
              </div>
              <p className="mt-2 text-sm text-mute">{s[1]}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};


// --- EXTRACTED PAGE COMPONENTS ---

const Landing = ({ theme, toggleTheme, setAuthMode, setView }) => {
  const pt = T_KEYS.map((t, idx) => {
    const c = CO[t]; const u = c.c >= 0;
    return <span key={idx}><b>{t}</b> {c.p} <b className={`text-${u ? 'pos' : 'neg'}`}>{u ? '▲' : '▼'} {Math.abs(c.c)}%</b></span>
  });
  
  return (
    <div className="min-h-screen text-ink bg-bg">
      <div className="sticky z-20 border-b border-line bg-bg/85 backdrop-blur-md top-0">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5"><LogoIcon /><span className="fd text-lg font-bold text-ink">News<span className="gt">2</span>Market</span></div>
          <nav className="hidden gap-6 text-sm text-mute md:flex">
            <a href="#features" className="text-mute hover:text-ink">Features</a>
            <a href="#events" className="text-mute hover:text-ink">Event types</a>
            <a href="#how" className="text-mute hover:text-ink">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="themebtn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button className="pill" onClick={() => { setAuthMode('login'); setView('auth'); }}>Log in</button>
            <button className="grad rounded-full px-4 py-2 text-sm font-semibold text-white" onClick={() => { setAuthMode('signup'); setView('auth'); }}>Get started</button>
          </div>
        </header>
      </div>
      <div className="overflow-hidden border-b border-line py-2 text-sm"><div className="tape">{pt}{pt}{pt}{pt}</div></div>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div className="gridbg absolute inset-0 -z-10"></div>
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm text-mute"><span className="h-2 w-2 rounded-full bg-pos"></span>Tracking 12 leading Indian and US stocks</p>
          <h2 className="mt-5 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl text-ink">Measure how financial news moves stock prices</h2>
          <p className="mt-5 max-w-lg text-lg text-mute">News2Market tags every headline by event type, scores its tone with two AI models, and tests whether the price followed on the same day, next day, 3 days and 5 days.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="grad rounded-full px-6 py-3 font-semibold text-white shadow-lg" onClick={() => { setAuthMode('signup'); setView('auth'); }}>Create free account</button>
            <button className="pill !px-6 !py-3" onClick={() => { setAuthMode('login'); setView('auth'); }}>Log in</button>
          </div>
          
          <dl className="mt-10 grid max-w-md grid-cols-4 gap-3">
            <div><dt className="fd text-2xl font-bold">12</dt><dd className="text-xs text-mute">Companies</dd></div>
            <div><dt className="fd text-2xl font-bold">5</dt><dd className="text-xs text-mute">Event types</dd></div>
            <div><dt className="fd text-2xl font-bold">2</dt><dd className="text-xs text-mute">AI models</dd></div>
            <div><dt className="fd text-2xl font-bold">4</dt><dd className="text-xs text-mute">Time horizons</dd></div>
          </dl>
        </div>
        <div className="relative">
          <div className="grad absolute -inset-3 -z-10 rounded-[2rem] opacity-40 blur-2xl"></div>
          <div className="card p-5 shadow-xl">
            <div className="flex items-start justify-between"><div><p className="fd font-semibold text-ink">AAPL <span className="text-sm font-normal text-mute">Apple Inc.</span></p><p className="text-xs text-mute">Headlines pinned to the price</p></div><div className="text-right"><p className="fd text-xl font-bold text-ink">$231.85</p><p className="text-sm font-semibold text-pos">▲ 0.8%</p></div></div>
            <svg viewBox="0 0 520 280" className="mt-2 w-full">
              <defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stopColor="#6366F1"/><stop offset=".55" stopColor="#06B6D4"/><stop offset="1" stopColor="#10B981"/></linearGradient><linearGradient id="ha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06B6D4" stopOpacity=".3"/><stop offset="1" stopColor="#06B6D4" stopOpacity="0"/></linearGradient></defs>
              <g stroke="var(--line)"><path d="M0 70h520M0 140h520M0 210h520"/></g>
              <path className="area" d="M10 230L60 215L110 225L160 170L210 185L260 130L310 150L360 95L410 110L470 50V270H10Z" fill="url(#ha)"/>
              <path className="draw" pathLength="1" d="M10 230L60 215L110 225L160 170L210 185L260 130L310 150L360 95L410 110L470 50" fill="none" stroke="url(#hg)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
              <g className="pin" style={{animationDelay: '1.1s'}}><circle cx="160" cy="170" r="6" fill="var(--pos)"/><rect x="110" y="184" width="104" height="22" rx="11" fill="var(--card)" stroke="var(--pos)"/><text x="162" y="199" fontSize="11" textAnchor="middle" fill="var(--ink)">Earnings beat</text></g>
              <g className="pin" style={{animationDelay: '1.5s'}}><circle cx="310" cy="150" r="6" fill="var(--neg)"/><rect x="250" y="164" width="120" height="22" rx="11" fill="var(--card)" stroke="var(--neg)"/><text x="310" y="179" fontSize="11" textAnchor="middle" fill="var(--ink)">Regulatory query</text></g>
              <g className="pin" style={{animationDelay: '1.9s'}}><circle cx="470" cy="50" r="6" fill="var(--pos)"/><rect x="372" y="62" width="108" height="22" rx="11" fill="var(--card)" stroke="var(--pos)"/><text x="426" y="77" fontSize="11" textAnchor="middle" fill="var(--ink)">Product launch</text></g>
            </svg>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-mute mt-4"><div className="rounded-xl border border-line p-2">FinBERT<br/><b className="text-pos">Positive 89%</b></div><div className="rounded-xl border border-line p-2">Next-day move<br/><b className="text-pos">+2.4%</b></div><div className="rounded-xl border border-line p-2">Event type<br/><b className="text-ink">Earnings</b></div></div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold">Everything between the headline and the price</h2>
        <p className="mt-2 max-w-xl text-mute">Four tools in one dashboard, built so you can check every step instead of trusting one score.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FE.map((f, i) => (
            <div key={i} className="card p-5">
              <div className="h-1.5 w-12 rounded-full" style={{ background: `linear-gradient(90deg, ${f[2][0]}, ${f[2][1]})` }}></div>
              <h3 className="mt-4 font-semibold">{f[0]}</h3>
              <p className="mt-1 text-sm text-mute">{f[1]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold">Different news, different reactions</h2>
        <p className="mt-2 max-w-xl text-mute">An earnings beat and a regulatory fine are not the same signal, so each headline is tagged before it is scored.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {EVR.map((e, i) => (
            <div key={i} className="card p-4">
              <EvChip e={e[0]} />
              <p className="mt-3 text-sm text-mute">{e[1]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-bold">From headline to insight</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LS.map((s, i) => (
            <li key={i} className="card p-5">
              <span className="grad grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s[0]}</h3>
              <p className="mt-1 text-sm text-mute">{s[1]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grad rounded-3xl p-8 text-center text-white sm:p-14">
          <h2 className="text-3xl font-bold">Open the dashboard and see what moved your stock</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">Free to explore. No trading advice, just evidence.</p>
          <button className="mt-6 rounded-full bg-white px-7 py-3 font-semibold text-[#1e1b4b]" onClick={() => { setAuthMode('signup'); setView('auth'); }}>Get started</button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5"><LogoIcon /><span className="fd text-lg font-bold">News<span className="gt">2</span>Market</span></div>
            <p className="mt-3 max-w-sm text-sm text-mute">Financial news impact analysis using NLP and generative AI.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              <li>Dashboard</li><li>News feed</li><li>AI summary</li><li>Model comparison</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-mute">
              <li>Disclaimer</li><li>Privacy policy</li><li>Terms of use</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-mute sm:flex-row sm:justify-between">
            <p>© 2026 News2Market. All rights reserved.</p>
            <p>Sample data for demonstration. Not investment advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Auth = ({ theme, toggleTheme, authMode, setAuthMode, setView }) => (
  <div className="grid min-h-screen place-items-center px-4 py-8 bg-bg text-ink">
    <div className="w-full max-w-md">
      <button className="mb-4 text-sm text-mute hover:text-ink" onClick={() => setView('landing')}>Back to home</button>
      <div className="card p-7">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><LogoIcon /><span className="fd font-bold text-ink">News<span className="gt">2</span>Market</span></div><button className="themebtn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button></div>
        <div className="mt-6 grid grid-cols-2 rounded-full bg-bg border border-line p-1">
          <button className={`tab ${authMode === 'login' ? 'bg-acc text-white' : 'text-mute hover:text-ink'}`} onClick={() => setAuthMode('login')}>Log in</button>
          <button className={`tab ${authMode === 'signup' ? 'bg-acc text-white' : 'text-mute hover:text-ink'}`} onClick={() => setAuthMode('signup')}>Sign up</button>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-ink">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-sm text-mute">{authMode === 'login' ? 'Log in to open your dashboard.' : 'Sign up to start exploring news impact.'}</p>
        <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); setView('app'); }}>
          {authMode === 'signup' && (<div><label className="text-sm font-medium text-ink">Full name</label><input className="inp mt-1 text-ink" autoComplete="name" required /></div>)}
          <div><label className="text-sm font-medium text-ink">Email</label><input type="email" className="inp mt-1 text-ink" autoComplete="email" required /></div>
          <div><label className="text-sm font-medium text-ink">Password</label><input type="password" className="inp mt-1 text-ink" required /></div>
          <button type="submit" className="grad w-full rounded-xl py-3 font-semibold text-white mt-2">{authMode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
      </div>
    </div>
  </div>
);

const DashboardLayout = ({ theme, toggleTheme, setView }) => {
  const [cur, setCur] = useState('TCS');
  const [mk, setMk] = useState('All');
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState('dash');

  const tp = NEWS.map((n, i) => <span key={i}><b className={`text-${cls[n[3]]}`}>{n[0]}</b> {n[2]}</span>);
  const L = T_KEYS.filter(t => (mk === 'All' || CO[t].m === mk) && (t + CO[t].s + CO[t].n).toLowerCase().includes(q.toLowerCase()));
  const items = useMemo(() => NEWS.filter(n => n[0] === cur), [cur]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="overflow-hidden border-b border-line bg-card/70 py-2 text-sm"><div className="tape">{tp}{tp}</div></div>
      
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-5">
        <div className="flex items-center gap-3"><LogoIcon /><div><h1 className="text-xl font-bold leading-tight text-ink">News<span className="gt">2</span>Market</h1><p className="text-xs text-mute">Financial news impact analysis using NLP and Generative AI</p></div></div>
        <div className="flex items-center gap-2"><button className="themebtn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button><button className="pill" onClick={() => setView('landing')}>Log out</button></div>
      </header>

      <nav className="mx-auto mt-4 max-w-6xl px-4">
        <div className="scroll-x flex gap-1 rounded-full border border-line bg-card p-1">
          {VIEWS.map(v => <button key={v[0]} className="tab" aria-current={activeTab === v[0]} onClick={() => setActiveTab(v[0])}>{v[1]}</button>)}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
        <p className="mb-4 rounded-xl border border-line bg-card px-4 py-2 text-sm text-mute">All numbers on this page are sample data for the frontend design. Real results will appear once the data and model pipeline is connected.</p>
        
        {(activeTab === 'dash' || activeTab === 'news' || activeTab === 'ai') && (
          <div className="mb-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input className="inp !w-60" placeholder="Search company or symbol" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="flex gap-2">{['All', 'India', 'US'].map(m => <button key={m} className="pill" aria-pressed={m === mk} onClick={() => setMk(m)}>{m}</button>)}</div>
              <span className="ml-auto text-sm text-mute">{L.length} of {T_KEYS.length} companies</span>
            </div>
            <div className="scroll-x flex gap-3 pb-1">
              {L.length ? L.map(t => {
                const c = CO[t]; const u = c.c >= 0; const a = t === cur;
                return (
                  <button key={t} onClick={() => setCur(t)} className="card min-w-[175px] p-3 text-left" style={a ? { borderColor: 'var(--acc)', boxShadow: '0 0 0 2px var(--acc) inset' } : {}}>
                    <div className="flex items-center justify-between gap-2"><b className="fd">{c.s}</b><span className={`text-sm font-semibold ${u ? 'text-pos' : 'text-neg'}`}>{u ? '▲' : '▼'} {Math.abs(c.c)}%</span></div>
                    <p className="truncate text-xs text-mute">{c.n}</p><p className="fd mt-1 text-lg font-semibold">{c.p}</p>
                  </button>
                );
              }) : <p className="p-3 text-sm text-mute">No company matches. Try a different name or symbol.</p>}
            </div>
          </div>
        )}

        {activeTab === 'dash' && <TabDash cur={cur} items={items} onGoAI={() => setActiveTab('ai')} />}
        {activeTab === 'news' && <TabNews items={items} />}
        {activeTab === 'model' && <TabModel />}
        {activeTab === 'corr' && <TabCorr />}
        {activeTab === 'ai' && <TabAI cur={cur} items={items} />}
        {activeTab === 'about' && <TabAbout />}
      </main>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (view === 'landing') return <Landing theme={theme} toggleTheme={toggleTheme} setAuthMode={setAuthMode} setView={setView} />;
  if (view === 'auth') return <Auth theme={theme} toggleTheme={toggleTheme} authMode={authMode} setAuthMode={setAuthMode} setView={setView} />;
  if (view === 'app') return <DashboardLayout theme={theme} toggleTheme={toggleTheme} setView={setView} />;
  return null;
};

export default App;