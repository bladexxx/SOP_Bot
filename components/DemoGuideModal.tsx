import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon, SparklesIcon, SearchIcon, PaperclipIcon, GeminiIcon, TemplateIcon, DuplicateIcon, ImportIcon, AddDatabaseIcon, LoadingSpinner } from './Icons';
import { generateSpeechFromText } from '../services/aiService';

const slides = [
    {
        id: 1,
        title: "Start a Guided SOP",
        visual: (
            <div className="w-full h-full bg-white p-4 rounded-md border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">Choose a Guided SOP</h3>
                <div className="space-y-2">
                    <div className="p-2 bg-gray-100 rounded-md border border-gray-200">
                        <p className="font-semibold text-sky-600 text-sm">For Business Users</p>
                        <p className="text-xs text-gray-600">End-to-End Business Validation</p>
                    </div>
                    <div className="p-2 bg-teal-50 rounded-md border-2 border-teal-400 ring-2 ring-teal-400/50">
                        <p className="font-semibold text-teal-700 text-sm">For IT Developers</p>
                        <p className="text-xs text-gray-800">Unit & Functional Testing</p>
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
             <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col">
                <h3 className="font-bold text-gray-800 text-sm mb-2">Select a Configuration</h3>
                <div className="relative mb-2">
                    <input type="text" readOnly value="Auto-billing" className="w-full bg-gray-100 text-gray-800 text-xs rounded-md py-1 px-2 border border-gray-300"/>
                </div>
                <div className="space-y-1 overflow-y-hidden">
                    <div className="p-1.5 bg-gray-100 rounded-md border border-gray-200 text-xs">AutoVouch</div>
                    <div className="p-1.5 bg-teal-50 rounded-md border border-teal-300 text-xs text-gray-800">Auto-billing (Project)</div>
                    <div className="p-1.5 bg-gray-100 rounded-md border border-gray-200 text-xs">Auto-billing (VEN-12345)</div>
                </div>
            </div>
        ),
        caption: "Find the exact configuration you need for your task. The bot allows you to quickly search and select from all available project and vendor-level configs.",
        narration: "The first step in most procedures is to select your configuration. You can easily search for the one you need, whether it's for an entire project or a specific vendor."
    },
    {
        id: 3,
        title: "Flexible Configuration Creation",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col">
                <h3 className="font-bold text-gray-800 text-sm mb-2">Create New Configuration</h3>
                <div className="space-y-1.5 flex-grow flex flex-col justify-center">
                    <div className="p-2 bg-gray-100 rounded-md border border-gray-200 text-xs flex items-center"><TemplateIcon/><span className="ml-2">Start from a Project Template</span></div>
                    <div className="p-2 bg-gray-100 rounded-md border border-gray-200 text-xs flex items-center"><DuplicateIcon/><span className="ml-2">Clone an Existing Configuration</span></div>
                    <div className="p-2 bg-teal-50 rounded-md border-2 border-teal-400 text-xs font-semibold text-teal-800 flex items-center"><ImportIcon/><span className="ml-2">Import from JSON</span></div>
                </div>
            </div>
        ),
        caption: "Create new configurations with ease. Start from a project template, clone an existing setup, or import raw JSON to automatically generate both a config and a template.",
        narration: "Creating new configurations is flexible. You can start from a pre-defined project template, clone an existing configuration, or, for maximum speed, import raw JSON data to instantly generate a complete setup."
    },
    {
        id: 4,
        title: "Establish Golden Benchmarks",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col">
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center"><AddDatabaseIcon /><span className="ml-2">Add Golden Benchmark</span></h3>
                <div className="space-y-2 text-xs flex-grow">
                    <div className="flex items-center space-x-2">
                        <label className="w-20 text-gray-500">Benchmark ID</label>
                        <input type="text" readOnly value="BM-AV-02" className="flex-grow bg-gray-100 rounded-md p-1 border border-gray-300"/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="w-20 text-gray-500">Project Name</label>
                        <input type="text" readOnly value="AutoVouch" className="flex-grow bg-gray-100 rounded-md p-1 border border-gray-300"/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <label className="w-20 text-gray-500">Description</label>
                        <input type="text" readOnly value="New Q2 benchmark..." className="flex-grow bg-gray-100 rounded-md p-1 border border-gray-300"/>
                    </div>
                </div>
                <button className="mt-auto ml-auto px-3 py-1 text-xs font-semibold text-white bg-teal-900 rounded-md">Save Benchmark</button>
            </div>
        ),
        caption: "Define your 'source of truth' for testing by creating Golden Benchmarks. These datasets are used to validate test runs and ensure data integrity over time.",
        narration: "A key feature is the ability to establish your source of truth for testing. You can easily define new Golden Benchmarks, which are then used to validate all future test runs for a project."
    },
    {
        id: 5,
        title: "Step 2: Execute a Test",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col justify-center">
                <h3 className="font-bold text-gray-800 text-sm mb-2">Start a New Test</h3>
                 <div className="p-2 border border-gray-200 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-600 flex items-center"><PaperclipIcon /><span className="ml-2">Run with Single File</span></h4>
                     <p className="text-xs text-gray-500 mt-1">Upload a file for immediate testing.</p>
                     <div className="flex justify-end mt-1">
                        <button className="px-3 py-1 text-xs font-semibold text-white bg-teal-900 rounded-md">Upload and Run</button>
                     </div>
                </div>
            </div>
        ),
        caption: "Provide the necessary data for your test. You can upload a single file for a quick check or point the bot to a batch data path for a full regression run.",
        narration: "Next, you'll execute the test. The bot makes it simple to provide your data, either by uploading a single file for a quick functional test, or by starting a larger batch test."
    },
    {
        id: 6,
        title: "Step 3: Review the Results",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col justify-center">
                 <h3 className="font-bold text-gray-800 text-sm mb-2">Test Results: Auto-billing</h3>
                 <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                        <p className="text-xl font-bold text-green-600">1,235</p>
                        <p className="text-xs text-gray-600">Matched</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                        <p className="text-xl font-bold text-red-600">15</p>
                        <p className="text-xs text-gray-600">Mismatched</p>
                    </div>
                </div>
            </div>
        ),
        caption: "After the automated flow completes, the bot presents a clear summary of the test results, showing you exactly what matched and what didn't.",
        narration: "Once the automated test is complete, the bot provides an immediate, easy-to-read summary. You'll see exactly how many records matched the benchmark and how many had discrepancies."
    },
    {
        id: 7,
        title: "Step 4: Analyze with AI",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex flex-col justify-center">
                 <h3 className="font-bold text-gray-800 text-sm mb-2">Root Cause Analysis</h3>
                 <div className="mt-1 p-2 bg-gray-100 rounded-md">
                    <p className="text-xs text-gray-700">
                        <span className="font-semibold text-yellow-600">Probable Cause: </span>
                        Misaligned master data...
                    </p>
                </div>
                 <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700">Suggested Actions</p>
                    <div className="mt-1 p-1.5 bg-gray-200 rounded-md text-xs text-gray-800">Refresh Vendor Master Data</div>
                </div>
            </div>
        ),
        caption: "For any discrepancies, the AI assistant can perform a root cause analysis, identify the likely problem, and suggest corrective actions to resolve the issue.",
        narration: "The final step is to understand any failures. The built-in AI assistant analyzes discrepancies, points to the probable root cause, and suggests actions, helping you resolve issues quickly."
    },
     {
        id: 8,
        title: "Augment AI with Knowledge",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 flex items-center justify-center space-x-4">
                <div className="text-center">
                    <PaperclipIcon />
                    <p className="text-xs mt-1">Upload .md</p>
                </div>
                <div className="text-gray-300 font-sans text-2xl">&rarr;</div>
                <div className="text-center p-3 bg-teal-50 rounded-full">
                    <GeminiIcon className="h-8 w-8 text-teal-700"/>
                    <p className="text-xs mt-1 font-semibold">Smarter AI</p>
                </div>
                <div className="text-gray-300 font-sans text-2xl">&rarr;</div>
                 <div className="text-center">
                    <SparklesIcon />
                    <p className="text-xs mt-1">New Tips</p>
                </div>
            </div>
        ),
        caption: "Make the AI assistant smarter by uploading your own knowledge documents. The bot will use this context to provide more accurate answers and automatically generate helpful tips.",
        narration: "You can make the AI assistant an expert on your specific processes. Simply upload your own knowledge documents, and the bot will use that information to give more tailored answers and even create new tips for your team automatically."
    },
    {
        id: 9,
        title: "Auxiliary Features",
        visual: (
            <div className="w-full h-full bg-white p-3 rounded-md border border-gray-200 grid grid-cols-2 grid-rows-2 gap-3 text-center">
                <div className="bg-gray-100 text-gray-700 rounded-md p-2 flex flex-col items-center justify-center">
                    <SearchIcon />
                    <p className="text-xs mt-1">Search</p>
                </div>
                 <div className="bg-gray-100 text-gray-700 rounded-md p-2 flex flex-col items-center justify-center">
                    <PaperclipIcon />
                    <p className="text-xs mt-1">Knowledge</p>
                </div>
                 <div className="bg-gray-100 text-gray-700 rounded-md p-2 flex flex-col items-center justify-center">
                    <SparklesIcon />
                    <p className="text-xs mt-1">Tips</p>
                </div>
                 <div className="bg-gray-100 text-gray-700 rounded-md p-2 flex flex-col items-center justify-center">
                    <GeminiIcon />
                    <p className="text-xs mt-1">Ask AI</p>
                </div>
            </div>
        ),
        caption: "The bot includes a suite of powerful tools. You can search configurations, get helpful tips, and ask the AI general questions about your project's context.",
        narration: "Beyond the main workflows, the bot includes powerful auxiliary tools. You can instantly search all configurations, get helpful tips on how to use the bot, and ask the integrated AI assistant complex questions about your data."
    }
];

// Audio decoding helpers from Gemini documentation.
// These are necessary to process the raw PCM audio data returned by the TTS API.

/**
 * Decodes a base64 string into a Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that can be played by the Web Audio API.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (Gemini TTS is 24000Hz).
 * @param numChannels The number of audio channels (Gemini TTS is mono).
 * @returns A promise that resolves with the decoded AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we create an Int16Array view on the buffer.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer samples to the -1.0 to 1.0 range for the Web Audio API.
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioCache, setAudioCache] = useState<Record<number, string>>({}); // Cache for base64 audio strings

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop any currently playing audio
    const stopAudio = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    // Cleanup when the modal is closed
    useEffect(() => {
        if (!isOpen) {
            stopAudio();
            setIsGeneratingAudio(false);
            setCurrentIndex(0); // Reset to the first slide
        } else if (!audioContextRef.current) {
             // Initialize AudioContext on open. Gemini TTS outputs at 24000Hz.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
    }, [isOpen, stopAudio]);
    
    // Function to play audio from a base64 string
    const playAudio = useCallback(async (base64Audio: string) => {
        if (!audioContextRef.current) return;
        
        stopAudio();

        try {
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };

            source.start();
            audioSourceRef.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("[DemoGuide] Error playing audio:", error);
            setIsPlaying(false);
        }
    }, [stopAudio]);

    // Main effect to auto-generate and auto-play audio when the slide changes
    useEffect(() => {
        if (!isOpen) return;

        let isCancelled = false;

        const generateAndPlay = async () => {
            stopAudio();
            const narrationText = slides[currentIndex].narration;

            if (audioCache[currentIndex]) {
                await playAudio(audioCache[currentIndex]);
            } else {
                setIsGeneratingAudio(true);
                try {
                    const base64Audio = await generateSpeechFromText(narrationText);
                    if (!isCancelled) {
                        setAudioCache(prev => ({ ...prev, [currentIndex]: base64Audio }));
                        await playAudio(base64Audio);
                    }
                } catch (error) {
                    console.error("[DemoGuide] Failed to generate speech:", error);
                } finally {
                    if (!isCancelled) {
                        setIsGeneratingAudio(false);
                    }
                }
            }
        };

        generateAndPlay();

        return () => {
            isCancelled = true;
            stopAudio();
        };
    }, [isOpen, currentIndex, playAudio, stopAudio, audioCache]);

    if (!isOpen) return null;

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            stopAudio();
        } else if (audioCache[currentIndex] && !isGeneratingAudio) {
            playAudio(audioCache[currentIndex]);
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col relative border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 id="demo-guide-title" className="text-lg font-bold text-gray-900">Bot Demo: {currentSlide.title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Close demo">
                        <XCircleIcon className="h-7 w-7" />
                    </button>
                </header>

                <main className="p-6 flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="w-full h-56 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                        {currentSlide.visual}
                    </div>
                    <div className="text-gray-700 text-center md:text-left">
                         <p>{currentSlide.caption}</p>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <button onClick={handlePrev} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors" aria-label="Previous slide">
                        <ChevronLeftIcon />
                    </button>
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-500 font-medium">
                            {currentIndex + 1} / {slides.length}
                        </p>
                        <button 
                            onClick={handlePlayPause} 
                            disabled={isGeneratingAudio}
                            className="p-2 rounded-full text-white bg-teal-900 hover:bg-teal-800 transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                            aria-label={isPlaying ? 'Stop narration' : 'Play narration'}
                        >
                            {isGeneratingAudio ? <LoadingSpinner /> : (isPlaying ? <PauseIcon className="h-5 w-5"/> : <PlayIcon className="h-5 w-5"/>)}
                        </button>
                    </div>
                    <button onClick={handleNext} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors" aria-label="Next slide">
                        <ChevronRightIcon />
                    </button>
                </footer>
            </div>
        </div>
    );
};
