export type Vector3 = readonly number[];
export const defaultView = { yaw: -0.65, pitch: 0.5, zoom: 1 };
export type PlotView = typeof defaultView;
export const vectorColors = {
  token: '#1e5b49',
  position: '#ac551f',
  sum: '#6850a1',
};

// Orthographic projection: rotate the actual three components, with one scale
// shared by all axes. No dimensionality reduction or per-vector normalization.
export function projectVector(v: Vector3, view: PlotView, extent: number) {
  const horizontal = Math.cos(view.yaw) * v[0] + Math.sin(view.yaw) * v[1];
  const depth = -Math.sin(view.yaw) * v[0] + Math.cos(view.yaw) * v[1];
  const vertical = Math.cos(view.pitch) * v[2] - Math.sin(view.pitch) * depth;
  const scale = (150 / extent) * view.zoom;
  return [320 + horizontal * scale, 220 - vertical * scale];
}

export function vectorScene(
  token: Vector3,
  position: Vector3,
  extent: number,
  view: PlotView,
  shift: number,
) {
  const zero = [0, 0, 0];
  const sum = token.map((value, c) => Math.fround(value + position[c]));
  const start = token.map((value) => value * shift);
  const end = start.map((value, c) => value + position[c]);
  const path = (from: Vector3, to: Vector3) => {
    const a = projectVector(from, view, extent);
    const b = projectVector(to, view, extent);
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
  };
  const lines: {
    key: string;
    d: string;
    color: string;
    width: number;
    dashed: boolean;
    arrow: string;
    opacity: number;
  }[] = [];
  const labels: { text: string; x: number; y: number; color: string }[] = [];
  // A reference grid on c2 = 0, plus three signed coordinate axes.
  for (const step of [-1, -0.5, 0, 0.5, 1]) {
    const value = step * extent;
    for (const axis of [0, 1]) {
      const a = axis === 0 ? [-extent, value, 0] : [value, -extent, 0];
      const b = axis === 0 ? [extent, value, 0] : [value, extent, 0];
      lines.push({
        key: `grid-${axis}-${step}`,
        d: path(a, b),
        color: '#dcdcd5',
        width: 1,
        dashed: false,
        arrow: '',
        opacity: 1,
      });
    }
  }
  for (let c = 0; c < 3; c++) {
    const a = [0, 0, 0],
      b = [0, 0, 0];
    a[c] = -extent;
    b[c] = extent;
    lines.push({
      key: `axis-${c}`,
      d: path(a, b),
      color: '#747970',
      width: 1.2,
      dashed: false,
      arrow: '',
      opacity: 1,
    });
    for (const sign of [-1, 1]) {
      const v = [0, 0, 0];
      v[c] = sign * extent * 1.18;
      const [x, y] = projectVector(v, view, extent);
      labels.push({
        text: `${sign > 0 ? `c${c} ` : ''}${(sign * extent).toFixed(2)}`,
        x: x + 5,
        y: y - 8,
        color: '#747970',
      });
    }
  }
  const vectors = [
    {
      key: 'position-origin',
      from: zero,
      to: position,
      color: vectorColors.position,
      arrow: '',
      dashed: true,
      opacity: shift > 0 ? 0.55 : 0,
    },
    {
      key: 'sum',
      from: zero,
      to: sum,
      color: vectorColors.sum,
      arrow: 'sum',
      dashed: false,
      opacity: 1,
    },
    {
      key: 'token',
      from: zero,
      to: token,
      color: vectorColors.token,
      arrow: 'token',
      dashed: false,
      opacity: 1,
    },
    {
      key: 'position',
      from: start,
      to: end,
      color: vectorColors.position,
      arrow: 'position',
      dashed: false,
      opacity: 1,
    },
  ];
  for (const vector of vectors) {
    lines.push({
      ...vector,
      d: path(vector.from, vector.to),
      width: vector.dashed ? 1.5 : 3,
    });
  }
  for (const [text, point, color] of [
    ['0', zero, '#747970'],
    ['e', token, vectorColors.token],
    ['p', end, vectorColors.position],
    ['e + p', sum, vectorColors.sum],
  ] as const) {
    const [x, y] = projectVector(point, view, extent);
    // Label the translated position arrow at its midpoint to separate P from T+P.
    const at =
      text === 'p'
        ? projectVector(
            start.map((value, c) => (value + end[c]) / 2),
            view,
            extent,
          )
        : [x, y];
    labels.push({
      text,
      x: at[0] + 8,
      y: at[1] + (text === 'e + p' ? 28 : 16),
      color,
    });
  }
  return { lines, labels };
}

export function mountVectorPlot(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const lineGroup = svg.querySelector('[data-plot-lines]')!;
  const labelGroup = svg.querySelector('[data-plot-labels]')!;
  const shift = root.querySelector<HTMLInputElement>('[data-shift]')!;
  const zoom = root.querySelector<HTMLInputElement>('[data-zoom]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-view-reset]')!;
  const compact = window.matchMedia('(max-width: 480px)');
  const resize = () =>
    svg.setAttribute(
      'viewBox',
      compact.matches ? '100 0 440 440' : '0 0 640 440',
    );
  compact.addEventListener('change', resize);
  resize();
  const extent = Number(root.dataset.extent);
  let token: Vector3 = JSON.parse(root.dataset.token!);
  let position: Vector3 = JSON.parse(root.dataset.position!);
  let view = { ...defaultView };

  function render() {
    const scene = vectorScene(
      token,
      position,
      extent,
      view,
      shift.checked ? 1 : 0,
    );
    scene.lines.forEach((line, i) => {
      const node = lineGroup.children[i];
      node.setAttribute('d', line.d);
      node.setAttribute('opacity', String(line.opacity));
    });
    scene.labels.forEach((label, i) => {
      const node = labelGroup.children[i];
      node.setAttribute('x', String(label.x));
      node.setAttribute('y', String(label.y));
    });
    root.querySelector('[data-zoom-value]')!.textContent =
      `${view.zoom.toFixed(1)}×`;
  }

  // Pointer capture keeps orbiting smooth when the pointer leaves the plot.
  let drag: { id: number; x: number; y: number } | undefined;
  svg.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
    svg.focus();
  });
  svg.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    view.yaw += (event.clientX - drag.x) * 0.01;
    view.pitch = Math.max(
      -1.45,
      Math.min(1.45, view.pitch + (event.clientY - drag.y) * 0.01),
    );
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
  });
  const stop = () => {
    drag = undefined;
  };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);
  svg.addEventListener('lostpointercapture', stop);
  svg.addEventListener('keydown', (event) => {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    if (event.key === 'Home') {
      view = { ...defaultView };
      zoom.value = '1';
    } else {
      view.yaw +=
        event.key === 'ArrowLeft'
          ? -0.12
          : event.key === 'ArrowRight'
            ? 0.12
            : 0;
      view.pitch = Math.max(
        -1.45,
        Math.min(
          1.45,
          view.pitch +
            (event.key === 'ArrowUp'
              ? -0.12
              : event.key === 'ArrowDown'
                ? 0.12
                : 0),
        ),
      );
    }
    render();
  });
  shift.disabled = zoom.disabled = reset.disabled = false;
  shift.addEventListener('change', render);
  zoom.addEventListener('input', () => {
    view.zoom = Number(zoom.value);
    render();
  });
  reset.addEventListener('click', () => {
    view = { ...defaultView };
    zoom.value = '1';
    render();
  });
  return (nextToken: Vector3, nextPosition: Vector3) => {
    token = nextToken;
    position = nextPosition;
    render();
  };
}
