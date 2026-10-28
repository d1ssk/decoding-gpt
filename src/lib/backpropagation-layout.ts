import {
  type Calculation,
  type MotionStage,
} from './backpropagation-motion.ts';
import type { Demo, Ref } from './backpropagation-toy.ts';

export type Point = { x: number; y: number };
export type MotionBoard = Point & {
  name: string;
  dx: number;
  dy: number;
  target: boolean;
};
export type MovingOperand = {
  ref: Ref;
  to: Point;
  color: number;
  captionBelow?: boolean;
};
export type OperationSymbol = Point & { text: string };
export type OperationPlan = {
  copies: MovingOperand[];
  symbols: OperationSymbol[];
  results: { ref: Ref; from: Point }[];
  refs: Ref[];
  masked: boolean;
};
export const pointOnBoard = (boards: MotionBoard[], ref: Ref): Point => {
  const board = boards.find((b) => b.name === ref.name)!;
  return { x: board.x + ref.col * board.dx, y: board.y + ref.row * board.dy };
};
export const isResidualJunction = (demo: Demo, id: string) =>
  demo === 'residual' && ['y', 'dSkip', 'dx'].includes(id);

/** Arrays stay fixed within a stage. Reserve room beside each row/column for arithmetic. */
export function operationBoards(stage: MotionStage, demo: Demo): MotionBoard[] {
  if (isResidualJunction(demo, stage.id)) {
    const names =
      stage.id === 'y'
        ? ['x', 'F', 'y']
        : stage.id === 'dx'
          ? ['dSkip', 'dBranch', 'dx']
          : ['dSkip', 'dF', 'G'];
    return names.map((name, i) => ({
      name,
      x: 170 + 330 * i,
      y: 180,
      dx: 90,
      dy: 180,
      target: stage.id === 'dSkip' ? i < 2 : i === 2,
    }));
  }
  let primary = stage.sources[0];
  if (demo === 'residual' && stage.id === 'dW') primary = 'x';
  if (demo === 'attention' && ['Q', 'K', 'V'].includes(stage.id))
    primary = `W${stage.id}`;
  const others = stage.sources.filter((name) => name !== primary);
  return [
    { name: primary, x: 130, y: 180, dx: 180, dy: 150, target: false },
    ...others.map((name, i) => ({
      name,
      x: 800,
      y: 130 + i * 230,
      dx: 82,
      dy: 54,
      target: false,
    })),
    { name: stage.id, x: 800, y: 590, dx: 82, dy: 60, target: true },
  ];
}

/** Describe the actual operands and operators, adjacent to the selected source cells. */
export function operationPlan(
  stage: MotionStage,
  calculation: Calculation,
  boards: MotionBoard[],
  demo: Demo,
): OperationPlan {
  const plan: OperationPlan = {
    copies: [],
    symbols: [],
    refs: calculation.terms.flatMap((t) => t.factors),
    results: [],
    masked:
      calculation.terms.length === 0 ||
      calculation.terms.some((t) => t.scale === -Infinity),
  };
  const symbol = (text: string, x: number, y: number) =>
    plan.symbols.push({ text, x, y });
  const copy = (ref: Ref, to: Point, color = 1, captionBelow = false) =>
    plan.copies.push({ ref, to, color, captionBelow });
  const result = (ref: Ref, from: Point) => plan.results.push({ ref, from });
  const target = calculation.target;
  if (isResidualJunction(demo, stage.id)) {
    const y = 180 + target.row * 180;
    if (stage.id === 'dSkip') {
      for (const [name, x] of [
        ['dSkip', 260],
        ['dF', 590],
      ] as const) {
        copy(calculation.terms[0].factors[0], { x, y });
        symbol('× 1 =', x + 70, y);
        result({ name, row: target.row, col: 0 }, { x: x + 140, y });
      }
    } else {
      copy(calculation.terms[1].factors[0], { x: 270, y });
      symbol('+', 220, y);
      symbol('=', 340, y);
      result(target, { x: 410, y });
    }
    return plan;
  }
  const primary = boards[0].name;
  const anchor = (ref: Ref) => pointOnBoard(boards, ref);
  if (plan.masked) {
    result(target, { x: 680, y: 148 + target.row * 150 });
    return plan;
  }
  if (stage.id === 'dS') {
    // Factor the two model terms A*dA - A*m into A*(dA-m).
    const [a, da] = calculation.terms[0].factors;
    const m = calculation.terms[1].factors[1];
    const pos = anchor(a);
    copy(da, { x: pos.x - 52, y: pos.y - 74 });
    copy(m, { x: pos.x + 52, y: pos.y - 74 });
    symbol('(', pos.x - 103, pos.y - 74);
    symbol('−', pos.x, pos.y - 74);
    symbol(')', pos.x + 103, pos.y - 74);
    symbol('×', pos.x, pos.y - 34);
    symbol('=', 615, pos.y - 34);
    result(target, { x: 680, y: pos.y - 34 });
    return plan;
  }
  const terms = calculation.terms;
  const primaryRefs = terms.map((term) =>
    term.factors.find((ref) => ref.name === primary)!,
  );
  const first = anchor(primaryRefs[0]);
  const elementwiseSum =
    terms.length > 1 &&
    terms.every((t) => t.factors.length === 1) &&
    !terms.every((t) => t.factors[0].name === primary);
  if (elementwiseSum) {
    // Contributions from several paths align vertically with the original element.
    terms.slice(1).forEach((term, i) => {
      const offset = i === 0 ? -68 : 68;
      copy(term.factors[0], { x: first.x, y: first.y + offset }, 1, offset > 0);
      symbol('+', first.x, first.y + offset / 2);
    });
    symbol('=', 615, first.y);
    result(target, { x: 680, y: first.y });
    return plan;
  }
  if (terms[0].operation === 'divide') {
    copy(terms[0].factors[1], { x: first.x, y: first.y + 68 }, 1, true);
    symbol('÷', first.x, first.y + 34);
    symbol('=', 615, first.y + 34);
    result(target, { x: 680, y: first.y + 34 });
    return plan;
  }
  const column =
    primaryRefs.length > 1 &&
    primaryRefs.every((ref) => ref.col === primaryRefs[0].col) &&
    new Set(primaryRefs.map((ref) => ref.row)).size > 1;
  const paired = terms.some((t) => t.factors.length > 1);
  const resultPos = column
    ? { x: first.x + (paired ? 44 : 0), y: 590 }
    : { x: 680, y: first.y - (paired ? 34 : 0) };
  terms.forEach((term, index) => {
    const pos = anchor(primaryRefs[index]);
    const other = term.factors.find((ref) => ref.name !== primary);
    if (other) {
      copy(
        other,
        column ? { x: pos.x + 88, y: pos.y } : { x: pos.x, y: pos.y - 68 },
      );
      symbol(
        term.operation === 'divide' ? '÷' : '×',
        column ? pos.x + 44 : pos.x,
        column ? pos.y : pos.y - 34,
      );
    }
    if (term.operation === 'exp') {
      // The selected score itself remains the argument of exp.
      symbol('exp(', pos.x - 65, pos.y);
      symbol(')', pos.x + 49, pos.y);
    }
    if (index > 0) {
      const previous = anchor(primaryRefs[index - 1]);
      symbol(
        '+',
        column ? resultPos.x : (previous.x + pos.x) / 2,
        column ? (previous.y + pos.y) / 2 : resultPos.y,
      );
    }
  });
  const scaled = terms[0].scale !== 1;
  if (scaled && !column) {
    // Parentheses make it explicit that the whole dot product is scaled.
    const last = anchor(primaryRefs[primaryRefs.length - 1]);
    symbol('(', first.x - 60, resultPos.y);
    symbol(')', last.x + 60, resultPos.y);
    symbol('÷ √2', last.x + 105, resultPos.y);
    resultPos.x = 700;
  } else if (scaled) symbol('÷ √2', resultPos.x, 525);
  symbol(
    '=',
    column ? resultPos.x : scaled ? 635 : 615,
    column ? 552 : resultPos.y,
  );
  result(target, resultPos);
  return plan;
}
