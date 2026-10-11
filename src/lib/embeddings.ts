// All three numeric tables use the same color scale.
export const embeddingColor = (value: number) => {
  const alpha = Math.min(Math.abs(value) / 0.08, 1) * 0.25;
  return `rgba(${value >= 0 ? '30, 91, 73' : '150, 75, 25'}, ${alpha})`;
};

export const formatEmbedding = (value: number) => value.toFixed(4);
