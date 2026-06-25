import { C } from '../../lib/theme';

type LogoProps = {
  size?: number;
  showText?: boolean;
  dark?: boolean;
};

export function Logo({ size = 40, showText = true, dark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 80 80"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="80" height="80" fill={C.primary} />
        {/* White notches top and bottom forming the stylised H */}
        <rect x="32" y="0" width="16" height="22" fill="#FFFFFF" />
        <rect x="32" y="58" width="16" height="22" fill="#FFFFFF" />
        {/* HANS text */}
        <text
          x="40"
          y="38"
          textAnchor="middle"
          fill={C.accent}
          fontSize="14"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          letterSpacing="0.5"
        >
          HANS
        </text>
        <text
          x="40"
          y="50"
          textAnchor="middle"
          fill={C.accent}
          fontSize="6.5"
          fontWeight="600"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          COFFRAGE
        </text>
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-[0.18em] text-sm ${dark ? 'text-stone-900' : 'text-white'}`}
          >
            HANS COFFRAGE
          </span>
          <span
            className="font-medium tracking-[0.25em] text-[9px] mt-0.5"
            style={{ color: C.accent }}
          >
            ERP · PILOTAGE
          </span>
        </div>
      )}
    </div>
  );
}
