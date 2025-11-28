
import React from 'react';
import { ModelType, ScenarioSettings } from '../types';

interface SidebarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  settings: ScenarioSettings;
  onSettingsChange: (settings: ScenarioSettings) => void;
  onRegenerate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedModel, onModelChange, settings, onSettingsChange, onRegenerate }) => {
  
  const handleCharacterToggle = (id: string) => {
    const newCharacters = settings.characters.map(char => 
      char.id === id ? { ...char, isActive: !char.isActive } : char
    );
    onSettingsChange({ ...settings, characters: newCharacters });
  };

  const handleSequenceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val > 0 && val <= 10) {
      onSettingsChange({ ...settings, sequenceCount: val });
    }
  };

  const handleVideoCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val > 0 && val <= 5) {
      onSettingsChange({ ...settings, videosPerSequence: val });
    }
  };

  return (
    <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 md:min-h-[calc(100vh-88px)]">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>⚙️</span> تنظیمات
        </h2>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 leading-6">
            طراحی شده توسط <strong>زرین بی بی</strong>
          </p>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          مدل هوش مصنوعی
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => onModelChange(ModelType.FLASH)}
            className={`text-right px-4 py-2.5 rounded-lg border transition-all text-sm ${
              selectedModel === ModelType.FLASH
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-900">Gemini Flash</div>
          </button>
          
          <button
            onClick={() => onModelChange(ModelType.PRO)}
            className={`text-right px-4 py-2.5 rounded-lg border transition-all text-sm ${
              selectedModel === ModelType.PRO
                ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-900">Gemini Pro</div>
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Structure Settings */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">ساختار سناریو</h3>
        
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            تعداد سکانس‌ها
          </label>
          <input 
            type="number" 
            min="1" 
            max="10"
            value={settings.sequenceCount}
            onChange={handleSequenceCountChange}
            className="w-full p-2 border border-slate-300 bg-white rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            تعداد ویدیو در هر سکانس (پیش‌فرض)
          </label>
          <input 
            type="number" 
            min="1" 
            max="5"
            value={settings.videosPerSequence}
            onChange={handleVideoCountChange}
            className="w-full p-2 border border-slate-300 bg-white rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-slate-800"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Characters Settings */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">کاراکترهای حاضر (پیش‌فرض)</h3>
        <p className="text-xs text-slate-400">این تنظیمات برای تولید اولیه است. پس از تولید می‌توانید برای هر سکانس تغییر دهید.</p>
        <div className="space-y-2">
          {settings.characters.map((char) => (
            <label key={char.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={char.isActive}
                onChange={() => handleCharacterToggle(char.id)}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary bg-white"
              />
              <span className="text-sm text-slate-700 select-none">
                {char.faName} <span className="text-xs text-slate-400">({char.name})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />
      
      {/* Global Update Button */}
      <div className="pt-2">
        <button 
          onClick={onRegenerate}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>🚀</span>
          <span>بازنویسی کل سناریو با تنظیمات جدید</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
