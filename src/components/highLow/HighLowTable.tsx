import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useBalanceStore } from '../../store/balanceStore';
import { HighLowCard } from './HighLowCard';
import type { Card, Rank, Suit } from '../../types';
import { AppHeader } from '../AppHeader';
// ── Constants ─────────────────────────────────────────────────────────────────
const MULTIPLIERS   = [0, 0.7, 1, 2.5, 3.5, 6, 10, 25];
const MAX_STREAK    = 7;
const DROP_MS       = 200;
const FLIP_MS       = 200;
const RESULT_MS     = 0;
const PROMPT_MS     = 100;
const WIN_FLIP_MS   = 150;
const WIN_SLIDE_MS  = 250;
const LOSE_SHAKE_MS = 400;
const LOSE_FALL_MS  = 400;

const CARD_W   = 90;
const CARD_H   = 126;
const CARD_GAP = 24;
const SLIDE_X  = -(CARD_W + CARD_GAP); // -114: right card slides to left slot position

const RANK_VALUE: Record<string, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14,
};
const SUITS: Suit[] = ['hearts', 'diamonds', 'spades', 'clubs'];
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ id: `${rank}-${suit}-${Math.random().toString(36).slice(2)}`, rank, suit, faceUp: true, isWild: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function multiplierLabel(m: number): string {
  return m === 0.7 ? '0.7x' : Number.isInteger(m) ? `${m}x` : `${m}x`;
}

type Phase = 'SETUP' | 'CHOOSING' | 'DEALING' | 'TRANSITIONING' | 'CASHOUT' | 'LOST' | 'WINNER';

// ── Sounds ────────────────────────────────────────────────────────────────────
function playDing() {
  const ctx = new AudioContext();
  [987, 1975].forEach((freq, idx) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(idx === 0 ? 0.5 : 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.2);
  });
  const click = ctx.createOscillator(); const cg = ctx.createGain();
  click.connect(cg); cg.connect(ctx.destination); click.type = 'sine';
  click.frequency.setValueAtTime(1400, ctx.currentTime);
  cg.gain.setValueAtTime(0.6, ctx.currentTime);
  cg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  click.start(ctx.currentTime); click.stop(ctx.currentTime + 0.04);
}

function playBuzz() {
  const ctx = new AudioContext();
  [{ freq:480,start:0,dur:0.18 },{ freq:360,start:0.18,dur:0.18 },{ freq:240,start:0.36,dur:0.28 }]
    .forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur);
    });
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    color: ['#f97316','#22c55e','#3b82f6','#eab308','#ec4899','#a855f7'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute rounded-sm"
          style={{ left:`${p.x}%`, top:-16, width:p.size, height:p.size*0.6, backgroundColor:p.color }}
          animate={{ y:'105vh', rotate:[0,360,720], opacity:[1,1,0] }}
          transition={{ duration:p.duration, delay:p.delay, ease:'easeIn' }}
        />
      ))}
    </div>
  );
}

// ── Deck visual ───────────────────────────────────────────────────────────────
function DeckStack({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mb-8">
      <div className="relative" style={{ width:78, height:111 }}>
        {[2,1,0].map(i => (
          <div key={i} className="absolute rounded-lg border border-white bg-gradient-to-br from-orange-600 to-orange-400"
            style={{ width:78, height:108, top:i*3, left:i*3, zIndex:3-i }} /> 
        ))}
        <div className="w-3/4 h-3/4 border-2 border-white rounded opacity-50" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function HighLowTable({ onBack }: { onBack: () => void }) {
  const { balance, deduct, add } = useBalanceStore();

  const [phase, setPhase]           = useState<Phase>('SETUP');
  const [betInput, setBetInput]     = useState('');
  const [bet, setBet]               = useState(0);
  const [deck, setDeck]             = useState<Card[]>([]);
  const [streak, setStreak]         = useState(0);
  const [streakLog, setStreakLog]   = useState<boolean[]>([]);
  const [selection, setSelection]   = useState<'higher' | 'lower' | null>(null);

  const [leftCardKey, setLeftCardKey] = useState(0);
  const [leftCard, setLeftCard]                 = useState<Card | null>(null);
  const [leftFaceUp, setLeftFaceUp]             = useState(false);
  const [rightCard, setRightCard]               = useState<Card | null>(null);
  const [rightFaceUp, setRightFaceUp]           = useState(false);
  const [rightGreenBorder, setRightGreenBorder] = useState(false);
  const [rightRedBorder, setRightRedBorder]     = useState(false);

  const leftControls  = useAnimation();
  const rightControls = useAnimation();
  const leftDropRef   = useRef(false); // true = next leftCard change should drop-animate

  // Drop left card only when explicitly flagged
  useEffect(() => {
    if (!leftCard || !leftDropRef.current) return;
    leftDropRef.current = false;
    leftControls.set({ y: -80, opacity: 0, x: 0 });
    leftControls.start({ y: 0, opacity: 1, transition: { duration: DROP_MS / 1000, ease: [0.4, 0, 0.2, 1] } });
  }, [leftCard?.id]);

  // Always drop right card when it appears
  useEffect(() => {
    if (!rightCard) return;
    rightControls.set({ y: -80, opacity: 0, x: 0 });
    rightControls.start({ y: 0, opacity: 1, transition: { duration: DROP_MS / 1000, ease: [0.4, 0, 0.2, 1] } });
  }, [rightCard?.id]);

  // ── Probability calc ──────────────────────────────────────────────────────
  const calcProbs = () => {
    if (!leftCard || deck.length === 0) return { higher: 0, lower: 0 };
    const cur = RANK_VALUE[leftCard.rank]; const total = deck.length;
    return {
      higher: Math.round(deck.filter(c => RANK_VALUE[c.rank] > cur).length / total * 100),
      lower:  Math.round(deck.filter(c => RANK_VALUE[c.rank] < cur).length / total * 100),
    };
  };

  // ── Win transition ────────────────────────────────────────────────────────
  // Prev flips face-down → prev exits left / current slides to prev → swap
  const doWinTransition = (capturedRightCard: Card, onDone: () => void) => {
    setPhase('TRANSITIONING');
    setLeftFaceUp(false); // Step 1: flip prev card face-down

    setTimeout(() => {
      // Step 2: prev exits left, current slides to prev position simultaneously
      leftControls.start({ x: -300, opacity: 0, transition: { duration: WIN_SLIDE_MS / 1000, ease: 'easeInOut' } });
      rightControls.start({ x: SLIDE_X,          transition: { duration: WIN_SLIDE_MS / 1000, ease: 'easeInOut' } });

      setTimeout(() => {
        // Step 3: instant swap — left card gets new data, positioned at x:0 (invisible), then fades in
        leftControls.set({ x: 0, y: 0, opacity: 1 });
          setLeftCard(capturedRightCard);
          setLeftFaceUp(true);
          onDone();
          setTimeout(() => {
            setRightCard(null);
            setRightGreenBorder(false);
          }, 80);
          leftControls.set({ x: 0, y: 0, opacity: 1 });
            setLeftCardKey(k => k + 1);  // ← add this line
            setLeftCard(capturedRightCard);
      }, WIN_SLIDE_MS);
    }, WIN_FLIP_MS);
  };

  // ── Lose sequence ─────────────────────────────────────────────────────────
  // Wrong card shakes with red border → both cards fall off screen
  const doLoseSequence = () => {
    rightControls.start({
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: LOSE_SHAKE_MS / 1000, ease: 'easeInOut' },
    });
    setTimeout(() => {
      leftControls.start({ y: 400, opacity: 0, transition: { duration: LOSE_FALL_MS / 1000, ease: 'easeIn' } });
      rightControls.start({ y: 400, opacity: 0, transition: { duration: LOSE_FALL_MS / 1000, ease: 'easeIn' } });
      setTimeout(() => { setLeftCard(null); setRightCard(null); setPhase('LOST'); }, LOSE_FALL_MS);
    }, LOSE_SHAKE_MS);
  };

  // ── Start / replay game ───────────────────────────────────────────────────
  const startGameWithBet = (betAmt: number) => {
    if (betAmt < 1 || betAmt > 100 || betAmt > balance) return;
    deduct(betAmt);
    setBet(betAmt);
    setStreak(0); setStreakLog([]); setSelection(null);
    setRightCard(null); setRightGreenBorder(false); setRightRedBorder(false);
    setPhase('DEALING');

    const freshDeck = buildDeck();
    setDeck(freshDeck.slice(1));

    leftDropRef.current = true;
    setLeftCard({ ...freshDeck[0], faceUp: false });
    setLeftFaceUp(false);

    setTimeout(() => setLeftFaceUp(true), DROP_MS);
    setTimeout(() => setPhase('CHOOSING'), DROP_MS + FLIP_MS + PROMPT_MS);
  };

  const startGame = () => { const v = parseInt(betInput); if (!isNaN(v)) startGameWithBet(v); };

  // ── Confirm guess ─────────────────────────────────────────────────────────
  const confirmSelection = () => {
    if (!selection || !leftCard || deck.length === 0) return;

    const nextCard       = deck[0];
    const newDeck        = deck.slice(1);
    const capturedLeft   = leftCard;
    const capturedSel    = selection;
    const capturedStreak = streak;

    setSelection(null); setDeck(newDeck); setPhase('DEALING');
    setRightCard({ ...nextCard, faceUp: false });
    setRightFaceUp(false); setRightRedBorder(false); setRightGreenBorder(false);

    setTimeout(() => setRightFaceUp(true), DROP_MS);

    setTimeout(() => {
      const leftVal  = RANK_VALUE[capturedLeft.rank];
      const rightVal = RANK_VALUE[nextCard.rank];
      const correct  = (capturedSel === 'higher' && rightVal > leftVal) ||
                       (capturedSel === 'lower'  && rightVal < leftVal);

      setStreakLog(prev => [...prev, correct]);

      if (correct) {
        playDing();
        setRightGreenBorder(true);
        const newStreak = capturedStreak + 1;
        setStreak(newStreak);
        if (newStreak === MAX_STREAK) {
          add(Math.round(bet * MULTIPLIERS[MAX_STREAK]));
          doWinTransition(nextCard, () => setPhase('WINNER'));
        } else {
          doWinTransition(nextCard, () => setPhase('CASHOUT'));
        }
      } else {
        playBuzz();
        setStreak(0);
        setRightRedBorder(true);
        doLoseSequence();
      }
    }, DROP_MS + FLIP_MS + RESULT_MS);
  };

  // ── Cash out / reset helpers ──────────────────────────────────────────────
  const cashOut = () => {
    add(Math.round(bet * MULTIPLIERS[streak]));
    setLeftCard(null); setRightCard(null);
    setStreak(0); setStreakLog([]); setBetInput(''); setPhase('SETUP');
  };
  const keepGoing    = () => setPhase('CHOOSING');
  const resetToSetup = () => {
    setLeftCard(null); setRightCard(null);
    setStreak(0); setStreakLog([]); setBetInput(''); setPhase('SETUP');
  };

  const betVal        = parseInt(betInput);
  const validBet      = !isNaN(betVal) && betVal >= 1 && betVal <= 100 && betVal <= balance;
  const probs         = calcProbs();
  const cashoutAmount = Math.round(bet * MULTIPLIERS[streak]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)' }}>

      {/* Header */}
      <AppHeader onHome={onBack} rulesTab="highLow" payoutsTab="highLowPayouts" />

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden px-4 gap-4">
        <div className="flex flex-col items-center gap-4" style={{ maxWidth: 'clamp(280px, 100%, 60vw)' }}>

          <DeckStack count={deck.length} />

          {/* Card Board — two fixed slots */}
          <div className="relative overflow-visible" style={{ width: CARD_W * 2 + CARD_GAP, height: CARD_H }}>

            {/* Slot placeholders */}
            <div className="absolute rounded-lg border-2 border-dashed border-white/10"
              style={{ left:0, top:0, width:CARD_W, height:CARD_H }} />
            <div className="absolute rounded-lg border-2 border-dashed border-white/10"
              style={{ left:CARD_W + CARD_GAP, top:0, width:CARD_W, height:CARD_H }} />

            {/* Slot labels */}
            <div className="absolute flex justify-between text-[9px] text-slate-300 uppercase tracking-widest"
              style={{ top: CARD_H + 6, left:0, width:'100%' }}>
              <span style={{ width:CARD_W, textAlign:'center', display:'inline-block' }}>Previous</span>
              <span style={{ width:CARD_W, textAlign:'center', display:'inline-block' }}>Current</span>
            </div>

            {/* Left (previous) card */}
            {leftCard && (
              <motion.div key={leftCardKey} animate={leftControls}
                 style={{ position:'absolute', left:0, top:0, width:CARD_W, zIndex:1 }}>
                <HighLowCard card={{ ...leftCard, faceUp: leftFaceUp }} />
              </motion.div>
            )}

            {/* Right (current) card */}
            {rightCard && (
              <motion.div animate={rightControls}
                style={{ position:'absolute', left:CARD_W + CARD_GAP, top:0, width:CARD_W, zIndex:2 }}>
                <HighLowCard
                  card={{ ...rightCard, faceUp: rightFaceUp }}
                  greenBorder={rightGreenBorder}
                  redBorder={rightRedBorder}
                />
              </motion.div>
            )}
          </div>

          {/* Streak circles */}
          <AnimatePresence>
            {/* Streak circles */}
<div className="flex justify-center items-end" style={{ minHeight: 40, marginTop: 16 }}>
  {streak > 0 && (
    <motion.span
      key={streak}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="font-black leading-none"
      style={{
        fontSize: `${0.75 + streak * 0.1}rem`,
        color: ['#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#15803d','#166534'][streak - 1],
      }}>
      {multiplierLabel(MULTIPLIERS[streak])}
    </motion.span>
  )}
  {phase === 'LOST' && streak === 0 && (
    <motion.span
      className="font-black leading-none text-red-400"
      style={{ fontSize: '0.75rem' }}
      animate={{ x: [0, -4, 4, -4, 4, 0] }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}>
      0x
    </motion.span>
  )}
</div>
          </AnimatePresence>

        </div>
      </div>

      {/* Bottom sheet — fixed 200px */}
      <div className="flex-shrink-0 border-t border-white/10 px-4"
        style={{ height:200, background:'rgba(15,23,42,0.95)', backdropFilter:'blur(12px)' }}>
        <div className="flex flex-col justify-center gap-2.5 mx-auto h-full"
          style={{ maxWidth:'clamp(280px, 100%, 90vw)' }}>

          {/* SETUP */}
          {phase === 'SETUP' && (
            <>
              <p className="text-white/40 text-[10px] text-center uppercase tracking-widest mb-1">Place Your Bet</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-sm">$</span>
                <input type="number" min={1} max={100} value={betInput}
                  onChange={e => setBetInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter amount (1–100)"
                  className="w-full bg-slate-800/80 border border-slate-600 focus:border-orange-500 rounded-xl pl-8 pr-4 py-3 text-white text-center font-bold text-base outline-none transition placeholder:text-white/20 placeholder:font-normal placeholder:text-sm appearance-none"
                />
              </div>
              <button onClick={startGame} disabled={!validBet}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={validBet ? { background:'linear-gradient(135deg,#ea580c,#f97316)', boxShadow:'0 4px 20px rgba(234,88,12,0.35)' } : { background:'#374151' }}>
                <span className="text-white">Start Game</span>
              </button>
            </>
          )}

          {/* CHOOSING */}
          {phase === 'CHOOSING' && (
            <>
              <div className="text-center mb-0.5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest my-2">Will the next card be…</p>
              </div>
              <div className="flex gap-2">
                {(['higher','lower'] as const).map(opt => {
                  const prob = opt === 'higher' ? probs.higher : probs.lower;
                  const active = selection === opt;
                  return (
                    <button key={opt} onClick={() => setSelection(opt)}
                      className="flex-1 py-3 rounded-full border-2 font-bold text-md transition-all flex flex-col items-center gap-0.5"
                      style={active
                        ? { background:'linear-gradient(135deg,#ea580c,#f97316)', borderColor:'#f97316', color:'#fff', boxShadow:'0 4px 20px rgba(234,88,12,0.35)' }
                        : { background:'transparent', borderColor:'rgba(234,88,12,0.5)', color:'#fb923c' }}>
                      <span className="uppercase text-slate-300 tracking-wide text-sm">{opt}</span>
                      <span className="text-[11px] font-normal opacity-80">({prob}%)</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {selection && (
                  <motion.div key="confirm-row"
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
                    className="flex gap-2">
                    <button onClick={() => setSelection(null)}
                      className="flex-1 py-2.5 rounded-full border border-orange-600 text-slate-200 text-md font-semibold hover:border-slate-500 transition">
                      Change
                    </button>
                    <button onClick={confirmSelection}
                      className="flex-1 py-2.5 rounded-full font-semibold text-md text-white transition"
                      style={{ background:'linear-gradient(135deg,#ea580c,#f97316)', boxShadow:'0 4px 16px rgba(234,88,12,0.3)' }}>
                      See Next Card
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* DEALING / TRANSITIONING */}
          {(phase === 'DEALING' || phase === 'TRANSITIONING') && (
            <p className="text-white/30 text-xs text-center animate-pulse tracking-widest uppercase">
              {phase === 'DEALING' ? 'Dealing…' : 'Next card…'}
            </p>
          )}

          {/* CASHOUT */}
          {phase === 'CASHOUT' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button onClick={cashOut}
                  className="flex-1 py-2.5 rounded-full border-2 border-orange-600 text-slate-200 text-md font-semibold hover:bg-orange-600/10 transition">
                  Cash Out (${cashoutAmount})
                </button>
                <button onClick={keepGoing}
                  className="flex-1 py-2.5 rounded-full font-semibold text-md text-white transition"
                  style={{ background:'linear-gradient(135deg,#ea580c,#f97316)', boxShadow:'0 4px 16px rgba(234,88,12,0.3)' }}>
                  Keep Going!
                </button>
              </div>
            </motion.div>
          )}

          {/* LOST */}
          {phase === 'LOST' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-red-400 font-bold text-lg text-base">-${bet}</p>
                <p className="text-slate-200 text-sm my-2">Better luck next time</p>
              </div>
              <div className="flex gap-2">
                <button onClick={resetToSetup}
                  className="flex-1 py-2.5 rounded-full border-2 border-orange-600 text-slate-200 text-md font-semibold hover:bg-orange-600/10 transition">
                  Change Bet
                </button>
                <button onClick={() => startGameWithBet(bet)} disabled={bet > balance}
                  className="flex-1 py-2.5 rounded-full font-semibold text-md text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background:'linear-gradient(135deg,#ea580c,#f97316)', boxShadow:'0 4px 16px rgba(234,88,12,0.3)' }}>
                  Play Again ${bet}
                </button>
              </div>
            </motion.div>
          )}

          {/* WINNER */}
          {phase === 'WINNER' && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-yellow-400 font-black text-2xl tracking-wide">🏆 WINNER!</p>
                <p className="text-white/50 text-xs mt-1">
                  7 in a row! Won <span className="text-orange-400 font-semibold">${Math.round(bet * MULTIPLIERS[7])}</span>
                  <span className="text-white/25"> · 25x payout</span>
                </p>
              </div>
              <button onClick={resetToSetup}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition"
                style={{ background:'linear-gradient(135deg,#ea580c,#f97316)', boxShadow:'0 4px 20px rgba(234,88,12,0.35)' }}>
                Play Again
              </button>
            </motion.div>
          )}

        </div>
      </div>

      {phase === 'WINNER' && <Confetti />}
    </div>
  );
}
