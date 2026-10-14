// Small helpers shared by the SVG charts. They run both at build time
// (initial markup) and in the browser (updates after interaction).

export interface Scale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
}

export const linearScale = (
  domain: [number, number],
  range: [number, number],
): Scale => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = ((value: number) =>
    r0 + ((value - d0) / (d1 - d0 || 1)) * (r1 - r0)) as Scale;
  scale.domain = domain;
  scale.range = range;
  return scale;
};

export const logScale = (
  domain: [number, number],
  range: [number, number],
): Scale => {
  const inner = linearScale(
    [Math.log10(domain[0]), Math.log10(domain[1])],
    range,
  );
  const scale = ((value: number) => inner(Math.log10(value))) as Scale;
  scale.domain = domain;
  scale.range = range;
  return scale;
};

// Round tick values for a linear domain.
export const ticks = (min: number, max: number, count = 5) => {
  const span = max - min || 1;
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => span / s <= count) ??
    10 * power;
  const first = Math.ceil(min / step - 1e-9) * step;
  const values: number[] = [];
  for (let v = first; v <= max + step * 1e-9; v += step) {
    values.push(Number(v.toPrecision(12)));
  }
  return values;
};

// Powers of ten inside a positive domain.
export const logTicks = (min: number, max: number) => {
  const values: number[] = [];
  for (
    let p = Math.ceil(Math.log10(min));
    p <= Math.floor(Math.log10(max));
    p++
  ) {
    values.push(10 ** p);
  }
  return values;
};

export const linePath = (
  points: [number, number][],
  x: (value: number) => number,
  y: (value: number) => number,
) =>
  points
    .map(
      ([px, py], i) =>
        `${i === 0 ? 'M' : 'L'}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
    )
    .join(' ');

export const formatCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${Number((value / 1e9).toPrecision(3))}G`;
  if (abs >= 1e6) return `${Number((value / 1e6).toPrecision(3))}M`;
  if (abs >= 1e3) return `${Number((value / 1e3).toPrecision(3))}k`;
  return `${Number(value.toPrecision(3))}`;
};

// Exponential moving average used to make noisy per-iteration losses readable.
export const smooth = (values: number[], weight: number) => {
  let last = values[0];
  return values.map((value) => (last = weight * last + (1 - weight) * value));
};

// Readable labels for characters, including whitespace.
export const charLabel = (char: string) =>
  char === '\n' ? '\\n' : char === ' ' ? '␣' : char;

export const softmax = (logits: number[]) => {
  const finite = logits.filter(Number.isFinite);
  const max = Math.max(...finite);
  const exps = logits.map((v) => (Number.isFinite(v) ? Math.exp(v - max) : 0));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
};
