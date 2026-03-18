'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';

/* ─── 타입 ─────────────────────────────────────── */
interface Quiz { question: string; answer: number; }
interface BubbleCfg { x: number; size: number; opacity: number; duration: number; delay: number; }

/* ─── 상수 ─────────────────────────────────────── */
const COMPLIMENTS = [
  { text: 'Amazing!! 🎉', label: '🎉 CORRECT!' },
  { text: 'So smart! 🌟', label: '🎉 CORRECT!' },
  { text: 'Purr-fect! 🐬', label: '🎉 CORRECT!' },
  { text: 'Genius!! 🧠', label: '🎉 CORRECT!' },
  { text: "You're awesome! 🌊", label: '🎉 CORRECT!' },
];
const ENCOURAGEMENTS = [
  'Hmm, not quite... try again! 🥺',
  'Oops! Give it another shot! 💪',
  'So close! You can do it! 🌈',
  'Not this time~ keep going! 🐬',
];

function makeQuiz(): Quiz {
  const ops = ['+', '−', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '+') {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    answer = a + b;
  } else if (op === '−') {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * (a - 1)) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 11) + 2;
    b = Math.floor(Math.random() * 11) + 2;
    answer = a * b;
  }
  return { question: `${a} ${op} ${b} = ?`, answer };
}

/* ─── 기포 배경 ──────────────────────────────────── */
function BubbleField() {
  const bubbles = useMemo<BubbleCfg[]>(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      size: Math.random() * 10 + 4,
      opacity: Math.random() * 0.28 + 0.08,
      duration: Math.random() * 14 + 8,
      delay: Math.random() * 10,
    })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: 'rgba(127,255,212,0.15)',
            animation: `rise ${b.duration}s ${b.delay}s infinite linear backwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Web Audio 소리 ────────────────────────────── */
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientStartedRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const startAmbient = useCallback((ctx: AudioContext) => {
    if (ambientStartedRef.current) return;
    ambientStartedRef.current = true;
    try {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.13;

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
    } catch (_) {}
  }, []);

  // 페이지 로드 즉시 앰비언트 시작 시도
  // 브라우저가 막으면(suspended) 첫 터치/클릭 시 자동 재개
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;
      startAmbient(ctx);

      if (ctx.state === 'suspended') {
        const resume = () => {
          ctx.resume().then(() => startAmbient(ctx));
          document.removeEventListener('click', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume);
        document.addEventListener('touchstart', resume);
      }
    } catch (_) {}
  }, [startAmbient]);

  const playSound = useCallback((type: 'num' | 'func' | 'op' | 'equal' | 'correct' | 'wrong') => {
    try {
      const ctx = getCtx();
      startAmbient(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'num') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);

      } else if (type === 'func') {
        // AC/±/% - 부드러운 중간음
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);

      } else if (type === 'op') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);

      } else if (type === 'equal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);

      } else if (type === 'correct') {
        // 정답 - 밝고 상승하는 3연음
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.1);
        osc.frequency.setValueAtTime(1320, now + 0.2);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);

      } else if (type === 'wrong') {
        // 오답 - 톱니파로 거칠고 불쾌한 하강음
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
      }
    } catch (_) {}
  }, [getCtx, startAmbient]);

  return playSound;
}

/* ─── 버튼 컴포넌트들 ─────────────────────────────── */
const BTN_BASE: React.CSSProperties = {
  borderRadius: '50%',
  border: 'none',
  fontSize: 26,
  fontWeight: 400,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.12s ease, background 0.12s ease',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  outline: 'none',
  flexShrink: 0,
};

function NumBtn({ label, onPress, wide, size }: { label: string; onPress: () => void; wide?: boolean; size: number }) {
  return (
    <button
      onClick={onPress}
      style={{
        ...BTN_BASE,
        width: wide ? size * 2 + 12 : size,
        height: size,
        borderRadius: wide ? size / 2 : '50%',
        justifyContent: wide ? 'flex-start' : 'center',
        paddingLeft: wide ? 24 : 0,
        background: 'rgba(20,70,100,0.65)',
        color: '#d0f0ec',
        border: '1px solid rgba(46,196,182,0.12)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
      }}
      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {label}
    </button>
  );
}

function FuncBtn({ label, onPress, size }: { label: string; onPress: () => void; size: number }) {
  return (
    <button
      onClick={onPress}
      style={{
        ...BTN_BASE,
        width: size,
        height: size,
        background: 'rgba(46,196,182,0.22)',
        color: '#7fffd4',
        border: '1px solid rgba(46,196,182,0.25)',
        fontSize: 20,
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      }}
      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {label}
    </button>
  );
}

function OpBtn({ label, onPress, active, size }: { label: string; onPress: () => void; active: boolean; size: number }) {
  return (
    <button
      onClick={onPress}
      style={{
        ...BTN_BASE,
        width: size,
        height: size,
        background: active ? '#e0f7f4' : 'linear-gradient(145deg, #2ec4b6, #0d8c8c)',
        color: active ? '#0d8c8c' : '#fff',
        fontSize: 30,
        boxShadow: '0 4px 20px rgba(46,196,182,0.35)',
      }}
      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {label}
    </button>
  );
}

function EqualBtn({ onPress, size }: { onPress: () => void; size: number }) {
  return (
    <button
      onClick={onPress}
      style={{
        ...BTN_BASE,
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #00e5ff, #0077b6)',
        color: '#fff',
        fontSize: 30,
        boxShadow: '0 4px 24px rgba(0,119,182,0.5)',
      }}
      onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      =
    </button>
  );
}

/* ─── 메인 계산기 ─────────────────────────────────── */
export default function CalculatorPage() {
  const [current, setCurrent]       = useState('0');
  const [previous, setPrevious]     = useState('');
  const [operator, setOperator]     = useState<string | null>(null);
  const [newInput, setNewInput]     = useState(false);
  const [expression, setExpression] = useState('');
  const [activeOp, setActiveOp]     = useState<string | null>(null);

  // Quiz
  const quizRef     = useRef<Quiz>(makeQuiz());
  const quizOpenRef = useRef(false);
  const [quizOpen, setQuizOpen]         = useState(false);
  const [bubbleLabel, setBubbleLabel]   = useState('🧩 QUIZ');
  const [bubbleText, setBubbleText]     = useState('');
  const [bubbleColor, setBubbleColor]   = useState('rgba(10,45,70,0.88)');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupText, setPopupText]       = useState('');
  const [popupStars, setPopupStars]     = useState('');
  const [dolBounce, setDolBounce]       = useState(false);
  const [iconAnim, setIconAnim]         = useState(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 버튼 크기 계산 (모바일 뷰포트 기준)
  const [btnSize, setBtnSize] = useState(74);
  useEffect(() => {
    const calc = () => {
      const w = Math.min(window.innerWidth, 420);
      const size = Math.floor((w - 32 - 48 - 12 * 3) / 4);
      setBtnSize(size);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const playSound = useAudio();


  const loadNextQuiz = useCallback(() => {
    const q = makeQuiz();
    quizRef.current = q;
    setBubbleLabel('🧩 QUIZ');
    setBubbleText(q.question);
    setBubbleColor('rgba(10,45,70,0.88)');
  }, []);

  const showPopup = useCallback((text: string, stars: string) => {
    setPopupText(text);
    setPopupStars(stars);
    setPopupVisible(true);
    setTimeout(() => setPopupVisible(false), 1800);
  }, []);

  const resetCalc = useCallback(() => {
    setCurrent('0'); setPrevious(''); setOperator(null);
    setActiveOp(null); setNewInput(false); setExpression('');
  }, []);

  const checkQuiz = useCallback((res: string) => {
    if (!quizOpenRef.current) return;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    if (parseFloat(res) === quizRef.current.answer) {
      const c = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
      setBubbleLabel(c.label); setBubbleText(c.text); setBubbleColor('rgba(20,120,70,0.9)');
      playSound('correct');
      setDolBounce(true); setTimeout(() => setDolBounce(false), 400);
      showPopup(c.text, '⭐⭐⭐');
      resetCalc();
      reactionTimer.current = setTimeout(() => loadNextQuiz(), 2500);
    } else {
      const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setBubbleLabel('💦 OOPS!'); setBubbleText(enc); setBubbleColor('rgba(140,40,40,0.88)');
      playSound('wrong');
      resetCalc();
      reactionTimer.current = setTimeout(() => {
        setBubbleLabel('🧩 QUIZ');
        setBubbleText(quizRef.current.question);
        setBubbleColor('rgba(10,45,70,0.88)');
      }, 2000);
    }
  }, [loadNextQuiz, playSound, resetCalc, showPopup]);

  const toggleQuiz = useCallback(() => {
    setIconAnim(true);
    setTimeout(() => setIconAnim(false), 300);
    if (!quizOpenRef.current) {
      quizOpenRef.current = true;
      setQuizOpen(true);
      loadNextQuiz();
    } else {
      quizOpenRef.current = false;
      setQuizOpen(false);
      loadNextQuiz();
    }
  }, [loadNextQuiz]);

  const inputNum = useCallback((n: string) => {
    playSound('num');
    if (newInput) { setNewInput(false); setCurrent(n); return; }
    setCurrent(prev => prev === '0' ? n : prev + n);
  }, [newInput, playSound]);

  const inputDot = useCallback(() => {
    playSound('num');
    if (newInput) { setNewInput(false); setCurrent('0.'); return; }
    setCurrent(prev => prev.includes('.') ? prev : prev + '.');
  }, [newInput, playSound]);

  const setOp = useCallback((op: string) => {
    playSound('op');
    setActiveOp(op);
    if (operator && !newInput) {
      const a = parseFloat(previous), b = parseFloat(current);
      let result: number | null;
      switch (operator) {
        case '+': result = a + b; break;
        case '−': result = a - b; break;
        case '×': result = a * b; break;
        case '÷': result = b === 0 ? null : a / b; break;
        default:  result = null;
      }
      const res = result === null ? 'Error' : parseFloat(result.toFixed(10)).toString();
      setPrevious(res); setCurrent(res);
      setExpression(`${res} ${op}`); setOperator(op); setNewInput(true);
    } else {
      setPrevious(current);
      setExpression(`${current} ${op}`); setOperator(op); setNewInput(true);
    }
  }, [operator, newInput, previous, current, playSound]);

  const calculate = useCallback(() => {
    if (!operator && !previous && quizOpenRef.current) {
      playSound('equal');
      checkQuiz(current);
      return;
    }
    if (!operator || newInput) return;
    playSound('equal');
    const a = parseFloat(previous), b = parseFloat(current);
    let result: number | null;
    switch (operator) {
      case '+': result = a + b; break;
      case '−': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b === 0 ? null : a / b; break;
      default:  result = null;
    }
    const res = result === null ? 'Error' : parseFloat(result.toFixed(10)).toString();
    setExpression(`${previous} ${operator} ${current} =`);
    setCurrent(res); setOperator(null); setActiveOp(null); setNewInput(true);
    checkQuiz(res);
  }, [operator, newInput, previous, current, checkQuiz, playSound]);

  const clearAll = useCallback(() => { playSound('func'); resetCalc(); }, [playSound, resetCalc]);
  const toggleSign = useCallback(() => {
    playSound('func');
    setCurrent(prev => (parseFloat(prev) * -1).toString());
  }, [playSound]);
  const percent = useCallback(() => {
    playSound('func');
    setCurrent(prev => (parseFloat(prev) / 100).toString());
  }, [playSound]);

  const displayValue = current.length > 9 ? parseFloat(current).toExponential(3) : current;
  const fontSize = displayValue.length > 9 ? 32 : displayValue.length > 7 ? 44 : 64;

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: '20px 0',
    }}>
      <BubbleField />

      <div style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(8,30,55,0.55)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderRadius: 48,
          border: '1px solid rgba(127,255,212,0.18)',
          padding: '56px 24px 28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 60px rgba(46,196,182,0.08)',
          position: 'relative',
        }}>

          {/* 돌고래 아이콘 */}
          <div style={{ position: 'absolute', top: 12, right: 16 }}>
            <button
              onClick={toggleQuiz}
              style={{
                width: 40, height: 40, borderRadius: 20,
                background: 'rgba(8,30,55,0.6)',
                border: '1.5px solid rgba(127,255,212,0.35)',
                cursor: 'pointer', fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s ease',
                transform: iconAnim ? 'scale(1.2) rotate(-10deg)' : 'scale(1)',
              }}
            >
              🐬
            </button>
          </div>

          {/* 퀴즈 패널 */}
          <div style={{
            overflow: 'hidden',
            maxHeight: quizOpen ? 100 : 0,
            opacity: quizOpen ? 1 : 0,
            transition: 'max-height 0.35s ease, opacity 0.28s ease',
            marginBottom: quizOpen ? 8 : 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
              <Image
                src="/dolphin.png"
                alt="dolphin"
                width={70}
                height={70}
                style={{
                  objectFit: 'contain', flexShrink: 0,
                  transform: dolBounce ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              />
              <div style={{
                flex: 1, borderRadius: 14,
                border: '1px solid rgba(46,196,182,0.45)',
                padding: '8px 12px',
                background: bubbleColor,
                transition: 'background 0.3s ease',
              }}>
                <div style={{ color: '#7fffd4', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
                  {bubbleLabel}
                </div>
                <div style={{ color: '#e0f7f4', fontSize: 14, fontWeight: 600 }}>{bubbleText}</div>
              </div>
            </div>
          </div>

          {/* 칭찬 팝업 */}
          {popupVisible && (
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 99,
              pointerEvents: 'none',
              animation: 'floatUp 1.8s ease forwards',
            }}>
              <div style={{ fontSize: 28, letterSpacing: 4, marginBottom: 4 }}>{popupStars}</div>
              <div style={{
                fontSize: 22, fontWeight: 800, color: '#7fffd4',
                textShadow: '0 2px 10px rgba(46,196,182,0.6)',
              }}>{popupText}</div>
            </div>
          )}

          {/* 디스플레이 */}
          <div style={{
            textAlign: 'right', padding: '0 8px',
            minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            marginBottom: 8,
          }}>
            <div style={{
              fontSize: 18, color: 'rgba(127,255,212,0.5)',
              minHeight: 24, marginBottom: 6, letterSpacing: 0.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{expression}</div>
            <div style={{
              fontSize, fontWeight: 200, color: '#e0f7f4',
              letterSpacing: -2, lineHeight: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textShadow: '0 0 30px rgba(46,196,182,0.4)',
              transition: 'font-size 0.1s ease',
            }}>{displayValue}</div>
          </div>

          {/* 버튼 그리드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              <div key="r1" style={{ display: 'flex', gap: 12 }}>
                <FuncBtn label="AC"  onPress={clearAll}    size={btnSize} />
                <FuncBtn label="+/−" onPress={toggleSign}  size={btnSize} />
                <FuncBtn label="%"   onPress={percent}     size={btnSize} />
                <OpBtn   label="÷"   onPress={() => setOp('÷')} active={activeOp === '÷'} size={btnSize} />
              </div>,
              <div key="r2" style={{ display: 'flex', gap: 12 }}>
                <NumBtn label="7" onPress={() => inputNum('7')} size={btnSize} />
                <NumBtn label="8" onPress={() => inputNum('8')} size={btnSize} />
                <NumBtn label="9" onPress={() => inputNum('9')} size={btnSize} />
                <OpBtn  label="×" onPress={() => setOp('×')} active={activeOp === '×'} size={btnSize} />
              </div>,
              <div key="r3" style={{ display: 'flex', gap: 12 }}>
                <NumBtn label="4" onPress={() => inputNum('4')} size={btnSize} />
                <NumBtn label="5" onPress={() => inputNum('5')} size={btnSize} />
                <NumBtn label="6" onPress={() => inputNum('6')} size={btnSize} />
                <OpBtn  label="−" onPress={() => setOp('−')} active={activeOp === '−'} size={btnSize} />
              </div>,
              <div key="r4" style={{ display: 'flex', gap: 12 }}>
                <NumBtn label="1" onPress={() => inputNum('1')} size={btnSize} />
                <NumBtn label="2" onPress={() => inputNum('2')} size={btnSize} />
                <NumBtn label="3" onPress={() => inputNum('3')} size={btnSize} />
                <OpBtn  label="+" onPress={() => setOp('+')} active={activeOp === '+'} size={btnSize} />
              </div>,
              <div key="r5" style={{ display: 'flex', gap: 12 }}>
                <NumBtn label="0" wide onPress={() => inputNum('0')} size={btnSize} />
                <NumBtn label="." onPress={inputDot} size={btnSize} />
                <EqualBtn onPress={calculate} size={btnSize} />
              </div>,
            ]}
          </div>
        </div>
      </div>
    </main>
  );
}
