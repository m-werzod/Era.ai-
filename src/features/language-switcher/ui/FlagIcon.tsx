import type { SVGProps } from "react";

export type FlagComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function FlagBase({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      style={{ display: "block" }}
      {...props}
    />
  );
}

export function GBFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <FlagBase {...props}>
      <defs>
        <clipPath id="gb-clip">
          <rect width="60" height="30" rx="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="30" fill="#00247D" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6.5" />
        <path d="M0,0 L25,15 M0,30 L25,15 M60,0 L35,15 M60,30 L35,15" stroke="#CF142B" strokeWidth="3" />
        <path d="M30,0 V30 M0,15 H60" stroke="#FFF" strokeWidth="11" />
        <path d="M30,0 V30 M0,15 H60" stroke="#CF142B" strokeWidth="6.5" />
      </g>
    </FlagBase>
  );
}

export function RUFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <FlagBase {...props}>
      <defs>
        <clipPath id="ru-clip">
          <rect width="60" height="30" rx="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#ru-clip)">
        <rect width="60" height="10" fill="#FFFFFF" />
        <rect y="10" width="60" height="10" fill="#0039A6" />
        <rect y="20" width="60" height="10" fill="#D52B1E" />
      </g>
    </FlagBase>
  );
}

export function UZFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <FlagBase {...props}>
      <defs>
        <clipPath id="uz-clip">
          <rect width="60" height="30" rx="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#uz-clip)">
        <rect width="60" height="30" fill="#FFFFFF" />
        <rect width="60" height="12.5" fill="#0099B5" />
        <rect y="17.5" width="60" height="12.5" fill="#1EB53A" />
        <rect y="12.5" width="60" height="1.2" fill="#CE1126" />
        <rect y="16.3" width="60" height="1.2" fill="#CE1126" />
        <g fill="#FFFFFF">
          <circle cx="9" cy="6.25" r="4.6" />
          <circle cx="11.2" cy="6.25" r="4.2" fill="#0099B5" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={17 + col * 3.4}
                cy={2.6 + row * 3.2}
                r="0.62"
              />
            )),
          )}
        </g>
      </g>
    </FlagBase>
  );
}
