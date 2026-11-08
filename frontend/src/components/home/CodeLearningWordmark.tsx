import { useId } from 'react';

type Point = readonly [number, number];
type Glyph = readonly (readonly Point[])[];

// Closed contours keep the lettering crisp at every size, including its counters.
const glyphs: Record<string, Glyph> = {
  C: [[[80, 0], [0, 0], [0, 112], [80, 112], [80, 88], [24, 88], [24, 24], [80, 24]]],
  O: [
    [[0, 0], [80, 0], [80, 112], [0, 112]],
    [[24, 24], [56, 24], [56, 88], [24, 88]],
  ],
  D: [
    [[0, 0], [56, 0], [80, 24], [80, 88], [56, 112], [0, 112]],
    [[24, 24], [48, 24], [56, 32], [56, 80], [48, 88], [24, 88]],
  ],
  E: [[[0, 0], [80, 0], [80, 24], [24, 24], [24, 44], [64, 44], [64, 68], [24, 68], [24, 88], [80, 88], [80, 112], [0, 112]]],
  L: [[[0, 0], [24, 0], [24, 88], [80, 88], [80, 112], [0, 112]]],
  A: [
    [[0, 112], [0, 0], [80, 0], [80, 112], [56, 112], [56, 72], [24, 72], [24, 112]],
    [[24, 24], [56, 24], [56, 48], [24, 48]],
  ],
  R: [
    [[0, 112], [0, 0], [80, 0], [80, 64], [56, 64], [80, 112], [52, 112], [28, 64], [24, 64], [24, 112]],
    [[24, 24], [56, 24], [56, 40], [24, 40]],
  ],
  N: [[[0, 112], [0, 0], [24, 0], [56, 64], [56, 0], [80, 0], [80, 112], [56, 112], [24, 48], [24, 112]]],
  I: [[[0, 0], [80, 0], [80, 24], [52, 24], [52, 88], [80, 88], [80, 112], [0, 112], [0, 88], [28, 88], [28, 24], [0, 24]]],
  G: [[[80, 0], [0, 0], [0, 112], [80, 112], [80, 56], [44, 56], [44, 76], [56, 76], [56, 88], [24, 88], [24, 24], [80, 24]]],
};

const letters = 'CODELEARNING'.split('');

const CodeLearningWordmark = () => {
  const hatchId = useId();

  return (
    <div className="coding-wordmark" role="img" aria-label="CodeLearning">
      <svg viewBox="0 0 1152 128" fill="none" aria-hidden="true">
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--coding-accent)" strokeWidth="1" />
          </pattern>
        </defs>
        {letters.map((letter, index) => {
          const contours = glyphs[letter];
          const outline = contours.map((points) => `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`).join('');

          return (
            <g key={index} className="coding-wordmark-letter" transform={`translate(${8 + index * 96} 8)`}>
              <rect className="coding-wordmark-hit-area" x="-4" y="-4" width="88" height="120" />
              <path className="coding-wordmark-fill" d={outline} fill="currentColor" fillRule="evenodd" />
              <path className="coding-wordmark-hatch" d={outline} fill={`url(#${hatchId})`} fillRule="evenodd" />
              <path className="coding-wordmark-outline" d={outline} stroke="currentColor" vectorEffect="non-scaling-stroke" />
              {contours.flat().map(([x, y], pointIndex) => (
                <rect key={pointIndex} className="coding-wordmark-anchor" x={x - 1.5} y={y - 1.5} width="3" height="3" stroke="currentColor" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default CodeLearningWordmark;
