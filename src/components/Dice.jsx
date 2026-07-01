// Renders a single dice face (values 1-6) with pip layout.
// Chinese dice convention: the 1 and 4 pips are red, the rest are dark.

// Pip positions on a 3x3 grid. Each entry is [row, col] with row/col in {0,1,2}.
const PIP_LAYOUTS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const GRID_PCT = { 0: '25%', 1: '50%', 2: '75%' };

export default function Dice({ value, size = 32 }) {
  const layout = PIP_LAYOUTS[value] || [];
  const isRed = value === 1 || value === 4;
  const pipSize = Math.max(3, Math.round(size * 0.2));

  return (
    <span className="k3-dice" style={{ width: size, height: size }}>
      {layout.map(([r, c], i) => (
        <span
          key={i}
          className="k3-pip"
          style={{
            top: GRID_PCT[r],
            left: GRID_PCT[c],
            width: pipSize,
            height: pipSize,
            backgroundColor: isRed ? '#dc2626' : '#1f2937',
          }}
        />
      ))}
    </span>
  );
}
