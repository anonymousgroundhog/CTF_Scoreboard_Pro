import { ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: Props) {
  const [visible, setVisible] = useState(false);

  if (!text) return <>{children}</>;

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
        {children}
      </div>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-cyber-surface border border-cyber-accent text-cyber-text text-xs px-2 py-1 rounded whitespace-nowrap font-mono z-10">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cyber-accent"></div>
        </div>
      )}
    </div>
  );
}
