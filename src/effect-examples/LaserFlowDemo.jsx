import { useRef } from 'react';
import LaserFlow from '../effects/LaserFlow';

export default function LaserFlowDemo() {
  const surface = useRef(null);
  return <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 360, background: '#080a14' }}>
    <LaserFlow surfaceRef={surface} color="#6574ff" beamPosition={0.5} dpr={1.25} />
    <div ref={surface} style={{ position: 'absolute', top: '58%', left: '14%', width: '72%', height: '46%',
      borderRadius: 28, border: '1px solid #8793ff66', background: '#131725', boxShadow: '0 20px 50px #0006' }} />
  </div>;
}
