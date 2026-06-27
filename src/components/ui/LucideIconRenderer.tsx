import { FC } from 'react';
import * as Icons from 'lucide-react';

interface LucideIconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

const LucideIconRenderer: FC<LucideIconRendererProps> = ({
  iconName,
  className = 'w-6 h-6',
  size = 24,
  style,
}) => {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<any>>)[iconName];

  if (!IconComponent) {
    const HelpIcon = Icons.HelpCircle;
    return (
      <HelpIcon className={className} size={size} style={style} />
    );
  }

  return <IconComponent className={className} size={size} style={style} />;
};

export default LucideIconRenderer;
