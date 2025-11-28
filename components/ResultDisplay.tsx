
import React, { useState, useEffect } from 'react';
import { ScriptData, ScenarioSettings, ModelType, UpdatedSequenceData, SequenceUpdatePayload } from '../types';
import { updateSequencePrompts, regenerateSingleImagePrompt } from '../services/geminiService';

interface ResultDisplayProps {
  jsonContent: string;
  settings: ScenarioSettings;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ jsonContent, settings }) => {
  const [data, setData] = useState<ScriptData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Local state to track character presence per sequence: { sequenceId: { characterId: boolean } }
  const [presenceMap, setPresenceMap] = useState<Record<number, Record<string, boolean>>>({});
  // Local state to track video count per sequence: { sequenceId: count }
  const [videoCountMap, setVideoCountMap] = useState<Record<number, number>>({});
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [regeneratingImages, setRegeneratingImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const parsed: ScriptData = JSON.parse(jsonContent);
      setData(parsed);
      
      // Initialize maps based on AI output
      const initialPresence: Record<number, Record<string, boolean>> = {};
      const initialVideoCounts: Record<number, number> = {};

      parsed.sequences.forEach(seq => {
        // Characters: Initialize based on GLOBAL SETTINGS (User Preference), not just what AI sent.
        // This ensures checkboxes are ticked by default if the character is active in the main settings.
        initialPresence[seq.id] = {};
        settings.characters.forEach(char => {
            // Check if active in settings, default to true if so.
            // This overrides strict AI output parsing for the initial UI state to facilitate editing.
            initialPresence[seq.id][char.id] = char.isActive;
        });

        // Video Counts
        initialVideoCounts[seq.id] = seq.video_prompts.length;
      });
      setPresenceMap(initialPresence);
      setVideoCountMap(initialVideoCounts);
      setParseError(null);
    } catch (e) {
      console.error("JSON Parse Error", e);
      setParseError("فرمت خروجی نامعتبر است.");
    }
  }, [jsonContent, settings.characters]);

  const toggleCharacterInSequence = (sequenceId: number, charId: string) => {
    setPresenceMap(prev => ({
      ...prev,
      [sequenceId]: {
        ...prev[sequenceId],
        [charId]: !prev[sequenceId][charId]
      }
    }));
  };

  const handleVideoCountChange = (sequenceId: number, count: number) => {
    if (count < 1 || count > 5) return;
    setVideoCountMap(prev => ({
        ...prev,
        [sequenceId]: count
    }));
  };

  const calculateTotalTime = () => {
    if (!data) return "0 ثانیه";
    let totalVideos = 0;
    data.sequences.forEach(seq => {
        totalVideos += videoCountMap[seq.id] || seq.video_prompts.length;
    });
    const totalSeconds = totalVideos * 5;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) return `${minutes} دقیقه و ${seconds} ثانیه`;
    return `${seconds} ثانیه`;
  };

  const handleRegenerateImage = async (sequenceId: number, actionBase: string) => {
    if (!data) return;
    setRegeneratingImages(prev => ({ ...prev, [sequenceId]: true }));

    try {
        const sequencePresence = presenceMap[sequenceId] || {};
        const activeChars = settings.characters.filter(c => sequencePresence[c.id]);
        
        // If no characters selected, use global defaults or random? 
        // We stick to the filtered list. The prompt handles empty lists gracefully if needed, 
        // but typically at least one char is active.
        
        const newPrompt = await regenerateSingleImagePrompt(actionBase, activeChars, settings);

        // Update local data state
        const newSequences = data.sequences.map(seq => 
            seq.id === sequenceId ? { ...seq, image_prompt: newPrompt } : seq
        );
        
        setData({ ...data, sequences: newSequences });

    } catch (error) {
        console.error(error);
        alert("خطا در تولید مجدد تصویر.");
    } finally {
        setRegeneratingImages(prev => ({ ...prev, [sequenceId]: false }));
    }
  };

  const updatePrompts = async () => {
    if (!data) return;
    setIsUpdating(true);

    try {
      // 1. Prepare payload with character lists AND video counts
      const sequencesPayload: SequenceUpdatePayload[] = data.sequences.map(seq => {
        const sequencePresence = presenceMap[seq.id] || {};
        
        // Filter actively selected characters
        let activeChars = settings.characters.filter(c => sequencePresence[c.id]);
        
        // LOGIC: If no characters selected manually, pick randomly from the allowed list
        if (activeChars.length === 0) {
          const shuffled = [...settings.characters].sort(() => 0.5 - Math.random());
          const count = Math.floor(Math.random() * settings.characters.length) + 1; 
          activeChars = shuffled.slice(0, count);
        }

        return {
          id: seq.id,
          action_base: seq.action_base,
          active_character_ids: activeChars.map(c => c.id),
          target_video_count: videoCountMap[seq.id] || 1
        };
      });

      // 2. Call AI to rewrite prompts contextually
      const updatedData: UpdatedSequenceData[] = await updateSequencePrompts(
        sequencesPayload, 
        ModelType.FLASH, // Use fast model for updates
        settings
      );

      // 3. Merge AI response back into state
      const newSequences = data.sequences.map(seq => {
        const update = updatedData.find(u => u.id === seq.id);
        if (update) {
            // NOTE: We do NOT update presenceMap here anymore, because the user explicitly set checkboxes.
            // We want to keep the checkboxes as the user set them, not overwrite with what AI thinks.
            
            // Update video count map based on what was actually generated
            setVideoCountMap(prev => ({ ...prev, [seq.id]: update.video_prompts.length }));

            return {
                ...seq,
                active_character_ids: update.active_character_ids,
                image_prompt: update.image_prompt,
                video_prompts: update.video_prompts
            };
        }
        return seq;
      });

      setData({
        ...data,
        sequences: newSequences
      });

    } catch (error) {
        console.error(error);
        alert("خطا در به‌روزرسانی پرامپت‌ها.");
    } finally {
        setIsUpdating(false);
    }
  };

  const downloadText = () => {
    if (!data) return;
    
    // Convert JSON back to a readable text format for download
    let text = `🎬 اپیزود: ${data.episode_title}\n\n`;
    text += `خلاصه: ${data.summary}\n\n`;
    text += `زمان کل: ${calculateTotalTime()}\nلوکیشن: ${data.location}\n\n`;
    text += `--- BACKGROUND ---\n${data.background_prompt}\n\n`;
    
    data.sequences.forEach(seq => {
        text += `--- سکانس ${seq.id}: ${seq.title} ---\n`;
        text += `زاویه: ${seq.camera_angle} | حرکت: ${seq.camera_movement}\n`;
        text += `IMAGE PROMPT:\n> ${seq.image_prompt}\n\n`;
        seq.video_prompts.forEach(vp => {
            text += `VIDEO ${vp.id} (5s): ${vp.description}\n> ${vp.prompt}\n`;
        });
        text += `\nترنزیشن: ${seq.transition}\n\n`;
    });
    
    text += `\n--- INSTAGRAM ---\n${data.instagram.title}\n${data.instagram.caption}\n${data.instagram.hashtags.join(' ')}`;

    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `scenario_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  if (parseError) {
    return <div className="text-red-500 p-4 bg-red-50 rounded border border-red-200">{parseError}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{data.episode_title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                ⏱️ زمان کل: {calculateTotalTime()}
              </span>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                📍 {data.location}
              </span>
            </div>
          </div>
          <button 
              onClick={downloadText}
              className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
              <span>📥</span> دانلود متن
          </button>
        </div>
        
        {/* Summary Section */}
        {data.summary && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
             <h4 className="font-bold text-amber-800 text-sm mb-2">📜 خلاصه داستان:</h4>
             <p className="text-sm text-slate-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h4 className="font-bold text-slate-700 text-sm mb-2">🖼️ بک‌گراند خالی (Clean Plate)</h4>
          <p className="font-mono text-sm text-slate-600 bg-white p-3 rounded border border-slate-200 dir-ltr text-left">
            {data.background_prompt}
          </p>
        </div>
      </div>

      {/* Sequences */}
      <div className="space-y-6">
        {data.sequences.map((seq) => (
          <div key={seq.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-lg text-slate-800">
                سکانس {seq.id}: <span className="text-primary">{seq.title}</span>
              </h3>
              <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                {seq.camera_angle} • {seq.camera_movement}
              </div>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Configuration for this sequence */}
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex flex-col md:flex-row md:items-center gap-6">
                
                {/* Character Selection */}
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <span>👥</span> کاراکترها:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {settings.characters.map(char => (
                            <label key={char.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${
                                presenceMap[seq.id]?.[char.id] 
                                    ? 'bg-white border-primary text-primary shadow-sm' 
                                    : 'bg-transparent border-slate-200 text-slate-400 opacity-70 hover:opacity-100'
                            }`}>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={presenceMap[seq.id]?.[char.id] || false}
                                    onChange={() => toggleCharacterInSequence(seq.id, char.id)}
                                />
                                <span className={`w-2 h-2 rounded-full ${presenceMap[seq.id]?.[char.id] ? 'bg-primary' : 'bg-slate-300'}`}></span>
                                {char.faName}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Video Count Input */}
                <div className="flex flex-col gap-2 min-w-[140px]">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span>🎥</span> تعداد ویدیو:
                    </h4>
                    <div className="flex items-center bg-white rounded border border-slate-300 overflow-hidden w-full max-w-[120px]">
                        <button 
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border-l border-slate-300"
                            onClick={() => handleVideoCountChange(seq.id, (videoCountMap[seq.id] || 1) + 1)}
                        >+</button>
                        <input 
                            type="number" 
                            className="w-full text-center outline-none text-sm py-1 bg-white text-slate-800"
                            value={videoCountMap[seq.id] || 0}
                            readOnly
                        />
                        <button 
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border-r border-slate-300"
                            onClick={() => handleVideoCountChange(seq.id, (videoCountMap[seq.id] || 1) - 1)}
                        >-</button>
                    </div>
                    <div className="text-xs text-slate-400">
                        {((videoCountMap[seq.id] || 0) * 5)} ثانیه
                    </div>
                </div>
              </div>

              {/* Image Prompt */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <span>🖼️</span> پرامپت تصویر (Full Detail)
                    </h4>
                    <button
                        onClick={() => handleRegenerateImage(seq.id, seq.action_base)}
                        disabled={regeneratingImages[seq.id]}
                        className={`bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow text-xs flex items-center gap-1.5 transition-all ${regeneratingImages[seq.id] ? 'opacity-75 cursor-not-allowed' : ''}`}
                        title="تولید مجدد پرامپت تصویر با حفظ جزئیات بالا"
                    >
                       <span className={regeneratingImages[seq.id] ? "animate-spin" : ""}>
                         {regeneratingImages[seq.id] ? '⏳' : '✨'}
                       </span>
                       <span>{regeneratingImages[seq.id] ? 'در حال نگارش...' : 'تولید مجدد تصویر'}</span>
                    </button>
                </div>
                
                <div className="relative group">
                    <p className={`font-mono text-sm text-slate-600 bg-slate-50 p-4 rounded border border-slate-200 dir-ltr text-left leading-relaxed transition-opacity ${regeneratingImages[seq.id] ? 'opacity-50' : 'opacity-100'}`}>
                    {seq.image_prompt}
                    </p>
                </div>
              </div>

              {/* Video Prompts */}
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <span>🎬</span> ویدیوها (هر کدام ۵ ثانیه)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {seq.video_prompts.map((vp) => (
                        <div key={vp.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col md:flex-row gap-4">
                            <div className="md:w-1/3 border-b md:border-b-0 md:border-l border-slate-200 pb-2 md:pb-0 pl-0 md:pl-4">
                                <span className="text-xs font-bold text-white bg-secondary px-2 py-0.5 rounded-full mb-1 inline-block">Shot {vp.id}</span>
                                <p className="text-sm text-slate-700 leading-6">{vp.description}</p>
                            </div>
                            <div className="md:w-2/3">
                                <p className="font-mono text-xs text-slate-500 dir-ltr text-left opacity-90">{vp.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>🔄</span> ترنزیشن: {seq.transition}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Update Button */}
      <div className="sticky bottom-6 flex justify-center z-10">
        <button 
            onClick={updatePrompts}
            disabled={isUpdating}
            className={`bg-accent hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 ${isUpdating ? 'opacity-80 cursor-wait' : ''}`}
        >
            {isUpdating ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>در حال بازنویسی و تنظیم ویدیوها...</span>
                </>
            ) : (
                <>
                    <span>✨</span> 
                    <span>به‌روزرسانی ویدیوها و کاراکترها</span>
                </>
            )}
        </button>
      </div>

      {/* Social Media */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100 text-center">
        <h3 className="font-bold text-pink-600 mb-2">{data.instagram.title}</h3>
        <p className="text-slate-700 mb-4 whitespace-pre-wrap">{data.instagram.caption}</p>
        <div className="text-blue-500 text-sm dir-ltr font-medium">
            {data.instagram.hashtags.join(' ')}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
