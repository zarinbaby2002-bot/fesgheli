





import React, { useState, useEffect } from 'react';
import { ScriptData, ScenarioSettings, ModelType, UpdatedSequenceData, SequenceUpdatePayload, VideoPrompt } from '../types';
import { updateSequencePrompts, regenerateSingleImagePrompt, generateImage, generateVideo } from '../services/geminiService';

interface ResultDisplayProps {
  jsonContent: string;
  settings: ScenarioSettings;
}

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all border flex items-center justify-center ${
        copied 
          ? 'bg-green-50 text-green-600 border-green-200' 
          : 'bg-white text-slate-400 border-slate-200 hover:text-primary hover:border-primary shadow-sm'
      } ${className}`}
      title={copied ? "کپی شد!" : "کپی در کلیپ‌بورد"}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      )}
    </button>
  );
};

const DownloadButton = ({ imageUrl, episodeTitle, sequenceId, videoId }: { imageUrl: string, episodeTitle: string, sequenceId: number, videoId: number }) => {

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;

    // Sanitize title and create filename
    const sanitizedTitle = episodeTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '_').slice(0, 30);
    const filename = `${sanitizedTitle}_Seq${sequenceId}_Shot${videoId}.png`;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="p-1.5 rounded-md transition-all border flex items-center justify-center bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-400 shadow-sm"
      title="دانلود تصویر"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    </button>
  );
};

const VideoDownloadButton = ({ videoUrl, episodeTitle, sequenceId, videoId }: { videoUrl: string, episodeTitle: string, sequenceId: number, videoId: number }) => {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoUrl) return;

        const sanitizedTitle = episodeTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '_').slice(0, 30);
        const filename = `${sanitizedTitle}_Seq${sequenceId}_Shot${videoId}.mp4`;
        
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleDownload}
            className="p-1.5 rounded-md transition-all border flex items-center justify-center bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-400 shadow-sm"
            title="دانلود ویدیو"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
    );
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ jsonContent, settings }) => {
  const [data, setData] = useState<ScriptData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  const [presenceMap, setPresenceMap] = useState<Record<number, Record<string, boolean>>>({});
  const [videoCountMap, setVideoCountMap] = useState<Record<number, number>>({});
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [regeneratingImages, setRegeneratingImages] = useState<Record<number, boolean>>({});
  const [generatingAllImages, setGeneratingAllImages] = useState<Record<number, boolean>>({});


  useEffect(() => {
    try {
      // Clean the input string: remove potential markdown backticks and language identifiers
      const cleanedJsonString = jsonContent
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '');

      const parsed: ScriptData = JSON.parse(cleanedJsonString);
      setData(parsed);
      
      const initialPresence: Record<number, Record<string, boolean>> = {};
      const initialVideoCounts: Record<number, number> = {};

      parsed.sequences.forEach(seq => {
        initialPresence[seq.id] = {};
        const activeIds = (seq.active_character_ids || []).map(id => String(id).toLowerCase().trim());
        settings.characters.forEach(char => {
            const isPresent = activeIds.includes(char.id.toLowerCase());
            initialPresence[seq.id][char.id] = isPresent;
        });
        initialVideoCounts[seq.id] = seq.video_prompts.length;
      });
      setPresenceMap(initialPresence);
      setVideoCountMap(initialVideoCounts);
      setParseError(null);
    } catch (e) {
      console.error("JSON Parse Error", e);
      setParseError("فرمت خروجی نامعتبر است. ممکن است لازم باشد دوباره تولید کنید.");
    }
  }, [jsonContent, settings.characters]);

  const handleGenerateSingleImage = async (sequenceId: number, videoPromptId: number) => {
    if (!data) return;

    // Create a deep copy to modify and set loading state
    setData(prevData => {
        if (!prevData) return null;
        const updatedData = JSON.parse(JSON.stringify(prevData));
        const seq = updatedData.sequences.find((s: any) => s.id === sequenceId);
        if (seq) {
            const vp = seq.video_prompts.find((v: any) => v.id === videoPromptId);
            if (vp) {
                vp.isGenerating = true;
                vp.imageBase64 = null;
            }
        }
        return updatedData;
    });

    try {
        const currentData = JSON.parse(JSON.stringify(data));
        const seq = currentData.sequences.find((s: any) => s.id === sequenceId);
        const vp = seq?.video_prompts.find((v: any) => v.id === videoPromptId);
        if (!seq || !vp) throw new Error("Sequence or video prompt not found");

        const activeCharacterIdsInSeq = new Set(seq.active_character_ids);
        const referenceImages = settings.characters
            .filter(char => activeCharacterIdsInSeq.has(char.id) && char.imageBase64)
            .map(char => ({
                name: char.promptName,
                base64: char.imageBase64!
            }));

        const detailedPrompt = `A single frame from an animated film. The overall scene is: "${seq.image_prompt}". The specific action for this shot is: "${vp.prompt}".`;
        
        const imageUrl = await generateImage(detailedPrompt, referenceImages);
        
        setData(prevData => {
            if (!prevData) return null;
            const updatedData = JSON.parse(JSON.stringify(prevData));
            const seq = updatedData.sequences.find((s: any) => s.id === sequenceId);
            if (seq) {
                const vp = seq.video_prompts.find((v: any) => v.id === videoPromptId);
                if (vp) {
                    vp.imageBase64 = imageUrl;
                    vp.isGenerating = false;
                }
            }
            return updatedData;
        });

    } catch (error) {
        console.error(`Failed to generate image for prompt id: ${videoPromptId}`, error);
        alert(`خطا در تولید تصویر برای شات ${videoPromptId}.`);
        setData(prevData => {
            if (!prevData) return null;
            const updatedData = JSON.parse(JSON.stringify(prevData));
            const seq = updatedData.sequences.find((s: any) => s.id === sequenceId);
            if (seq) {
                const vp = seq.video_prompts.find((v: any) => v.id === videoPromptId);
                if (vp) {
                    vp.isGenerating = false;
                }
            }
            return updatedData;
        });
    }
  };

  const handleGenerateAllImages = async (sequenceId: number) => {
    if (!data) return;

    setGeneratingAllImages(prev => ({ ...prev, [sequenceId]: true }));

    // 1. Set loading state for all relevant VPs
    setData(prevData => {
        if (!prevData) return null;
        const updatedData = JSON.parse(JSON.stringify(prevData));
        const seq = updatedData.sequences.find((s: any) => s.id === sequenceId);
        if (seq) {
            seq.video_prompts.forEach((vp: VideoPrompt) => {
                if (!vp.imageBase64) {
                    vp.isGenerating = true;
                }
            });
        }
        return updatedData;
    });

    const currentData = JSON.parse(JSON.stringify(data));
    const seq = currentData.sequences.find((s: any) => s.id === sequenceId);
    if (!seq) {
        setGeneratingAllImages(prev => ({ ...prev, [sequenceId]: false }));
        return;
    }

    const activeCharacterIdsInSeq = new Set(seq.active_character_ids);
    const referenceImages = settings.characters
        .filter(char => activeCharacterIdsInSeq.has(char.id) && char.imageBase64)
        .map(char => ({ name: char.promptName, base64: char.imageBase64! }));
    
    // 2. Create all generation promises
    const generationPromises = seq.video_prompts
        .filter((vp: VideoPrompt) => !vp.imageBase64)
        .map((vp: VideoPrompt) => {
            const detailedPrompt = `A single frame from an animated film. The overall scene is: "${seq.image_prompt}". The specific action for this shot is: "${vp.prompt}".`;
            return generateImage(detailedPrompt, referenceImages)
                .then(imageUrl => ({ vpId: vp.id, imageUrl, error: null }))
                .catch(error => ({ vpId: vp.id, imageUrl: null, error }));
        });

    // 3. Await all promises
    const results = await Promise.all(generationPromises);

    // 4. Update state with all results at once
    setData(prevData => {
        if (!prevData) return null;
        const updatedData = JSON.parse(JSON.stringify(prevData));
        const updatedSeq = updatedData.sequences.find((s: any) => s.id === sequenceId);
        if (updatedSeq) {
            results.forEach(result => {
                const vp = updatedSeq.video_prompts.find((v: any) => v.id === result.vpId);
                if (vp) {
                    vp.isGenerating = false;
                    if (result.imageUrl) {
                        vp.imageBase64 = result.imageUrl;
                    } else {
                        console.error(`Failed to generate image for prompt id: ${result.vpId}`, result.error);
                    }
                }
            });
        }
        return updatedData;
    });
    
    setGeneratingAllImages(prev => ({ ...prev, [sequenceId]: false }));
};

  const handleGenerateVideo = async (sequenceId: number, videoPromptId: number) => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        alert("برای تولید ویدیو، لطفاً یک کلید API پولی از پروژه Google Cloud خود انتخاب کنید.\nبرای اطلاعات بیشتر به ai.google.dev/gemini-api/docs/billing مراجعه کنید.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
    }

    if (!data) return;

    const updatedData = JSON.parse(JSON.stringify(data));
    const seq = updatedData.sequences.find((s: any) => s.id === sequenceId);
    const vp = seq.video_prompts.find((v: any) => v.id === videoPromptId);

    if (!vp || !vp.imageBase64) {
        alert("لطفاً ابتدا تصویر را تولید کنید.");
        return;
    }

    vp.isGeneratingVideo = true;
    vp.videoUrl = null;
    setData(updatedData);

    try {
        const videoUrl = await generateVideo(vp.prompt, vp.imageBase64);
        vp.videoUrl = videoUrl;
    } catch (error: unknown) {
        let errorMessage = `خطا در تولید ویدیو برای شات ${vp.id}.`;
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`Failed to generate video for prompt: ${vp.prompt}`, error);
        alert(errorMessage);
    } finally {
        vp.isGeneratingVideo = false;
        setData(JSON.parse(JSON.stringify(updatedData)));
    }
};


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

  const calculateTotalSeconds = () => {
    if (!data) return 0;
    let totalVideos = 0;
    data.sequences.forEach(seq => {
        totalVideos += videoCountMap[seq.id] || seq.video_prompts.length;
    });
    return totalVideos * 5;
  };

  const calculateTotalTimeDisplay = () => {
    const totalSeconds = calculateTotalSeconds();
    if (totalSeconds === 0) return "0 ثانیه";
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
        
        const currentVideoCount = videoCountMap[sequenceId] || 2;

        const result = await regenerateSingleImagePrompt(actionBase, activeChars, settings, currentVideoCount);

        const newSequences = data.sequences.map(seq => 
            seq.id === sequenceId ? { 
              ...seq, 
              image_prompt: result.image_prompt,
              video_prompts: result.video_prompts
            } : seq
        );
        
        setData({ ...data, sequences: newSequences });
        
        if (result.video_prompts.length !== currentVideoCount) {
             setVideoCountMap(prev => ({ ...prev, [sequenceId]: result.video_prompts.length }));
        }

    } catch (error) {
        console.error(error);
        alert("خطا در تولید مجدد تصویر و ویدیوها.");
    } finally {
        setRegeneratingImages(prev => ({ ...prev, [sequenceId]: false }));
    }
  };

  const updatePrompts = async () => {
    if (!data) return;
    setIsUpdating(true);

    try {
      const sequencesPayload: SequenceUpdatePayload[] = [];

      data.sequences.forEach(seq => {
        const sequencePresence = presenceMap[seq.id] || {};
        let activeChars = settings.characters.filter(c => sequencePresence[c.id]);
        if (activeChars.length === 0) {
          const shuffled = [...settings.characters].sort(() => 0.5 - Math.random());
          const count = Math.floor(Math.random() * settings.characters.length) + 1; 
          activeChars = shuffled.slice(0, count);
        }

        const activeCharIds = activeChars.map(c => c.id);
        const currentVideoCount = videoCountMap[seq.id] || seq.video_prompts.length;

        const prevIds = new Set((seq.active_character_ids || []).map(id => id.toLowerCase().trim()));
        const currIds = new Set(activeCharIds.map(c => c.toLowerCase().trim()));
        
        let hasCharsChanged = prevIds.size !== currIds.size || [...prevIds].some(id => !currIds.has(id));
        const hasVideoCountChanged = currentVideoCount !== seq.video_prompts.length;

        if (hasCharsChanged || hasVideoCountChanged) {
             sequencesPayload.push({
                id: seq.id,
                action_base: seq.action_base,
                active_character_ids: activeCharIds,
                target_video_count: currentVideoCount
            });
        }
      });

      if (sequencesPayload.length === 0) {
        alert("تغییری در تنظیمات هیچ سکانسی یافت نشد.\nلطفاً برای به‌روزرسانی، ابتدا کاراکترها یا تعداد ویدیوهای یک سکانس را تغییر دهید.");
        setIsUpdating(false);
        return;
      }

      const updatedData: UpdatedSequenceData[] = await updateSequencePrompts(
        sequencesPayload, 
        ModelType.FLASH,
        settings
      );

      const newPresenceMap = { ...presenceMap };
      const newVideoCountMap = { ...videoCountMap };

      const newSequences = data.sequences.map(seq => {
        const update = updatedData.find(u => u.id === seq.id);
        if (update) {
            newVideoCountMap[update.id] = update.video_prompts.length;
            const activeIds = (update.active_character_ids || []).map(id => String(id).toLowerCase().trim());
            settings.characters.forEach(char => {
               if (!newPresenceMap[update.id]) newPresenceMap[update.id] = {};
               newPresenceMap[update.id][char.id] = activeIds.includes(char.id.toLowerCase());
            });

            return {
                ...seq,
                active_character_ids: update.active_character_ids,
                image_prompt: update.image_prompt,
                video_prompts: update.video_prompts
            };
        }
        return seq;
      });

      setPresenceMap(newPresenceMap);
      setVideoCountMap(newVideoCountMap);
      setData({ ...data, sequences: newSequences });

    } catch (error) {
        console.error(error);
        alert("خطا در به‌روزرسانی پرامپت‌ها.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportWord = () => {
    if (!data) return;
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir="rtl">
      <head><meta charset='utf-8'><title>${data.episode_title}</title></head>
      <body style="font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right;">
        <h1>${data.episode_title}</h1>
        <p><strong>خلاصه:</strong> ${data.summary}</p>
        <p><strong>لوکیشن:</strong> ${data.location}</p>
        <hr/>
        ${data.sequences.map(seq => `
          <h3>سکانس ${seq.id}: ${seq.title}</h3>
          <p style="color: #444; font-style: italic;">${seq.summary || ''}</p>
          <p><strong>زاویه:</strong> ${seq.camera_angle} | <strong>حرکت:</strong> ${seq.camera_movement}</p>
          <div style="background-color: #f0f0f0; padding: 10px; margin: 10px 0; border: 1px solid #ccc;">
            <strong>Background Prompt (Clean Plate):</strong><br/>
            ${seq.background_prompt}
          </div>
          <div style="background-color: #e6f7ff; padding: 10px; margin: 10px 0; border: 1px solid #91d5ff;">
            <strong>Image Prompt:</strong><br/>
            ${seq.image_prompt}
          </div>
          <ul>
            ${seq.video_prompts.map(vp => `
              <li>
                <strong>Shot ${vp.id} (5s):</strong> ${vp.description}<br/>
                <em style="color: #555;">${vp.prompt}</em>
              </li>
            `).join('')}
          </ul>
          <p><strong>ترنزیشن:</strong> ${seq.transition}</p>
          <hr/>
        `).join('')}
        <h3>Instagram</h3>
        <p><strong>Caption:</strong> ${data.instagram.caption}</p>
        <p><strong>Hashtags:</strong> ${data.instagram.hashtags.join(' ')}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.episode_title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'email' | 'instagram') => {
    if (!data) return;
    const url = window.location.href; 
    const shareText = `🎬 انیمیشن فسقلی\nعنوان: ${data.episode_title}\n\nخلاصه: ${data.summary}\n\n#فسقلی #انیمیشن`;
    const fullText = `عنوان: ${data.episode_title}\n\n${data.summary}\n\nکپشن اینستاگرام:\n${data.instagram.caption}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedShareText = encodeURIComponent(shareText);

    switch (platform) {
      case 'whatsapp': window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + url)}`); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedShareText}`); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodedShareText}`); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`); break;
      case 'email': window.open(`mailto:?subject=${encodeURIComponent(data.episode_title)}&body=${encodeURIComponent(fullText)}`); break;
      case 'instagram':
        navigator.clipboard.writeText(data.instagram.caption + "\n\n" + data.instagram.hashtags.join(' '));
        alert('کپشن و هشتگ‌ها در کلیپ‌بورد کپی شدند. اکنون می‌توانید در اینستاگرام پیست کنید.');
        break;
    }
  };

  if (parseError) return <div className="text-red-500 p-4 bg-red-50 rounded border border-red-200">{parseError}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header Info & Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 relative">
        <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">{data.episode_title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1"><span>⏱️</span> {calculateTotalTimeDisplay()}</span>
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1"><span>📍</span> {data.location}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden bg-slate-50 p-2 rounded-lg border border-slate-100">
             <button onClick={handlePrint} className="p-2 text-slate-600 hover:text-primary hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-200" title="پرینت / ذخیره PDF"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg></button>
             <button onClick={handleExportWord} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-200" title="خروجی Word"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 13l-1.5 6l-1.5-6"></path><path d="M16 13l-1.5 6l-1.5-6"></path></svg></button>
             <div className="w-px h-6 bg-slate-300 mx-1"></div>
             <button onClick={() => handleShare('telegram')} className="p-2 text-slate-500 hover:text-sky-500 hover:bg-white rounded-md transition-all" title="تلگرام"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
             <button onClick={() => handleShare('whatsapp')} className="p-2 text-slate-500 hover:text-green-500 hover:bg-white rounded-md transition-all" title="واتساپ"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></button>
             <button onClick={() => handleShare('twitter')} className="p-2 text-slate-500 hover:text-black hover:bg-white rounded-md transition-all" title="ایکس (توییتر)"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg></button>
             <button onClick={() => handleShare('facebook')} className="p-2 text-slate-500 hover:text-blue-700 hover:bg-white rounded-md transition-all" title="فیس‌بوک"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></button>
             <button onClick={() => handleShare('email')} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white rounded-md transition-all" title="ایمیل"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></button>
          </div>
        </div>
        
        {data.summary && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
             <h4 className="font-bold text-amber-800 text-sm mb-2">📜 خلاصه داستان:</h4>
             <p className="text-sm text-slate-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {data.sequences.map((seq) => (
          <div key={seq.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden break-inside-avoid">
            <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100 flex flex-wrap justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800">سکانس {seq.id}: <span className="text-primary">{seq.title}</span></h3>
                <div className="text-xs text-slate-500 mt-1">{seq.camera_angle} • {seq.camera_movement}</div>
              </div>
              <button 
                onClick={() => handleGenerateAllImages(seq.id)}
                disabled={generatingAllImages[seq.id] || !seq.video_prompts.some(vp => !vp.imageBase64)}
                className="bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed border border-teal-200 disabled:border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              >
                {generatingAllImages[seq.id] ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>در حال تولید...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>تولید همزمان تصاویر</span>
                  </>
                )}
              </button>
            </div>

            {seq.summary && (<div className="bg-amber-50/50 px-6 py-3 border-b border-amber-100/50"><p className="text-sm text-slate-600 leading-relaxed italic text-justify">{seq.summary}</p></div>)}

            <div className="p-6 space-y-6">
              <div className="print:hidden bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><span>👥</span> کاراکترها:</h4>
                    <div className="flex flex-wrap gap-2">
                        {settings.characters.map(char => (
                            <label key={char.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${presenceMap[seq.id]?.[char.id] ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 opacity-70 hover:opacity-100'}`}>
                                <input type="checkbox" className="hidden" checked={presenceMap[seq.id]?.[char.id] || false} onChange={() => toggleCharacterInSequence(seq.id, char.id)} />
                                <span className={`w-2 h-2 rounded-full ${presenceMap[seq.id]?.[char.id] ? 'bg-primary' : 'bg-slate-300'}`}></span>
                                {char.faName}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><span>🎥</span> تعداد ویدیو:</h4>
                    <div className="flex items-center bg-white rounded border border-slate-300 overflow-hidden w-full max-w-[120px]">
                        <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border-l border-slate-300" onClick={() => handleVideoCountChange(seq.id, (videoCountMap[seq.id] || 1) + 1)}>+</button>
                        <input type="number" className="w-full text-center outline-none text-sm py-1 bg-white text-slate-800" value={videoCountMap[seq.id] || 0} readOnly />
                        <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border-r border-slate-300" onClick={() => handleVideoCountChange(seq.id, (videoCountMap[seq.id] || 1) - 1)}>-</button>
                    </div>
                    <div className="text-xs text-slate-400">{((videoCountMap[seq.id] || 0) * 5)} ثانیه</div>
                </div>
              </div>
              <div className="relative">
                 <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><span>🏔️</span> بک‌گراند (Clean Plate)</h4>
                 <div className="relative group"><p className="font-mono text-sm text-slate-600 bg-white p-4 pr-12 rounded border border-slate-200 dir-ltr text-left leading-relaxed">{seq.background_prompt}</p><div className="absolute top-2 right-2"><CopyButton text={seq.background_prompt} /></div></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><span>🖼️</span> پرامپت تصویر (Full Detail)</h4>
                    <button onClick={() => handleRegenerateImage(seq.id, seq.action_base)} disabled={regeneratingImages[seq.id]} className={`print:hidden bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow text-xs flex items-center gap-1.5 transition-all ${regeneratingImages[seq.id] ? 'opacity-75 cursor-not-allowed' : ''}`} title="تولید مجدد پرامپت تصویر و ویدیوهای متناسب">
                       <span className={regeneratingImages[seq.id] ? "animate-spin" : ""}>{regeneratingImages[seq.id] ? '⏳' : '✨'}</span>
                       <span>{regeneratingImages[seq.id] ? 'در حال نگارش...' : 'تولید مجدد تصویر و ویدیو'}</span>
                    </button>
                </div>
                <div className="relative group"><p className={`font-mono text-sm text-slate-600 bg-slate-50 p-4 pr-12 rounded border border-slate-200 dir-ltr text-left leading-relaxed transition-opacity ${regeneratingImages[seq.id] ? 'opacity-50' : 'opacity-100'}`}>{seq.image_prompt}</p><div className="absolute top-2 right-2"><CopyButton text={seq.image_prompt} /></div></div>
              </div>
              <div className="space-y-3">
                 <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><span>🎬</span> ویدیوها (هر کدام ۵ ثانیه)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seq.video_prompts.map((vp) => (
                    <div key={vp.id} className="border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-4 overflow-hidden">
                      <div className="aspect-[9/16] bg-slate-200 flex items-center justify-center relative">
                        {vp.isGeneratingVideo ? (
                            <div className="flex flex-col items-center gap-2 text-slate-500 text-center p-4">
                                <svg className="animate-spin h-8 w-8 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="text-xs font-bold">در حال ساخت ویدیو...</span>
                                <span className="text-xs text-slate-400">(این فرآیند ممکن است چند دقیقه طول بکشد)</span>
                            </div>
                        ) : vp.videoUrl ? (
                            <video src={vp.videoUrl} controls className="w-full h-full object-cover bg-black" />
                        ) : vp.isGenerating ? (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span className="text-xs">در حال ساخت تصویر...</span>
                          </div>
                        ) : vp.imageBase64 ? (
                          <img src={vp.imageBase64} alt={`Shot ${vp.id}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
                        )}
                      </div>
                      <div className="p-4 pt-0 flex flex-col">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white bg-secondary px-2 py-0.5 rounded-full mb-2 inline-block">Shot {vp.id}</span>
                          <p className="text-sm text-slate-700 leading-6">{vp.description}</p>
                        </div>
                        <div className="flex gap-2 items-start mt-3 pt-3 border-t border-slate-200">
                          <p className="font-mono text-xs text-slate-500 dir-ltr text-left opacity-90 flex-1 p-1">{vp.prompt}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {vp.videoUrl && !vp.isGeneratingVideo && (
                                <VideoDownloadButton 
                                    videoUrl={vp.videoUrl}
                                    episodeTitle={data.episode_title} 
                                    sequenceId={seq.id} 
                                    videoId={vp.id} 
                                />
                            )}
                             {vp.imageBase64 && !vp.isGenerating && !vp.videoUrl && (
                                <button
                                    onClick={() => handleGenerateVideo(seq.id, vp.id)}
                                    disabled={vp.isGeneratingVideo}
                                    className={`p-1.5 rounded-md transition-all border flex items-center justify-center ${
                                        vp.isGeneratingVideo
                                        ? 'bg-slate-200 text-slate-400 cursor-wait'
                                        : 'bg-white text-slate-400 border-slate-200 hover:text-secondary hover:border-secondary shadow-sm'
                                    }`}
                                    title="تولید ویدیو از این تصویر"
                                >
                                    {vp.isGeneratingVideo ? (
                                        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                                    )}
                                </button>
                            )}
                            {vp.imageBase64 && !vp.isGenerating && (
                              <DownloadButton 
                                imageUrl={vp.imageBase64} 
                                episodeTitle={data.episode_title} 
                                sequenceId={seq.id} 
                                videoId={vp.id} 
                              />
                            )}
                            <button
                              onClick={() => handleGenerateSingleImage(seq.id, vp.id)}
                              disabled={vp.isGenerating || vp.isGeneratingVideo || generatingAllImages[seq.id]}
                              className={`p-1.5 rounded-md transition-all border flex items-center justify-center ${
                                vp.isGenerating || vp.isGeneratingVideo || generatingAllImages[seq.id]
                                  ? 'bg-slate-200 text-slate-400 cursor-wait'
                                  : 'bg-white text-slate-400 border-slate-200 hover:text-teal-500 hover:border-teal-400 shadow-sm'
                              }`}
                              title="تولید تصویر این شات"
                            >
                              {vp.isGenerating ? (
                                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10v4"/><path d="M10 12h4"/><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.88.99 6.6 2.6l-2.1 2.1"/><path d="M15 3h6v6"/></svg>
                              )}
                            </button>
                            <CopyButton text={vp.prompt} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100"><span>🔄</span> ترنزیشن: {seq.transition}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="print:hidden sticky bottom-6 flex justify-center z-10">
        <button onClick={updatePrompts} disabled={isUpdating} className={`bg-accent hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 ${isUpdating ? 'opacity-80 cursor-wait' : ''}`}>
            {isUpdating ? (<><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>در حال بازنویسی و تنظیم ویدیوها...</span></>) : (<><span>✨</span> <span>به روز رسانی</span></>)}
        </button>
      </div>
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100 text-center break-inside-avoid relative">
        <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="font-bold text-pink-600">{data.instagram.title}</h3>
            <button onClick={() => handleShare('instagram')} className="p-1.5 bg-white text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full shadow-sm border border-pink-100 transition-all flex items-center gap-1" title="کپی کپشن">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                <span className="text-xs font-bold px-1">کپی کپشن</span>
            </button>
        </div>
        <p className="text-slate-700 mb-4 whitespace-pre-wrap">{data.instagram.caption}</p>
        <div className="text-blue-500 text-sm dir-ltr font-medium">{data.instagram.hashtags.join(' ')}</div>
      </div>
    </div>
  );
};

export default ResultDisplay;