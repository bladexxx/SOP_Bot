import React, { useState, useEffect, useRef } from 'react';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon, CodeIcon, HierarchyIcon, SparklesIcon, SearchIcon, PaperclipIcon, GeminiIcon } from './Icons';

const slides = [
    {
        id: 1,
        title: "Start a Guided SOP",
        visual: (
            <div className="w-full h-full bg-gray-900 p-4 rounded-md border border-gray-700">
                <h3 className="font-bold text-white mb-2">Choose a Guided SOP</h3>
                <div className="space-y-2">
                    <div className="p-2 bg-gray-800 rounded-md border border-gray-600">
                        <p className="font-semibold text-sky-300 text-sm">For Business Users</p>
                        <p className="text-xs text-gray-300">End-to-End Business Validation</p>
                    </div>
                    <div className="p-2 bg-indigo-900/50 rounded-md border-2 border-indigo-500 ring-2 ring-indigo-500/50">
                        <p className="font-semibold text-teal-300 text-sm">For IT Developers</p>
                        <p className="text-xs text-white">Unit & Functional Testing</p>
                    </div>
                </div>
            </div>
        ),
        caption: "Choose a guided workflow based on your role. The bot will lead you through complex processes like testing and validation, step-by-step.",
        narration: "Welcome to the FlowX SOP Bot. To begin, select a guided Standard Operating Procedure based on your role. This is the main function of the bot, designed to ensure a smooth and accurate workflow."
    },
    {
        id: 2,
        title: "Step 1: Select a Configuration",
        visual: (
             <div className="w-full h-full bg-gray-900 p-3 rounded-md border border-gray-700 flex flex-col">
                <h3 className="font-bold text-white text-sm mb-2">Select a Configuration</h3>
                <div className="relative mb-2">
                    <input type="text" readOnly value="Auto-billing" className="w-full bg-gray-800 text-white text-xs rounded-md py-1 px-2 border border-gray-600"/>
                </div>
                <div className="space-y-1 overflow-y-hidden">
                    <div className="p-1.5 bg-gray-800 rounded-md border border-gray-700 text-xs">AutoVouch</div>
                    <div className="p-1.5 bg-indigo-900/50 rounded-md border border-indigo-500 text-xs text-white">Auto-billing (Project)</div>
                    <div className="p-1.5 bg-gray-800 rounded-md border border-gray-700 text-xs">Auto-billing (VEN-12345)</div>
                </div>
            </div>
        ),
        caption: "Find the exact configuration you need for your task. The bot allows you to quickly search and select from all available project and vendor-level configs.",
        narration: "The first step in most procedures is to select your configuration. You can easily search for the one you need, whether it's for an entire project or a specific vendor."
    },
    {
        id: 3,
        title: "Step 2: Execute a Test",
        visual: (
            <div className="w-full h-full bg-gray-900 p-3 rounded-md border border-gray-700 flex flex-col justify-center">
                <h3 className="font-bold text-white text-sm mb-2">Start a New Test</h3>
                 <div className="p-2 border border-gray-700 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-300">Run with Single File</h4>
                     <p className="text-xs text-gray-400 mt-1">Upload a file for immediate testing.</p>
                     <div className="flex justify-end mt-1">
                        <button className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md">Upload and Run</button>
                     </div>
                </div>
            </div>
        ),
        caption: "Provide the necessary data for your test. You can upload a single file for a quick check or point the bot to a batch data path for a full regression run.",
        narration: "Next, you'll execute the test. The bot makes it simple to provide your data, either by uploading a single file for a quick functional test, or by starting a larger batch test."
    },
    {
        id: 4,
        title: "Step 3: Review the Results",
        visual: (
            <div className="w-full h-full bg-gray-900 p-3 rounded-md border border-gray-700 flex flex-col justify-center">
                 <h3 className="font-bold text-white text-sm mb-2">Test Results: Auto-billing</h3>
                 <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-900/50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-green-300">1,235</p>
                        <p className="text-xs text-gray-300">Matched</p>
                    </div>
                    <div className="bg-red-900/50 p-2 rounded-lg">
                        <p className="text-xl font-bold text-red-300">15</p>
                        <p className="text-xs text-gray-300">Mismatched</p>
                    </div>
                </div>
            </div>
        ),
        caption: "After the automated flow completes, the bot presents a clear summary of the test results, showing you exactly what matched and what didn't.",
        narration: "Once the automated test is complete, the bot provides an immediate, easy-to-read summary. You'll see exactly how many records matched the benchmark and how many had discrepancies."
    },
    {
        id: 5,
        title: "Step 4: Analyze with AI",
        visual: (
            <div className="w-full h-full bg-gray-900 p-3 rounded-md border border-gray-700 flex flex-col justify-center">
                 <h3 className="font-bold text-white text-sm mb-2">Root Cause Analysis</h3>
                 <div className="mt-1 p-2 bg-gray-800 rounded-md">
                    <p className="text-xs text-gray-300">
                        <span className="font-semibold text-yellow-400">Probable Cause: </span>
                        Misaligned master data...
                    </p>
                </div>
                 <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-200">Suggested Actions</p>
                    <div className="mt-1 p-1.5 bg-gray-700 rounded-md text-xs text-white">Refresh Vendor Master Data</div>
                </div>
            </div>
        ),
        caption: "For any discrepancies, the AI assistant can perform a root cause analysis, identify the likely problem, and suggest corrective actions to resolve the issue.",
        narration: "The final step is to understand any failures. The built-in AI assistant analyzes discrepancies, points to the probable root cause, and suggests actions, helping you resolve issues quickly."
    },
    {
        id: 6,
        title: "Auxiliary Features",
        visual: (
            <div className="w-full h-full bg-gray-900 p-3 rounded-md border border-gray-700 grid grid-cols-2 grid-rows-2 gap-3 text-center">
                <div className="bg-gray-800 rounded-md p-2 flex flex-col items-center justify-center">
                    <SearchIcon />
                    <p className="text-xs mt-1">Search</p>
                </div>
                 <div className="bg-gray-800 rounded-md p-2 flex flex-col items-center justify-center">
                    <PaperclipIcon />
                    <p className="text-xs mt-1">Knowledge</p>
                </div>
                 <div className="bg-gray-800 rounded-md p-2 flex flex-col items-center justify-center">
                    <SparklesIcon />
                    <p className="text-xs mt-1">Tips</p>
                </div>
                 <div className="bg-gray-800 rounded-md p-2 flex flex-col items-center justify-center">
                    <GeminiIcon />
                    <p className="text-xs mt-1">Ask AI</p>
                </div>
            </div>
        ),
        caption: "Beyond the SOPs, you can use helper commands, upload knowledge documents, get tips, and ask the AI general questions for a more powerful workflow.",
        narration: "While the guided SOP is the primary feature, the bot also includes powerful auxiliary tools. You can search for configurations, upload knowledge documents to make the AI smarter, get helpful tips, and ask the AI questions directly."
    }
];

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) {
            console.warn("Browser does not support Speech Synthesis.");
            return;
        }
        // Cancel any previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Google') && !voice.name.includes('Male')) || voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (isOpen) {
            // Speech synthesis voices may load asynchronously
            const handleVoicesChanged = () => {
                speak(slides[currentIndex].narration);
            };
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
            handleVoicesChanged(); // Call it once in case voices are already loaded
        } else {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }

        // Cleanup
        return () => {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
             // Reset to first slide and play when modal opens
            if (currentIndex !== 0) {
                setCurrentIndex(0);
            } else {
                speak(slides[0].narration);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

     useEffect(() => {
        if (isOpen) {
             speak(slides[currentIndex].narration);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);
    

    if (!isOpen) return null;

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    const handlePlayPause = () => {
        if (window.speechSynthesis.speaking) {
            if (isPlaying) {
                window.speechSynthesis.pause();
                setIsPlaying(false);
            } else {
                window.speechSynthesis.resume();
                setIsPlaying(true);
            }
        } else {
            // If speech ended or never started, play it again
            speak(slides[currentIndex].narration);
        }
    };

    const currentSlide = slides[currentIndex];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-guide-title"
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col relative border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="demo-guide-title" className="text-lg font-bold text-white">Bot Demo: {currentSlide.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close demo">
                        <XCircleIcon className="h-7 w-7" />
                    </button>
                </header>

                <main className="p-6 flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="w-full h-56 bg-gray-900/50 rounded-lg flex items-center justify-center p-2">
                        {currentSlide.visual}
                    </div>
                    <div className="text-gray-300 text-center md:text-left">
                         <p>{currentSlide.caption}</p>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <button onClick={handlePrev} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Previous slide">
                        <ChevronLeftIcon />
                    </button>
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-400 font-medium">
                            {currentIndex + 1} / {slides.length}
                        </p>
                        <button onClick={handlePlayPause} className="p-2 rounded-full text-gray-300 bg-indigo-600 hover:bg-indigo-500 transition-colors" aria-label={isPlaying ? 'Pause narration' : 'Play narration'}>
                            {isPlaying ? <PauseIcon className="h-5 w-5"/> : <PlayIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                    <button onClick={handleNext} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Next slide">
                        <ChevronRightIcon />
                    </button>
                </footer>
            </div>
        </div>
    );
};
