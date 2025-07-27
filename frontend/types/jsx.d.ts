/// <reference types="react" />
/// <reference types="react-dom" />

import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any, any> {}
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }
  }
}

// Fix for Heroicons v2 compatibility with React 19
declare module '@heroicons/react/24/outline' {
  import { FC, SVGProps } from 'react';
  
  const XMarkIcon: FC<SVGProps<SVGSVGElement>>;
  const CheckIcon: FC<SVGProps<SVGSVGElement>>;
  const ExclamationTriangleIcon: FC<SVGProps<SVGSVGElement>>;
  const ServerIcon: FC<SVGProps<SVGSVGElement>>;
  const CpuChipIcon: FC<SVGProps<SVGSVGElement>>;
  const CircleStackIcon: FC<SVGProps<SVGSVGElement>>;
  const CloudIcon: FC<SVGProps<SVGSVGElement>>;
  const CogIcon: FC<SVGProps<SVGSVGElement>>;
  const PlayIcon: FC<SVGProps<SVGSVGElement>>;
  const ArrowLeftIcon: FC<SVGProps<SVGSVGElement>>;
  const PlusIcon: FC<SVGProps<SVGSVGElement>>;
  const TrashIcon: FC<SVGProps<SVGSVGElement>>;
  
  export {
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ServerIcon,
    CpuChipIcon,
    CircleStackIcon,
    CloudIcon,
    CogIcon,
    PlayIcon,
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon
  };
}
