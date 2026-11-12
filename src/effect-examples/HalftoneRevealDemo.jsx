import HalftoneReveal from '../effects/HalftoneReveal';

export default function HalftoneRevealDemo() {
  return <div style={{ width: '100%', height: '100%', minHeight: 360 }}>
    <HalftoneReveal src="/photos/swarit.png" mode="mono" inkColor="#25241f" paperColor="#f3f0e9"
      cellSize={7} revealRadius={110} wander={false} clickBurst />
  </div>;
}
