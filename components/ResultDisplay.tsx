import React from 'react';

interface ResultDisplayProps {
  content: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content }) => {
  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `scenario_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  }

  // Basic formatting to handle markdown headers and bold text for display without heavy libraries
  const formatLine = (line: string, index: number) => {
    if (line.startsWith('###')) {
      return <h3 key={index} className="text-2xl font-bold text-primary mt-8 mb-4 border-b pb-2">{line.replace(/^#+\s/, '')}</h3>;
    }
    if (line.startsWith('####')) {
        return <h4 key={index} className="text-xl font-bold text-secondary mt-6 mb-3">{line.replace(/^#+\s/, '')}</h4>;
    }
    if (line.trim().startsWith('>')) {
        return (
            <div key={index} className="bg-slate-100 border-r-4 border-accent p-4 rounded my-4 italic text-slate-700" dir="ltr">
                {line.replace(/^>\s*/, '')}
            </div>
        );
    }
    if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-slate-200" />;
    }
    if (line.startsWith('*')) {
         // Handle bullets list
         return <li key={index} className="list-disc list-inside mr-4 mb-1">{line.replace(/^\*\s*/, '')}</li>
    }

    // Bold replacement
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
        <p key={index} className="mb-2 leading-relaxed whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </p>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <h2 className="font-bold text-slate-700">نتیجه سناریو</h2>
        <button 
            onClick={downloadText}
            className="flex items-center gap-2 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
        >
            <span>📥</span> دانلود فایل متنی
        </button>
      </div>
      <div className="p-8 text-lg">
        {content.split('\n').map((line, idx) => formatLine(line, idx))}
      </div>
    </div>
  );
};

export default ResultDisplay;
