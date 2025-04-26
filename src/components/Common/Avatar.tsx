// src/components/Common/Avatar.tsx
import React from 'react';

interface AvatarProps {
  // OrderDetail에서 넘겨주는 대로 letter 프로퍼티 추가
  letter: string;
  size?: number; // (선택) px 단위 크기
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
