import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResultDisplay from './components/ResultDisplay';
import { generateScenario } from './services/geminiService';
import { ModelType, GenerationState, ScenarioSettings, Character } from './types';

const DEFAULT_CHARACTERS: Character[] = [
  { id: 'baby', name: 'Baby', faName: 'فسقلی', desc: '1-year-old boy, mischievous', promptName: 'cute baby boy', isActive: false, imageBase64: null },
  { id: 'ava', name: 'Ava', faName: 'آوا', desc: '7-year-old girl, caring sister', promptName: '7-year-old girl', isActive: false, imageBase64: null },
  { id: 'hapo', name: 'Hapo', faName: 'هاپو', desc: 'Golden puppy, playful', promptName: 'golden retriever puppy', isActive: false, imageBase64: null },
];

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [settings, setSettings] = useState<ScenarioSettings>({
    sequenceCount: 3,
    videosPerSequence: 2,
    characters: DEFAULT_CHARACTERS
  });
  
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setState({ isLoading: true, error: null, result: null });

    try {
      const result = await generateScenario(topic, additionalDetails, settings);
      setState({ isLoading: false, error: null, result });
    } catch (err: unknown) {
      let errorMessage = "یک خطای ناشناخته رخ داده است.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setState({ isLoading: false, error: errorMessage, result: null });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <div className="print:hidden">
        <Header />
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 order-2 md:order-1 print:w-full print:p-0">
          <div className="max-w-4xl mx-auto space-y-8 print:max-w-none print:space-y-4">
            
            {/* Input Section - Hide on print if result exists, but show if initial state */}
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${state.result ? 'print:hidden' : ''}`}>
              <h2 className="text-xl font-bold text-slate-800 mb-2">موضوع اپیزود جدید</h2>
              <p className="text-slate-500 mb-6 text-sm">موضوع را وارد کنید تا سناریوی کامل با تنظیمات انتخاب شده تولید شود.</p>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label htmlFor="topic" className="sr-only">موضوع</label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: آب‌بازی در حیاط، سفر به پاریس، خرید بستنی..."
                    className="w-full text-lg p-4 rounded-lg border border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                    disabled={state.isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="additionalDetails" className="sr-only">توضیحات تکمیلی</label>
                  <textarea 
                    id="additionalDetails"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="توضیحات تکمیلی، تگ‌ها، پیشنهادات یا ایده‌هایی که باید در سناریو و پرامپت‌ها لحاظ شوند (اختیاری)..."
                    className="w-full text-lg p-4 rounded-lg border border-slate-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400 min-h-[120px] resize-y"
                    disabled={state.isLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={state.isLoading || !topic.trim()}
                  className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2 ${
                    state.isLoading || !topic.trim()
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {state.isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>در حال نوشتن سناریو...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>تولید سناریو</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
                <span>⚠️</span>
                <p>{state.error}</p>
              </div>
            )}

            {/* Result Display */}
            {state.result && (
              <ResultDisplay jsonContent={state.result} settings={settings} />
            )}
            
          </div>
        </main>

        {/* Sidebar */}
        <div className="order-1 md:order-2 print:hidden">
            <Sidebar 
                settings={settings}
                onSettingsChange={setSettings}
                onRegenerate={() => {
                  if (topic.trim() && !state.isLoading) {
                    handleGenerate();
                  } else {
                    alert("لطفاً ابتدا یک موضوع وارد کنید.");
                  }
                }}
            />
        </div>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 print:hidden mt-auto">
        <div className="container mx-auto px-4 text-center">
            <p className="text-slate-700 font-bold mb-2">ساخته شده توسط ZarinBaby</p>
            <div className="text-xs text-slate-500 dir-ltr flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
                <span>© {new Date().getFullYear()} ZarinBaby. All Rights Reserved.</span>
                <span className="hidden md:inline text-slate-300">◆</span>
                <span className="font-sans">تمامی حقوق محفوظ است (v1.0.11)</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;