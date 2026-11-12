import FluxLines from '../effects/FluxLines';

export default function FluxLinesDemo() {
  return <div style={{ width: '100%', height: '100%', minHeight: 360, background: '#09090c' }}>
    <FluxLines colors={['#ff4b32', '#f7b8a5', '#e9e0ff']} speed={0.45} scale={1.5}
      transparent={false} backgroundColor="#09090c" dpr={1.25} />
  </div>;
}
