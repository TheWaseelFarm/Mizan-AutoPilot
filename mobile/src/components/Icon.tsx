import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { color } from '../theme/tokens';

/**
 * Mizān icon set — a small, professional line-icon library drawn with react-native-svg.
 *
 * The design handoff makes this non-negotiable: "Use a professional icon library; never use
 * emoji or text symbols as icons." Every glyph in the app routes through <Icon />, so there is
 * one consistent stroke weight, one sizing scale, and no emoji anywhere in the product.
 *
 * All icons are stroked (no fill), 24×24 viewBox, round caps/joins — the calm, credible
 * terminal look. Pass `size` and `color`; `strokeWidth` defaults to a crisp 1.75.
 */

export type IconName =
  | 'search'
  | 'filter'
  | 'sort'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'chevronUp'
  | 'close'
  | 'check'
  | 'refresh'
  | 'externalLink'
  | 'compare'
  | 'star'
  | 'starFilled'
  | 'bell'
  | 'user'
  | 'grid'
  | 'list'
  | 'building'
  | 'landmark'
  | 'briefcase'
  | 'info'
  | 'plus'
  | 'minus'
  | 'arrowUp'
  | 'arrowDown'
  | 'portfolios'
  | 'stocks'
  | 'trendUp'
  | 'clock'
  | 'shield';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

/** The stroked path data for each icon (24×24). */
function Glyph({ name, sw, c, fill }: { name: IconName; sw: number; c: string; fill: string }) {
  const p = { stroke: c, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (name) {
    case 'search':
      return (<><Circle cx={11} cy={11} r={7} {...p} /><Line x1={20} y1={20} x2={16.65} y2={16.65} {...p} /></>);
    case 'filter':
      return <Path d="M3 5h18M6 12h12M10 19h4" {...p} />;
    case 'sort':
      return <Path d="M4 7h16M6 12h12M9 17h6" {...p} />;
    case 'chevronRight':
      return <Polyline points="9 6 15 12 9 18" {...p} />;
    case 'chevronLeft':
      return <Polyline points="15 6 9 12 15 18" {...p} />;
    case 'chevronDown':
      return <Polyline points="6 9 12 15 18 9" {...p} />;
    case 'chevronUp':
      return <Polyline points="6 15 12 9 18 15" {...p} />;
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" {...p} />;
    case 'check':
      return <Polyline points="20 6 9 17 4 12" {...p} />;
    case 'refresh':
      return (<><Path d="M20 11a8 8 0 1 0-.9 4.5" {...p} /><Polyline points="20 4 20 11 13 11" {...p} /></>);
    case 'externalLink':
      return (<><Path d="M14 4h6v6M20 4l-9 9" {...p} /><Path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...p} /></>);
    case 'compare':
      return (<><Rect x={3} y={5} width={7} height={14} rx={1.5} {...p} /><Rect x={14} y={5} width={7} height={14} rx={1.5} {...p} /></>);
    case 'star':
      return <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" {...p} />;
    case 'starFilled':
      return <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" stroke={fill} strokeWidth={sw} strokeLinejoin="round" fill={fill} />;
    case 'bell':
      return <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" {...p} />;
    case 'user':
      return (<><Circle cx={12} cy={8} r={4} {...p} /><Path d="M4 21a8 8 0 0 1 16 0" {...p} /></>);
    case 'grid':
      return (<><Rect x={4} y={4} width={7} height={7} rx={1.5} {...p} /><Rect x={13} y={4} width={7} height={7} rx={1.5} {...p} /><Rect x={4} y={13} width={7} height={7} rx={1.5} {...p} /><Rect x={13} y={13} width={7} height={7} rx={1.5} {...p} /></>);
    case 'list':
      return <Path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" {...p} />;
    case 'building':
      return (<><Rect x={5} y={3} width={14} height={18} rx={1.5} {...p} /><Path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M15 15h.01M11 21v-3h2v3" {...p} /></>);
    case 'landmark':
      return <Path d="M3 21h18M4 10h16M12 3l8 5H4zM6 10v8M10 10v8M14 10v8M18 10v8" {...p} />;
    case 'briefcase':
      return (<><Rect x={3} y={7} width={18} height={13} rx={2} {...p} /><Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" {...p} /></>);
    case 'info':
      return (<><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 11v5M12 8h.01" {...p} /></>);
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...p} />;
    case 'minus':
      return <Path d="M5 12h14" {...p} />;
    case 'arrowUp':
      return <Path d="M12 19V5M6 11l6-6 6 6" {...p} />;
    case 'arrowDown':
      return <Path d="M12 5v14M6 13l6 6 6-6" {...p} />;
    case 'portfolios':
      return (<><Rect x={3} y={4} width={18} height={16} rx={2} {...p} /><Path d="M3 9h18M8 4v16" {...p} /></>);
    case 'stocks':
      return <Path d="M4 18l5-5 3 3 7-8M14 8h4v4" {...p} />;
    case 'trendUp':
      return <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" {...p} />;
    case 'clock':
      return (<><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7v5l3 2" {...p} /></>);
    case 'shield':
      return <Path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" {...p} />;
    default:
      return null;
  }
}

export function Icon({ name, size = 20, color: c = color.muted, strokeWidth = 1.75, fill = c }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Glyph name={name} sw={strokeWidth} c={c} fill={fill} />
    </Svg>
  );
}
