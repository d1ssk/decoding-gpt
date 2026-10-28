import type { CSSProperties } from 'react';
import type { Frame, MotionTrace } from '../../lib/backpropagation-motion';
import type { Language } from '../../lib/site';
import { motionUi } from '../../lib/backpropagation-motion-i18n';
import { numberText } from '../../lib/backpropagation-motion';
import './linear-forward-motion.css';

/** The input vector unfolds beside a complete row; the arrays stay in place. */
export function LinearForwardMotion({
  trace,
  frame,
  lang,
  speed,
  onChoose,
}: {
  trace: MotionTrace;
  frame: Frame | null;
  lang: Language;
  speed: number;
  onChoose: (name: string, row: number, col: number) => void;
}) {
  const ui = motionUi[lang];
  const { W, x, y } = trace.arrays;
  const row = frame?.calculation ?? 0;
  const phase = frame?.phase ?? -1;
  const active = frame !== null;
  const columnX = (j: number) => 170 + j * 180;
  const rowY = (i: number) => 180 + i * 160;
  const inputY = rowY(row) - 74;
  const outputX = 885;
  const resultX = 720;
  const resultY = rowY(row) - 37;
  const movingStyle = {
    '--row-motion-duration': `${800 / speed}ms`,
  } as CSSProperties;

  return (
    <div
      className="nm-canvas-scroll"
      role="region"
      tabIndex={0}
      aria-label={ui.viewport}
    >
      <svg
        className="nm-canvas lf-canvas"
        style={movingStyle}
        viewBox="0 0 1000 425"
        role="group"
        aria-label={ui.linearRowViewport}
      >
        <text className="nm-array-title" x="110" y="46">
          W
        </text>
        <text className="nm-array-kind" x="110" y="66">
          {ui.given} · {W.length} × {W[0].length}
        </text>
        <g className="lf-original-heading" style={{ opacity: active ? 0 : 1 }}>
          <text className="nm-array-title" x="705" y="46">
            x
          </text>
          <text className="nm-array-kind" x="705" y="66">
            {ui.given} · {x.length} × 1
          </text>
          <text className="nm-equation-sign" x="630" y="260">
            ×
          </text>
          <text className="nm-equation-sign" x="800" y="260">
            =
          </text>
        </g>
        <text className="nm-array-title target-title" x="855" y="46">
          y
        </text>
        <text className="nm-array-kind" x="855" y="66">
          {ui.result} · {y.length} × 1
        </text>
        {W.map((values, i) => (
          <g key={i} data-array-row={i}>
            <text
              className="lf-row-index"
              x="100"
              y={rowY(i) + 3}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {i}
            </text>
            {values.map((value, j) => (
              <g
                key={j}
                className={`nm-cell computed ${active && row === i ? 'operand-0' : ''}`}
                transform={`translate(${columnX(j) - 33},${rowY(i) - 23})`}
                data-cell={`W-${i}-${j}`}
                data-value={value}
              >
                <rect x="0" y="0" width="66" height="46" rx="3" />
                <text
                  x="33"
                  y="24"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {numberText(value)}
                </text>
              </g>
            ))}
          </g>
        ))}
        <path
          className="nm-bracket lf-original-bracket"
          style={{ opacity: active ? 0 : 1 }}
          d="M126 153 h-9 v214 h9 M574 153 h9 v214 h-9 M689 176 h-7 v168 h7 M771 176 h7 v168 h-7"
        />
        {/* Keep the same three elements mounted so both the unfolding and downward move interpolate. */}
        {x.map(([value], j) => (
          <g
            key={j}
            className="lf-input-number nm-cell operand-1 computed"
            style={{
              transform: `translate(${active ? columnX(j) - 33 : 697}px,${active ? inputY - 23 : 177 + j * 60}px)`,
            }}
            data-cell={`x-${j}-0`}
            data-value={value}
          >
            <rect x="0" y="0" width="66" height="46" rx="3" />
            <text x="33" y="24" textAnchor="middle" dominantBaseline="middle">
              {numberText(value)}
            </text>
          </g>
        ))}
        <g
          className="lf-input-label"
          style={{
            transform: `translate(100px,${inputY}px)`,
            opacity: active ? 1 : 0,
          }}
        >
          <text textAnchor="end" dominantBaseline="middle">
            x
          </text>
        </g>
        <g
          className="lf-operators"
          style={{
            transform: `translate(0px,${resultY}px)`,
            opacity: phase >= 1 ? 1 : 0,
          }}
          aria-hidden="true"
        >
          {x.map((_, j) => (
            <text
              key={`multiply-${j}`}
              className="lf-multiply"
              x={columnX(j)}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              ×
            </text>
          ))}
          {x.slice(1).map((_, j) => (
            <text
              key={`plus-${j}`}
              className="lf-plus"
              x={columnX(j) + 90}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              +
            </text>
          ))}
          <text
            className="lf-plus"
            x="645"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            =
          </text>
        </g>
        {y.map(([value], i) => {
          const computed = active && (i < row || (i === row && phase === 3));
          const selected = active && row === i;
          const shown = computed ? numberText(value) : '·';
          return (
            <g
              key={i}
              className={`nm-cell clickable ${computed ? 'computed' : ''} ${selected ? 'destination' : ''}`}
              transform={`translate(${outputX - 33},${rowY(i) - 23})`}
              data-cell={`y-${i}-0`}
              data-value={computed ? value : ''}
              role="button"
              tabIndex={0}
              aria-label={`y[${i}]: ${shown}`}
              aria-pressed={selected}
              onClick={() => onChoose('y', i, 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChoose('y', i, 0);
                }
              }}
            >
              <rect x="0" y="0" width="66" height="46" rx="3" />
              <text x="33" y="24" textAnchor="middle" dominantBaseline="middle">
                {shown}
              </text>
            </g>
          );
        })}
        <path
          className="nm-bracket"
          d="M844 153 h-7 v214 h7 M926 153 h7 v214 h-7"
        />
        {/* One result per row: first appears beside the dot product, then enters y. */}
        {y.map(([value], i) => (
          <g
            key={i}
            className="lf-result"
            style={{
              transform: `translate(${active && row === i && phase === 3 ? outputX : resultX}px,${active && row === i && phase === 3 ? rowY(i) : rowY(i) - 37}px)`,
              opacity: active && row === i && phase >= 2 ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <rect x="-33" y="-23" width="66" height="46" rx="3" />
            <text textAnchor="middle" dominantBaseline="middle" y="1">
              {numberText(value)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
