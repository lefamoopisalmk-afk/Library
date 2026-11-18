// Small inline icons so the app does not depend on an icon library.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    );
  };

export const HomeIcon = make(
  <>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </>,
);

export const GridIcon = make(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
);

export const BookIcon = make(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    <path d="M9 7h7" />
  </>,
);

export const OpenBookIcon = make(
  <>
    <path d="M2.5 5.5c3.2-1.6 6.3-1.6 9.5.5 3.2-2.1 6.3-2.1 9.5-.5v13c-3.2-1.6-6.3-1.6-9.5.5-3.2-2.1-6.3-2.1-9.5-.5z" />
    <path d="M12 6v13" />
  </>,
);

export const ArrowsIcon = make(
  <>
    <path d="M7 4v16M7 20l-3-3M7 20l3-3" />
    <path d="M17 20V4M17 4l-3 3M17 4l3 3" />
  </>,
);

export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M17.5 14.5a6.5 6.5 0 0 1 4 5.5" />
  </>,
);

export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
);

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </>,
);

export const SlidersIcon = make(
  <>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </>,
);

export const AlertIcon = make(
  <>
    <path d="M12 3 2.5 20h19z" />
    <path d="M12 9v5M12 17h.01" />
  </>,
);

export const ArrowRightIcon = make(<path d="M5 12h14M13 6l6 6-6 6" />);

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);

export const MinusIcon = make(<path d="M5 12h14" />);

export const LockIcon = make(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);

export const StackIcon = make(
  <>
    <rect x="4" y="15" width="16" height="5" rx="1" />
    <rect x="6" y="9.5" width="13" height="5" rx="1" />
    <rect x="5" y="4" width="12" height="5" rx="1" />
  </>,
);

export const InboxInIcon = make(
  <>
    <path d="M12 3v11M7.5 9.5 12 14l4.5-4.5" />
    <path d="M4 14v5h16v-5" />
  </>,
);

export const OutIcon = make(
  <>
    <path d="M12 14V3M7.5 7.5 12 3l4.5 4.5" />
    <path d="M4 14v5h16v-5" />
  </>,
);

export const ReturnIcon = make(
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </>,
);

export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

export const ShieldIcon = make(
  <>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);

export const SignOutIcon = make(
  <>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </>,
);

export const EyeIcon = make(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const EyeOffIcon = make(
  <>
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.5" />
    <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </>,
);

export const GlobeIcon = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5s1-5.9 3.5-8.5z" />
  </>,
);

export const LeafIcon = make(
  <>
    <path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15z" />
    <path d="M5 19 14 10" />
  </>,
);

// An open book with a sprig growing out of the spine.
export function BrandMark({ size = 30, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M5 15c5-2.5 10-2.5 15 1 5-3.5 10-3.5 15-1v18c-5-2.5-10-2.5-15 1-5-3.5-10-3.5-15-1z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 16v18" stroke={color} strokeWidth="2" />
      <path d="M20 13c-1.2-4.2 1.2-8 5.5-9 1.2 4.2-1.2 8-5.5 9z" fill={color} />
      <path d="M20 13c-.6-3.2-3-5.4-6.4-5.6-.1 3.3 2.4 5.6 6.4 5.6z" fill={color} opacity=".7" />
    </svg>
  );
}
