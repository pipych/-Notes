import React, { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-260 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sheet Content */}
      <div
        className={`relative z-10 w-full max-w-lg bg-m3-surface-container rounded-t-[28px] shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-grab">
          <div className="w-9 h-1 rounded-full bg-m3-outline-variant/50" />
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
