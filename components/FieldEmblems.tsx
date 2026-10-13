/**
 * Four animated emblems, one per foundational area. Pure SVG + SMIL so they animate
 * without JavaScript (fixes "the linkage does not move" reports).
 */
const stroke = 'currentColor';

export function DesignEmblem({ className = '' }: { className?: string }) {
  // Cantilever beam under cyclic load, FE mesh + stress contour
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <defs>
        <linearGradient id="dg" x1="0" x2="1"><stop offset="0" stopColor="#af272f" stopOpacity=".9" /><stop offset=".5" stopColor="#d86018" stopOpacity=".5" /><stop offset="1" stopColor="#00558c" stopOpacity=".25" /></linearGradient>
      </defs>
      <rect x="10" y="20" width="14" height="100" fill={stroke} opacity=".25" />
      <g stroke={stroke} strokeWidth="1" opacity=".35">{[0,1,2,3,4,5,6].map(i => <line key={i} x1={24 + i * 22} y1="0" x2={24 + i * 22} y2="140" />)}</g>
      <path d="M24 55 H170 V85 H24 Z" fill="url(#dg)" stroke={stroke} strokeWidth="2">
        <animate attributeName="d" dur="3s" repeatCount="indefinite" values="M24 55 H170 V85 H24 Z;M24 55 C80 58 130 75 170 92 V115 C130 98 80 84 24 85 Z;M24 55 H170 V85 H24 Z" calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1" />
      </path>
      <g stroke={stroke} strokeWidth="1" opacity=".5">{[46,68,90,112,134,156].map(x => <line key={x} x1={x} y1="55" x2={x} y2="85"><animate attributeName="y2" dur="3s" repeatCount="indefinite" values={`85;${85 + (x - 24) / 5};85`} calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1" /><animate attributeName="y1" dur="3s" repeatCount="indefinite" values={`55;${55 + (x - 24) / 5};55`} calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1" /></line>)}</g>
      <g transform="translate(168 40)"><path d="M0 0 L0 12" stroke="#af272f" strokeWidth="3"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;1;0" /></path><path d="M-5 8 L0 15 L5 8" fill="none" stroke="#af272f" strokeWidth="3"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;1;0" /></path></g>
    </svg>
  );
}

export function ThermalEmblem({ className = '' }: { className?: string }) {
  // Streamlines around a heated cylinder
  const lines = [30, 45, 60, 80, 95, 110];
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <defs><radialGradient id="hg"><stop offset="0" stopColor="#af272f" /><stop offset="1" stopColor="#d86018" stopOpacity=".6" /></radialGradient></defs>
      {lines.map((y, i) => {
        const d = y < 70 ? `M0 ${y} C60 ${y} 70 ${y - 22 + i * 2} 100 ${y - 22 + i * 4} S140 ${y} 200 ${y}` : `M0 ${y} C60 ${y} 70 ${y + 22 - (i - 3) * 2} 100 ${y + 22 - (i - 3) * 4} S140 ${y} 200 ${y}`;
        return <path key={y} d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeDasharray="10 8" opacity=".6"><animate attributeName="stroke-dashoffset" from="36" to="0" dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" /></path>;
      })}
      <circle cx="100" cy="70" r="20" fill="url(#hg)"><animate attributeName="r" dur="2.4s" repeatCount="indefinite" values="20;22;20" /></circle>
      {[0, 1, 2].map(i => <circle key={i} cx="100" cy="70" r="24" fill="none" stroke="#af272f" strokeWidth="1.5"><animate attributeName="r" from="22" to="46" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" /><animate attributeName="opacity" from=".7" to="0" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" /></circle>)}
    </svg>
  );
}

export function ControlEmblem({ className = '' }: { className?: string }) {
  // Two-link robot arm sweeping, with end-effector trace
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <rect x="70" y="118" width="60" height="8" fill={stroke} opacity=".3" />
      <path d="M40 60 C70 20 130 20 160 60" fill="none" stroke="#af272f" strokeWidth="1.5" strokeDasharray="4 5" opacity=".6" />
      <g transform="translate(100 118)">
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-35;35;-35" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
          <line x1="0" y1="0" x2="0" y2="-52" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
          <g transform="translate(0 -52)">
            <g>
              <animateTransform attributeName="transform" type="rotate" values="60;-60;60" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
              <line x1="0" y1="0" x2="0" y2="-44" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
              <circle cx="0" cy="-44" r="6" fill="#af272f" />
              <path d="M-6 -44 l-5 -8 M6 -44 l5 -8" stroke="#af272f" strokeWidth="3" strokeLinecap="round" />
            </g>
            <circle r="6" fill="#fff" stroke={stroke} strokeWidth="3" />
          </g>
        </g>
        <circle r="8" fill="#fff" stroke={stroke} strokeWidth="3" />
      </g>
      <g stroke={stroke} strokeWidth="1.5" opacity=".5" fill="none"><path d="M12 30 q8 -14 16 0 t16 0 t16 0"><animate attributeName="d" dur="1.6s" repeatCount="indefinite" values="M12 30 q8 -14 16 0 t16 0 t16 0;M12 30 q8 14 16 0 t16 0 t16 0;M12 30 q8 -14 16 0 t16 0 t16 0" /></path></g>
    </svg>
  );
}

export function ManufacturingEmblem({ className = '' }: { className?: string }) {
  // Meshing gears + tool path
  const gear = (r: number, teeth: number) => {
    const pts: string[] = []; const ro = r, ri = r * 0.78;
    for (let i = 0; i < teeth * 2; i++) { const a = (Math.PI * i) / teeth; const rr = i % 2 === 0 ? ro : ri; const a2 = a + Math.PI / teeth / 2; pts.push(`${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`); pts.push(`${(rr * Math.cos(a2)).toFixed(1)},${(rr * Math.sin(a2)).toFixed(1)}`); }
    return 'M' + pts.join(' L') + ' Z';
  };
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <g transform="translate(72 70)"><path d={gear(38, 12)} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" /></path><circle r="9" fill="none" stroke={stroke} strokeWidth="3" /></g>
      <g transform="translate(134 52)"><path d={gear(24, 8)} fill="none" stroke="#af272f" strokeWidth="3" strokeLinejoin="round"><animateTransform attributeName="transform" type="rotate" from="22.5" to="-337.5" dur="6s" repeatCount="indefinite" /></path><circle r="6" fill="none" stroke="#af272f" strokeWidth="3" /></g>
      <path d="M118 110 h60 M118 100 h60 M118 120 h60" stroke={stroke} strokeWidth="1.5" strokeDasharray="6 6" opacity=".5"><animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" /></path>
      <g><animateTransform attributeName="transform" type="translate" values="118 0;178 0;118 0" dur="3s" repeatCount="indefinite" /><path d="M0 92 l-5 -10 h10 z" fill="#af272f" /></g>
    </svg>
  );
}

export const emblemOf: Record<string, (p: { className?: string }) => React.JSX.Element> = {
  design: DesignEmblem, thermal: ThermalEmblem, control: ControlEmblem, manufacturing: ManufacturingEmblem,
};
