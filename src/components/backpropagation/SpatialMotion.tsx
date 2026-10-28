import { useEffect, useState, type CSSProperties } from 'react';
import {
  at,
  displayName,
  linearBackwardTiming,
  numberText,
  sameRef,
  type Direction,
  type Frame,
  type MotionTrace,
} from '../../lib/backpropagation-motion';
import {
  isResidualJunction,
  operationBoards,
  operationPlan,
  pointOnBoard,
  type Point,
} from '../../lib/backpropagation-layout';
import type { Demo, Ref } from '../../lib/backpropagation-toy';
import { motionUi } from '../../lib/backpropagation-motion-i18n';
import type { Language } from '../../lib/site';
import './spatial-motion.css';

type Props = {
  trace: MotionTrace;
  stageIndex: number;
  frame: Frame | null;
  demo: Demo;
  direction: Direction;
  lang: Language;
  speed: number;
  onChoose: (name: string, row: number, col: number) => void;
};

/** A step includes travel, immediate arithmetic, a short hold, and storage. */
function useStepAnimation(active: boolean, speed: number) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timers: number[] = [];
    let raf = 0;
    const finish = () => {
      if (media.matches) {
        cancelAnimationFrame(raf);
        timers.forEach(window.clearTimeout);
        setPhase(4);
      }
    };
    media.addEventListener('change', finish);
    if (media.matches) setPhase(4);
    else {
      // Paint operands at their source before interpolating their positions.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          setPhase(1);
          timers.push(
            window.setTimeout(
              () => setPhase(2),
              linearBackwardTiming.move / speed,
            ),
            window.setTimeout(
              () => setPhase(3),
              linearBackwardTiming.store / speed,
            ),
            window.setTimeout(
              () => setPhase(4),
              linearBackwardTiming.arrive / speed,
            ),
          );
        });
      });
    }
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(window.clearTimeout);
      media.removeEventListener('change', finish);
    };
  }, [active, speed]);
  return phase;
}
function Token({
  value,
  position,
  visible,
  result = false,
  caption = '',
  captionBelow = false,
  color = 1,
}: {
  value: number;
  position: Point;
  visible: boolean;
  result?: boolean;
  caption?: string;
  captionBelow?: boolean;
  color?: number;
}) {
  return (
    <g
      className={`sm-token ${result ? 'sm-result' : `sm-operand operand-${color}`}`}
      style={{
        transform: `translate(${position.x}px,${position.y}px)`,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    >
      <rect x="-39" y="-22" width="78" height="44" rx="3" />
      <text
        className="sm-value"
        textAnchor="middle"
        dominantBaseline="middle"
        y="1"
      >
        {numberText(value)}
      </text>
      {caption && (
        <text
          className="sm-ref"
          textAnchor="middle"
          y={captionBelow ? 39 : -30}
        >
          {caption}
        </text>
      )}
    </g>
  );
}

export function SpatialMotion(props: Props) {
  // Seeking, selecting a cell, and changing stages each start a complete, cancellable step.
  return (
    <SpatialScene
      key={`${props.demo}-${props.direction}-${props.stageIndex}-${props.frame?.calculation ?? -1}-${props.speed}`}
      {...props}
    />
  );
}
function SpatialScene({
  trace,
  stageIndex,
  frame,
  demo,
  direction,
  lang,
  speed,
  onChoose,
}: Props) {
  const ui = motionUi[lang];
  const stage = trace.stages[stageIndex];
  const calculation = frame ? stage.calculations[frame.calculation] : null;
  const boards = operationBoards(stage, demo);
  const plan = calculation
    ? operationPlan(stage, calculation, boards, demo)
    : null;
  const phase = useStepAnimation(Boolean(frame), speed);
  const junction = isResidualJunction(demo, stage.id);
  const split = junction && stage.id === 'dSkip';
  const nameOf = (name: string) =>
    name === 'G' && demo === 'attention' ? '∂L/∂O' : displayName(name);
  const refName = (ref: Ref) =>
    `${nameOf(ref.name)}[${ref.row}${trace.arrays[ref.name][0].length > 1 ? `,${ref.col}` : ''}]`;
  const style = {
    '--spatial-duration': `${linearBackwardTiming.move / speed}ms`,
  } as CSSProperties;
  return (
    <div
      className="nm-canvas-scroll"
      role="region"
      tabIndex={0}
      aria-label={ui.viewport}
    >
      <svg
        className="nm-canvas sm-canvas"
        style={style}
        viewBox={`0 0 1040 ${junction ? 480 : 750}`}
        role="group"
        aria-label={ui.spatialViewport}
        data-animation-phase={phase}
        data-stage={stage.id}
      >
        {split && (
          <g className="sm-branches" aria-hidden="true">
            {[0, 1].map((i) => (
              <path
                key={i}
                d={`M790 ${180 + i * 180} H735 Q710 ${180 + i * 180} 710 ${125 + i * 180} H170 V${150 + i * 180} M500 ${125 + i * 180} V${150 + i * 180}`}
              />
            ))}
          </g>
        )}
        {boards.map((board) => {
          const values = trace.arrays[board.name];
          const note = board.target
            ? ui.result
            : board.name === 'G' ||
                (['x', 'X', 'W', 'WQ', 'WK', 'WV'].includes(board.name) &&
                  direction === 'forward')
              ? ui.given
              : board.name.startsWith('d') ||
                  board.name === 'm' ||
                  direction === 'forward'
                ? ui.available
                : ui.saved;
          return (
            <g key={board.name} data-array={board.name}>
              <text
                className={`nm-array-title ${board.target ? 'target-title' : ''}`}
                x={board.x - 39}
                y={board.y - (junction ? 95 : board === boards[0] ? 138 : 65)}
              >
                {nameOf(board.name)}
              </text>
              <text
                className="nm-array-kind"
                x={board.x - 39}
                y={board.y - (junction ? 74 : board === boards[0] ? 117 : 44)}
              >
                {note} · {values.length} × {values[0].length}
              </text>
              {values.map((row, i) =>
                row.map((value, j) => {
                  const ref = { name: board.name, row: i, col: j };
                  const point = pointOnBoard(boards, ref);
                  const index = i * row.length + j;
                  const selected =
                    plan?.results.some((r) => sameRef(r.ref, ref)) ?? false;
                  const computed =
                    !board.target ||
                    Boolean(
                      frame &&
                      (index < frame.calculation ||
                        (index === frame.calculation && phase === 4)),
                    );
                  const used = plan?.refs.some((r) => sameRef(r, ref));
                  const shown = computed ? numberText(value) : '·';
                  return (
                    <g
                      key={`${i}-${j}`}
                      className={`nm-cell ${computed ? 'computed' : ''} ${board.target ? 'clickable' : ''} ${selected ? 'destination' : ''} ${used ? (board === boards[0] ? 'operand-0' : 'operand-1') : ''}`}
                      transform={`translate(${point.x - 39},${point.y - 22})`}
                      data-cell={`${board.name}-${i}-${j}`}
                      data-value={computed ? String(value) : ''}
                      role={board.target ? 'button' : undefined}
                      tabIndex={board.target ? 0 : undefined}
                      aria-label={`${refName(ref)}: ${shown}`}
                      aria-pressed={board.target ? selected : undefined}
                      onClick={
                        board.target
                          ? () => onChoose(board.name, i, j)
                          : undefined
                      }
                      onKeyDown={
                        board.target
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onChoose(board.name, i, j);
                              }
                            }
                          : undefined
                      }
                    >
                      <rect width="78" height="44" rx="3" />
                      <text
                        x="39"
                        y="23"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {shown}
                      </text>
                    </g>
                  );
                }),
              )}
            </g>
          );
        })}
        {plan?.copies.map((copy, index) => (
          <Token
            key={`operand-${index}`}
            value={at(trace.arrays, copy.ref)}
            position={phase >= 1 ? copy.to : pointOnBoard(boards, copy.ref)}
            visible
            color={copy.color}
            caption={refName(copy.ref)}
            captionBelow={copy.captionBelow}
          />
        ))}
        <g
          className="sm-symbols"
          style={{ opacity: plan && phase >= 2 ? 1 : 0 }}
          aria-hidden="true"
        >
          {plan?.symbols.map((symbol, i) => (
            <text
              key={i}
              x={symbol.x}
              y={symbol.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {symbol.text}
            </text>
          ))}
        </g>
        {plan?.masked && (
          <text className="sm-mask" x="100" y={plan.results[0].from.y}>
            {phase >= 2
              ? `${ui.causalMask} · ${calculation!.target.col} > ${calculation!.target.row}`
              : ''}
          </text>
        )}
        {plan?.results.map((result) => (
          <Token
            key={`result-${result.ref.name}`}
            value={at(trace.arrays, result.ref)}
            position={
              phase >= 3 ? pointOnBoard(boards, result.ref) : result.from
            }
            visible={phase >= 2 && phase < 4}
            result
          />
        ))}
      </svg>
    </div>
  );
}
