import { SVGProps } from 'react';

declare module '*.svg' {
  const content: React.FC<SVGProps<SVGSVGElement>>;
  export default content;
} 