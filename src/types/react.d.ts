import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  interface CSSProperties {
    [key: string]: any;
  }
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const ImageOff: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const Bike: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const XCircle: FC<IconProps>;
  export const AlertCircle: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const ArrowRight: FC<IconProps>;
} 