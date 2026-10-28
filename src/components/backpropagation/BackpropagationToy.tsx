import { useEffect, useMemo, useState } from 'react';
import type { Demo } from '../../lib/backpropagation-toy';
import {
  displayName,
  elementFrames,
  linearFrames,
  linearBackwardTiming,
  makeMotionTrace,
} from '../../lib/backpropagation-motion';
import type { Direction } from '../../lib/backpropagation-motion';
import { motionUi } from '../../lib/backpropagation-motion-i18n';
import type { Language } from '../../lib/site';
import { SpatialMotion } from './SpatialMotion';
import { LinearForwardMotion } from './LinearForwardMotion';
import { LinearBackwardMotion } from './LinearBackwardMotion';
import './number-motion.css';

export default function BackpropagationToy({
  lang,
  linearOnly = false,
}: {
  lang: Language;
  linearOnly?: boolean;
}) {
  const ui = motionUi[lang];
  const [demo, setDemo] = useState<Demo>('linear');
  const [direction, setDirection] = useState<Direction>('forward');
  const [stageIndex, setStageIndex] = useState(0);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const trace = useMemo(
    () => makeMotionTrace(demo, direction),
    [demo, direction],
  );
  const stage = trace.stages[stageIndex];
  const rowForward = demo === 'linear' && direction === 'forward';
  const linearBackward = demo === 'linear' && direction === 'backward';
  const frames = useMemo(
    () => (demo === 'linear' ? linearFrames(stage) : elementFrames(stage)),
    [stage, demo],
  );
  const frame = cursor >= 0 ? frames[cursor] : null;
  const calculation = frame ? stage.calculations[frame.calculation] : null;
  const product = frame ? calculation?.terms[frame.term] : null;
  const complete = cursor === frames.length - 1;
  const finalStage = stageIndex === trace.stages.length - 1;

  function next() {
    if (!complete) setCursor(cursor + 1);
    else if (!finalStage) {
      setStageIndex(stageIndex + 1);
      setCursor(-1);
    } else setPlaying(false);
  }
  function reset() {
    setCursor(-1);
    setPlaying(false);
  }
  function selectDemo(value: Demo) {
    setDemo(value);
    setStageIndex(0);
    reset();
  }
  function selectDirection(value: Direction) {
    setDirection(value);
    setStageIndex(0);
    reset();
  }
  function selectStage(index: number) {
    setStageIndex(index);
    reset();
  }
  function choose(name: string, row: number, col: number) {
    const index = trace.stages.findIndex(
      (s) => s.id === name || s.outputs?.includes(name),
    );
    const selected = trace.stages[index];
    const calculation = selected.calculations.findIndex(
      (c) => c.target.row === row && c.target.col === col,
    );
    setPlaying(false);
    setStageIndex(index);
    setCursor(
      (demo === 'linear'
        ? linearFrames(selected)
        : elementFrames(selected)
      ).findIndex((f) => f.calculation === calculation),
    );
  }
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      next,
      (!rowForward
        ? frame
          ? linearBackwardTiming.cycle
          : 100
        : frame?.phase === 3
          ? 1150
          : 950) / speed,
    );
    return () => window.clearTimeout(timer);
  }, [playing, cursor, stageIndex, speed, rowForward]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  let explanation: string = '';
  const key = stage.id as keyof typeof ui.explanation;
  if (key in ui.explanation) explanation = ui.explanation[key];
  if (demo === 'residual' && stage.id === 'y')
    explanation = ui.explanation.residualY;
  if (demo === 'residual' && stage.id === 'dW')
    explanation = ui.explanation.residualDW;
  if (demo === 'residual' && stage.id === 'dx')
    explanation = ui.explanation.residualDx;
  if (
    calculation &&
    (calculation.terms.length === 0 || product?.scale === -Infinity)
  )
    explanation = ui.masked;
  let phaseLabel: string = ui.ready;
  if (rowForward)
    phaseLabel = frame
      ? frame.phase === 0 && frame.calculation > 0
        ? ui.linearRowNext
        : ui.linearRowPhases[frame.phase]
      : ui.linearRowReady;
  if (linearBackward) {
    const weight = stage.id === 'dW';
    phaseLabel = frame
      ? weight
        ? ui.linearWeightStep
        : ui.linearInputStep
      : weight
        ? ui.linearWeightReady
        : ui.linearInputReady;
    explanation = weight
      ? ui.linearWeightExplanation
      : ui.linearInputExplanation;
  }

  if (demo !== 'linear') {
    phaseLabel = frame
      ? stage.id === 'dSkip'
        ? ui.splitStep
        : ui.spatialStep
      : ui.spatialReady;
    if (demo === 'residual' && stage.id === 'dSkip')
      explanation = ui.splitExplanation;
  }

  return (
    <div className={`nm-demo${linearOnly ? ' nm-demo--linear' : ''}`}>
      <div className="nm-topbar">
        {!linearOnly && (
          <div className="nm-demo-tabs" role="group" aria-label={ui.demo}>
            {(Object.keys(ui.demos) as Demo[]).map((id) => (
              <button
                type="button"
                key={id}
                aria-pressed={demo === id}
                onClick={() => selectDemo(id)}
              >
                {ui.demos[id]}
              </button>
            ))}
          </div>
        )}
        <div className="nm-direction" role="group" aria-label={ui.direction}>
          {(['forward', 'backward'] as const).map((id) => (
            <button
              type="button"
              key={id}
              aria-pressed={direction === id}
              onClick={() => selectDirection(id)}
            >
              {id === 'forward' ? '→' : '←'} {ui[id]}
            </button>
          ))}
        </div>
      </div>
      <p className="nm-intro">
        {demo === 'linear'
          ? direction === 'forward'
            ? ui.linearNote
            : ui.backwardNote
          : demo === 'residual'
            ? ui.residualNote
            : direction === 'forward'
              ? ui.attentionNote
              : ui.attentionBackwardNote}
      </p>
      <div className="nm-stage-tabs" role="group" aria-label={ui.stage}>
        {trace.stages.map((s, i) => (
          <button
            type="button"
            key={s.id}
            aria-pressed={stageIndex === i}
            onClick={() => selectStage(i)}
          >
            <small>{String(i + 1).padStart(2, '0')}</small>
            {s.outputs ? ui.splitStage : displayName(s.id)}
          </button>
        ))}
      </div>
      <section className="nm-instrument" aria-label={ui.viewport}>
        <div className="nm-transport">
          <button
            type="button"
            className="nm-play"
            onClick={() => {
              if (finalStage && complete) {
                setStageIndex(0);
                setCursor(-1);
              }
              setPlaying(!playing);
            }}
          >
            {playing ? 'Ⅱ' : '▶'} {playing ? ui.pause : ui.play}
          </button>
          <button
            type="button"
            disabled={cursor < 0}
            onClick={() => {
              setPlaying(false);
              setCursor(cursor - 1);
            }}
            aria-label={ui.previous}
          >
            ←
          </button>
          <button
            type="button"
            disabled={finalStage && complete}
            onClick={() => {
              setPlaying(false);
              next();
            }}
          >
            {ui.next} →
          </button>
          <button type="button" onClick={reset} aria-label={ui.reset}>
            ↺
          </button>
          <label className="nm-speed">
            {ui.speed}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </label>
        </div>
        <div className="nm-status" aria-live={playing ? 'off' : 'polite'}>
          <strong>{phaseLabel}</strong>
          <span>
            {rowForward && frame
              ? `y[${frame.calculation}]`
              : linearBackward && calculation
                ? stage.id === 'dW'
                  ? `∂L/∂W[${calculation.target.row}, ${calculation.target.col}]`
                  : `∂L/∂x[${calculation.target.row}]`
                : calculation && frame
                  ? `${displayName(stage.id)}[${calculation.target.row}, ${calculation.target.col}]`
                  : stage.formula}
          </span>
        </div>
        {rowForward ? (
          <LinearForwardMotion
            trace={trace}
            frame={frame}
            lang={lang}
            speed={speed}
            onChoose={choose}
          />
        ) : linearBackward ? (
          <LinearBackwardMotion
            trace={trace}
            stageIndex={stageIndex}
            frame={frame}
            lang={lang}
            speed={speed}
            onChoose={choose}
          />
        ) : (
          <SpatialMotion
            trace={trace}
            stageIndex={stageIndex}
            frame={frame}
            direction={direction}
            demo={demo}
            lang={lang}
            speed={speed}
            onChoose={choose}
          />
        )}
        <div className="nm-progress">
          <input
            type="range"
            min="0"
            max={frames.length}
            value={cursor + 1}
            aria-label={ui.progress}
            onChange={(e) => {
              setPlaying(false);
              setCursor(Number(e.target.value) - 1);
            }}
          />
          <output>
            {cursor + 1} / {frames.length}
          </output>
        </div>
        <p className="nm-legend">{ui.legend}</p>
      </section>
      <p className="nm-explanation">{explanation || stage.formula}</p>
      <p className="nm-note">{!rowForward ? ui.linearWeightHint : ui.hint}</p>
      <p className="nm-note">{ui.rounded}</p>
      <noscript>{ui.noScript}</noscript>
    </div>
  );
}
