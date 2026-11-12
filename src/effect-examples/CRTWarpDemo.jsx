import CRTWarp from '../effects/CRTWarp';

export default function CRTWarpDemo() {
  return <div style={{ width: '100%', height: '100%', minHeight: 360 }}>
    <CRTWarp color="#c794ff" backgroundColor="#100b18" curvature={0.3}
      corners={0.35} flicker={0.05} dpr={1.25} fps={40} />
  </div>;
}
