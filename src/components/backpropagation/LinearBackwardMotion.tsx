import { useEffect, useState, type CSSProperties } from 'react';
import { linearBackwardTiming } from '../../lib/backpropagation-motion';
import type { Frame, MotionTrace } from '../../lib/backpropagation-motion';
import type { Language } from '../../lib/site';
import { motionUi } from '../../lib/backpropagation-motion-i18n';
import { numberText } from '../../lib/backpropagation-motion';
import './linear-backward-motion.css';

type CellProps = {
  name: string;
  row: number;
  col?: number;
  value: number;
  x: number;
  y: number;
  color?: string;
  computed?: boolean;
  selected?: boolean;
  onChoose?: (name: string, row: number, col: number) => void;
};
function Cell({
  name,
  row,
  col = 0,
  value,
  x,
  y,
  color = '',
  computed = true,
  selected = false,
  onChoose,
}: CellProps) {
  const shown = computed ? numberText(value) : '·';
  return (
    <g
      className={`nm-cell ${computed ? 'computed' : ''} ${color} ${selected ? 'destination' : ''} ${onChoose ? 'clickable' : ''}`}
      transform={`translate(${x - 30},${y - 22})`}
      data-cell={`${name}-${row}-${col}`}
      data-value={computed ? value : ''}
      role={onChoose ? 'button' : undefined}
      tabIndex={onChoose ? 0 : undefined}
      aria-label={`${name}[${row},${col}]: ${shown}`}
      aria-pressed={onChoose ? selected : undefined}
      onClick={onChoose ? () => onChoose(name, row, col) : undefined}
      onKeyDown={
        onChoose
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChoose(name, row, col);
              }
            }
          : undefined
      }
    >
      <rect width="60" height="44" rx="3" />
      <text x="30" y="23" textAnchor="middle" dominantBaseline="middle">
        {shown}
      </text>
    </g>
  );
}
function Heading({
  x,
  y = 42,
  name,
  note,
}: {
  x: number;
  y?: number;
  name: string;
  note: string;
}) {
  return (
    <g>
      <text className="nm-array-title" x={x} y={y}>
        {name}
      </text>
      <text className="nm-array-kind" x={x} y={y + 21}>
        {note}
      </text>
    </g>
  );
}
function Token({
  value,
  x,
  y,
  visible,
  color,
  className = '',
}: {
  value: number;
  x: number;
  y: number;
  visible: boolean;
  color: string;
  className?: string;
}) {
  return (
    <g
      className={`lb-moving-token ${color} ${className}`}
      style={{
        transform: `translate(${x}px,${y}px)`,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    >
      <rect x="-30" y="-22" width="60" height="44" rx="3" />
      <text textAnchor="middle" dominantBaseline="middle" y="1">
        {numberText(value)}
      </text>
    </g>
  );
}

export function LinearBackwardMotion({
  trace,
  stageIndex,
  frame,
  lang,
  speed,
  onChoose,
}: {
  trace: MotionTrace;
  stageIndex: number;
  frame: Frame | null;
  lang: Language;
  speed: number;
  onChoose: (name: string, row: number, col: number) => void;
}) {
  const ui = motionUi[lang];
  const { W, x, G, dW, dx } = trace.arrays;
  const weight = trace.stages[stageIndex].id === 'dW';
  const active = frame !== null;
  // Each transport step runs one complete calculation. Only movement is animated;
  // operators and the result appear together as soon as the operands arrive.
  const [animation, setAnimation] = useState({
    frame,
    stageIndex,
    speed,
    phase: 0,
  });
  const phase =
    animation.frame === frame &&
    animation.stageIndex === stageIndex &&
    animation.speed === speed
      ? animation.phase
      : 0;
  useEffect(() => {
    const update = (phase: number) =>
      setAnimation({ frame, stageIndex, speed, phase });
    update(0);
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update(4);
      return;
    }
    const timers = [
      window.setTimeout(() => update(2), linearBackwardTiming.move / speed),
      window.setTimeout(() => update(3), linearBackwardTiming.store / speed),
      window.setTimeout(() => update(4), linearBackwardTiming.arrive / speed),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [frame, stageIndex, speed]);
  const target = frame
    ? trace.stages[stageIndex].calculations[frame.calculation].target
    : null;
  const row = target?.row ?? 0;
  const column = target?.row ?? 0;
  const inputIndex = target?.col ?? 0;
  const inputY = (j: number) => 120 + 60 * j;
  const cx = (j: number) => 150 + 210 * j;
  const cy = (i: number) => 160 + 150 * i;
  const gradientY = (i: number) => 410 + 60 * i;
  const weightY = (i: number) => 510 + 70 * i;
  const movingStyle = {
    '--backward-motion-duration': `${linearBackwardTiming.move / speed}ms`,
  } as CSSProperties;
  return (
    <div
      className="nm-canvas-scroll"
      role="region"
      tabIndex={0}
      aria-label={ui.viewport}
    >
      <svg
        className="nm-canvas lb-canvas"
        style={movingStyle}
        viewBox="0 0 1000 640"
        role="group"
        aria-label={weight ? ui.linearWeightViewport : ui.linearInputViewport}
        data-animation-phase={phase}
      >
        <Heading x={100} name="W" note={`${ui.saved} · 2 × 3`} />
        {W.map((values, i) =>
          values.map((v, j) => (
            <Cell
              key={`w-${i}-${j}`}
              name="W"
              row={i}
              col={j}
              value={v}
              x={cx(j)}
              y={cy(i)}
              color={active && !weight && column === j ? 'operand-0' : ''}
            />
          )),
        )}
        <g style={{ opacity: active && !weight ? 0 : 1 }}>
          <Heading x={755} y={345} name="∂L/∂y" note={`${ui.given} · 2 × 1`} />
        </g>
        <Heading x={910} name="x" note={`${ui.saved} · 3 × 1`} />
        {x.map(([v], j) => (
          <Cell
            key={`x-${j}`}
            name="x"
            row={j}
            value={v}
            x={940}
            y={inputY(j)}
            color={active && weight && inputIndex === j ? 'operand-1' : ''}
          />
        ))}
        {G.map(([v], i) => (
          <g
            key={`g-${i}`}
            className={`lb-moving-gradient nm-cell ${active && weight && row === i ? 'operand-0' : 'operand-1'} computed`}
            style={{
              transform: `translate(${active && !weight ? cx(column) + 55 : 780}px,${(active && !weight ? cy(i) : gradientY(i)) - 22}px)`,
            }}
            data-cell={`G-${i}-0`}
            data-value={v}
          >
            <rect width="60" height="44" rx="3" />
            <text x="30" y="23" textAnchor="middle" dominantBaseline="middle">
              {numberText(v)}
            </text>
          </g>
        ))}
        <Heading x={100} y={455} name="∂L/∂W" note={`${ui.result} · 2 × 3`} />
        {dW.map((values, i) =>
          values.map((v, j) => (
            <Cell
              key={`dw-${i}-${j}`}
              name="dW"
              row={i}
              col={j}
              value={v}
              x={cx(j)}
              y={weightY(i)}
              computed={
                weight &&
                active &&
                (i < row ||
                  (i === row &&
                    (j < inputIndex || (j === inputIndex && phase === 4))))
              }
              selected={weight && active && i === row && j === inputIndex}
              onChoose={onChoose}
            />
          )),
        )}
        <Heading x={885} y={350} name="∂L/∂x" note={`${ui.result} · 3 × 1`} />
        {dx.map(([v], j) => (
          <Cell
            key={`dx-${j}`}
            name="dx"
            row={j}
            value={v}
            x={940}
            y={405 + j * 60}
            computed={
              !weight && active && (j < column || (j === column && phase === 4))
            }
            selected={!weight && active && column === j}
            onChoose={onChoose}
          />
        ))}
        {weight ? (
          <>
            {G.map(([v], i) => (
              <Token
                key={`scalar-${i}`}
                value={v}
                x={active && row === i ? 850 : 810}
                y={active && row === i ? inputY(inputIndex) : gradientY(i)}
                visible={active && row === i}
                color="lb-orange"
                className="lb-gradient-scalar"
              />
            ))}
            <g
              className="lb-moving-label"
              style={{
                transform: `translate(850px,${inputY(inputIndex) - 34}px)`,
                opacity: active ? 1 : 0,
              }}
            >
              <text className="lb-small-label" textAnchor="middle">
                ∂L/∂y[{row}]
              </text>
            </g>
            <g
              className="lb-operators"
              style={{
                transform: `translate(0px,${inputY(inputIndex)}px)`,
                opacity: active && phase >= 2 ? 1 : 0,
              }}
              aria-hidden="true"
            >
              <text
                className="lb-multiply"
                x="895"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ×
              </text>
              <text
                className="lb-equals"
                x="795"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                =
              </text>
            </g>
            {dW.map((values, i) =>
              values.map((v, j) => (
                <Token
                  key={`result-${i}-${j}`}
                  value={v}
                  x={
                    active && row === i && inputIndex === j && phase >= 3
                      ? cx(j)
                      : 750
                  }
                  y={
                    active && row === i && inputIndex === j && phase >= 3
                      ? weightY(i)
                      : inputY(j)
                  }
                  visible={
                    active &&
                    row === i &&
                    inputIndex === j &&
                    phase >= 2 &&
                    phase < 4
                  }
                  color="lb-green"
                  className="lb-weight-result"
                />
              )),
            )}
          </>
        ) : (
          <>
            <g
              className="lb-moving-label"
              style={{
                transform: `translate(${cx(column) + 85}px,95px)`,
                opacity: active ? 1 : 0,
              }}
            >
              <text className="lb-blue-label" textAnchor="middle">
                ∂L/∂y
              </text>
            </g>
            <g
              className="lb-operators"
              style={{
                transform: `translate(${cx(column) + 42.5}px,0px)`,
                opacity: active && phase >= 2 ? 1 : 0,
              }}
              aria-hidden="true"
            >
              {G.map((_, i) => (
                <text
                  key={i}
                  className="lb-multiply"
                  y={cy(i)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  ×
                </text>
              ))}
              <text
                className="lb-plus"
                y="235"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                +
              </text>
              <text
                className="lb-equals"
                y="365"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                =
              </text>
            </g>
            {dx.map(([v], j) => (
              <Token
                key={`result-${j}`}
                value={v}
                x={active && column === j && phase >= 3 ? 940 : cx(j) + 42.5}
                y={active && column === j && phase >= 3 ? 405 + j * 60 : 405}
                visible={active && column === j && phase >= 2 && phase < 4}
                color="lb-green"
                className="lb-input-result"
              />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
