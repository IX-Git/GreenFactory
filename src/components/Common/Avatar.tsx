// src/components/Common/Avatar.tsx
import React from 'react';

interface AvatarProps {
  letter: string;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ letter, size = 32 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#635BFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.5,
      }}
    >
      {letter}
    </div>
  );
};

export default Avatar;
