import React from 'react';
import { ModelType } from '../types';

interface SidebarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedModel, onModelChange }) => {
  return (
    <aside className="w-full md:w-72 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 md:min-h-[calc(100vh-88px)]">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>⚙️</span> تنظیمات
        </h2>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 leading-6">
            طراحی شده برای پروژه انیمیشن ۱۰۰ قسمتی <strong>فسقلی 👶</strong>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          مدل هوش مصنوعی
        </label>
        <div className="space-y-2">
          <button
            onClick={() => onModelChange(ModelType.FLASH)}
            className={`w-full text-right px-4 py-3 rounded-lg border transition-all ${
              selectedModel === ModelType.FLASH
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-900">Gemini Flash (سریع)</div>
            <div className="text-xs text-slate-500 mt-1">مناسب برای تست سریع</div>
          </button>
          
          <button
            onClick={() => onModelChange(ModelType.PRO)}
            className={`w-full text-right px-4 py-3 rounded-lg border transition-all ${
              selectedModel === ModelType.PRO
                ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-900">Gemini Pro (دقیق)</div>
            <div className="text-xs text-slate-500 mt-1">مناسب برای جزئیات پیچیده</div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
