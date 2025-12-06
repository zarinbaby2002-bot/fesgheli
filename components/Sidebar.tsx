

import React, { useState, useRef } from 'react';
import { ModelType, ScenarioSettings, Character } from '../types';

interface SidebarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  settings: ScenarioSettings;
  onSettingsChange: (settings: ScenarioSettings) => void;
  onRegenerate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedModel, onModelChange, settings, onSettingsChange, onRegenerate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  const fileInputRefs = {
    baby: useRef<HTMLInputElement>(null),
    ava: useRef<HTMLInputElement>(null),
    hapo: useRef<HTMLInputElement>(null),
  };
  
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

  const handleFile = (file: File, charId: string) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSettingsChange({
          ...settings,
          characters: settings.characters.map(char =>
            char.id === charId ? { ...char, imageBase64: reader.result as string } : char
          )
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert("لطفاً یک فایل تصویری انتخاب کنید.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, charId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, charId);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, charId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file, charId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, charId: string) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(charId); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(null); };

  const handleImageRemove = (charId: string) => {
    onSettingsChange({
      ...settings,
      characters: settings.characters.map(char =>
        char.id === charId ? { ...char, imageBase64: null } : char
      )
    });
  };

  const triggerFileInput = (charId: 'baby' | 'ava' | 'hapo') => {
    fileInputRefs[charId].current?.click();
  };

  return (
    <aside className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col md:min-h-[calc(100vh-88px)] transition-all">
      {/* Header / Toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-transparent hover:border-slate-100 select-none"
      >
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>⚙️</span> تنظیمات
        </h2>
        <button className="text-slate-400 hover:text-primary transition-transform duration-300 transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}>
        <div className="p-6 pt-0 flex flex-col gap-6">
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-800 leading-6">
                طراحی شده توسط <strong>زرین بی بی</strong>
              </p>
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
                <p className="text-xs text-slate-400">اگر هیچ گزینه‌ای انتخاب نشود، کاراکترها به‌صورت تصادفی انتخاب می‌شوند.</p>
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

            {/* Character Image Upload Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">عکس مرجع کاراکترها (اختیاری)</h3>
              <p className="text-xs text-slate-400">برای تولید تصاویر دقیق‌تر، عکس مرجع کاراکترها را آپلود کنید.</p>
              <div className="space-y-3">
                {settings.characters.map(char => (
                  <div key={char.id}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{char.faName}</label>
                    <div 
                      className={`relative w-full aspect-[2/1] rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${isDraggingOver === char.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-300 bg-slate-50/50'}`}
                      onDrop={(e) => handleDrop(e, char.id)}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, char.id)}
                      onDragLeave={handleDragLeave}
                    >
                      {char.imageBase64 ? (
                        <>
                          <img src={char.imageBase64} alt={char.faName} className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleImageRemove(char.id as 'baby' | 'ava' | 'hapo')} className="text-white bg-red-500/80 rounded-full p-2 hover:bg-red-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" onClick={() => triggerFileInput(char.id as 'baby' | 'ava' | 'hapo')} className="text-slate-400 hover:text-primary transition-colors p-4 flex flex-col items-center justify-center w-full h-full text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.4-4.2-4.8-4.8-.9-.3-1.8-.5-2.7-.5-1.3 0-2.6.4-3.8 1.2"/><path d="M7.8 15c-.7 1.2-1 2.5-.7 3.9.6 2.4 2.4 4.2 4.8 4.8.9.3 1.8.5 2.7.5 1.3 0 2.6-.4 3.8-1.2"/><path d="m3 11 4-4"/><path d="m17 13 4 4"/><circle cx="12" cy="12" r="4"/></svg>
                          <span className="mt-1 block">انتخاب یا درگ کنید</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRefs[char.id as 'baby' | 'ava' | 'hapo']}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, char.id)}
                      />
                    </div>
                  </div>
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
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
