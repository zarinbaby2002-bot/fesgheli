import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg select-none">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl hover:scale-110 transition-transform cursor-default">🎬</span>
          <div>
            <h1 className="text-2xl font-bold">نویسنده انیمیشن فسقلی</h1>
            <p className="text-sm opacity-90">دستیار هوشمند سناریو نویسی (نسخه وب)</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;