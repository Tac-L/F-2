// Renders a single 快三 dice face (values 1-6) using the K3-ball artwork
// (/public/K3-ball/1.png … 6.png). `size` sets the square width/height.
export default function Dice({ value, size = 32 }) {
  const src = `${import.meta.env.BASE_URL}K3-ball/${value}.png`;
  return (
    <img
      className="k3-dice-img"
      src={src}
      alt={String(value)}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
