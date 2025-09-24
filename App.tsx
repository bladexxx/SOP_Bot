import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Actor, CardType, ActionType, Configuration, BenchmarkDataset, ConfigTemplate, Flashcard } from './types';
import { CardRenderer } from './components/CardRenderer';
import { BotIcon, UserIcon, SendIcon, PaperclipIcon, LoadingSpinner, SearchIcon, SparklesIcon } from './components/Icons';
import { FlashcardModal } from './components/FlashcardModal';

const mockConfigs: Configuration[] = [
  {
    projectName: 'Auto-billing',
    level: 'Project',
    status: 'Active',
    lastModified: '2023-10-20',
    createdBy: 'admin@example.com',
    settings: { threshold: 100, autoApprove: true }
  },
  {
    projectName: 'Auto-billing',
    vendorId: 'VEN-12345',
    level: 'Vendor',
    status: 'Active',
    lastModified: '2023-10-26',
    createdBy: 'user@example.com',
    settings: { threshold: 50, autoApprove: false }
  },
  {
    projectName: 'AutoVouch',
    level: 'Project',
    status: 'Active',
    lastModified: '2023-10-25',
    createdBy: 'user@example.com',
    settings: { threshold: 250, autoApprove: false }
  },
  {
    projectName: 'Q-Gen',
    vendorId: 'VEN-ABCDE',
    level: 'Vendor',
    status: 'Paused',
    lastModified: '2023-09-15',
    createdBy: 'admin@example.com',
    settings: { threshold: 500, autoApprove: true }
  }
];

const mockTemplates: ConfigTemplate[] = [
    {
        templateName: "Standard Auto-Billing Template",
        projectName: "Auto-billing",
        description: "For standard billing processes with approval rules.",
        settingsSchema: {
            threshold: 'number',
            autoApprove: 'boolean',
        }
    },
    {
        templateName: "Standard AutoVouch Template",
        projectName: "AutoVouch",
        description: "For voucher generation with basic thresholding.",
        settingsSchema: {
            threshold: 'number',
            autoApprove: 'boolean',
        }
    },
     {
        templateName: "Employee Expense Reports",
        projectName: "Expense-Reports",
        description: "Template for T&E reports with daily limits and receipt rules.",
        settingsSchema: {
            dailyLimit: 'number',
            requiresReceipt: 'boolean',
            departmentCode: 'string',
        }
    }
];

const mockBenchmarkDatasets: BenchmarkDataset[] = [
    {
        id: 'BM-AB-01',
        projectName: 'Auto-billing',
        description: 'Primary benchmark covering high-volume vendors and common invoice types.',
        dataVolume: 50000,
        vendorCount: 150,
        timeliness: 'Last 3 Months',
        coveredVendors: ['VEN-12345', 'VEN-67890', 'VEN-54321']
    },
    {
        id: 'BM-AB-02',
        projectName: 'Auto-billing',
        description: 'Supplementary dataset for Q4 2023, focusing on seasonal and international vendors.',
        dataVolume: 12000,
        vendorCount: 45,
        timeliness: 'Last 1 Month',
        coveredVendors: ['VEN-INTL-A', 'VEN-SEASON-B', 'VEN-12345']
    },
    {
        id: 'BM-AV-01',
        projectName: 'AutoVouch',
        description: 'Comprehensive benchmark for all active AutoVouch vendors.',
        dataVolume: 125000,
        vendorCount: 88,
        timeliness: 'Last 6 Months',
        coveredVendors: ['VEN-AV-101', 'VEN-AV-102']
    }
];

const mockFlashcards: Flashcard[] = [
    {
        id: 1,
        question: "How do I start a guided workflow?",
        answer: "Click the 'Start a Guided SOP' button on the welcome card, or type 'start sop'. This will walk you through common processes step-by-step."
    },
    {
        id: 2,
        question: "How can I create a new configuration?",
        answer: "Type 'new config' or 'create config'. The bot will then ask if you want to use a template or clone an existing configuration."
    },
    {
        id: 3,
        question: "How do I run a test for an existing project?",
        answer: "Type 'run test for [Project Name]', for example, 'run test for Auto-billing'. The bot will then ask you to select the specific configuration and provide test data."
    },
    {
        id: 4,
        question: "How can I see the benchmark datasets for a project?",
        answer: "Type 'show benchmarks for [Project Name]', e.g., 'show benchmarks for AutoVouch'. The bot will display cards with details for each available benchmark."
    },
    {
        id: 5,
        question: "How do I find a specific configuration?",
        answer: "Use the search bar at the top of the screen, or type a query like 'find VEN-12345' or 'check config for Auto-billing'."
    }
];


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Configuration[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

     // Handle clicks outside of search to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search filtering
    useEffect(() => {
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = mockConfigs.filter(config => 
                config.projectName.toLowerCase().includes(lowerQuery) ||
                (config.vendorId && config.vendorId.toLowerCase().includes(lowerQuery))
            );
            setSearchResults(filtered);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery]);
    
    const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage = { 
            id: Date.now(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            ...message 
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);
    
    const updateCardInMessage = useCallback((messageId: number, newPayload: any) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.card) {
                return {
                    ...msg,
                    card: {
                        ...msg.card,
                        payload: { ...msg.card.payload, ...newPayload }
                    }
                };
            }
            return msg;
        }));
    }, []);

    const handleBotResponse = useCallback(async (userInput: string) => {
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 1000));

        const lowerInput = userInput.toLowerCase();
        const words = lowerInput.replace(/[,.]/g, '').split(' ');

        if (lowerInput.includes('benchmark') || lowerInput.includes('golden')) {
            const potentialProject = words.find(word => mockBenchmarkDatasets.some(b => b.projectName.toLowerCase() === word));
            const potentialVendor = words.find(word => word.toUpperCase().startsWith('VEN-'));

            if (potentialProject && potentialVendor) {
                const projectBenchmarks = mockBenchmarkDatasets.filter(b => b.projectName.toLowerCase() === potentialProject);
                let isCovered = false;
                for (const benchmark of projectBenchmarks) {
                    if (benchmark.coveredVendors.some(v => v.toLowerCase() === potentialVendor)) {
                        isCovered = true;
                        break;
                    }
                }
                addMessage({ actor: Actor.BOT, content: `Checking coverage for vendor ${potentialVendor.toUpperCase()} in ${potentialProject}...` });
                addMessage({ actor: Actor.BOT, content: isCovered ? `Yes, vendor ${potentialVendor.toUpperCase()} is covered by at least one benchmark dataset for this project.` : `No, vendor ${potentialVendor.toUpperCase()} is not found in any benchmark datasets for this project.` });

            } else if (potentialProject) {
                const projectBenchmarks = mockBenchmarkDatasets.filter(b => b.projectName.toLowerCase() === potentialProject);
                if (projectBenchmarks.length > 0) {
                    addMessage({ actor: Actor.BOT, content: `Found ${projectBenchmarks.length} golden benchmark dataset(s) for project ${potentialProject}:` });
                    projectBenchmarks.forEach(benchmark => {
                        addMessage({ actor: Actor.BOT, card: { type: CardType.BENCHMARK_LIST, payload: benchmark } });
                    });
                } else {
                    addMessage({ actor: Actor.BOT, content: `I couldn't find any benchmark datasets for project ${potentialProject}.` });
                }
            } else {
                addMessage({ actor: Actor.BOT, content: "Which project's benchmark datasets would you like to see? For example, 'show benchmarks for Auto-billing'." });
            }
        } else if (lowerInput.includes('test')) {
             addMessage({ actor: Actor.USER, content: "Run Test" });
             addMessage({ actor: Actor.BOT, content: "Sure, which configuration do you want to run a test for?" });
             addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'quickAction' } } });
        } else if (lowerInput.includes('config') || lowerInput.includes('add') || lowerInput.includes('new')) {
             addMessage({ 
                actor: Actor.BOT,
                card: {
                    type: CardType.CONFIG_CREATOR_CHOOSER,
                    payload: { }
                }
             });
        } else if (lowerInput.includes('pause') || lowerInput.includes('stop') || lowerInput.includes('disable')) {
             addMessage({
                actor: Actor.BOT,
                card: {
                    type: CardType.CONFIRMATION,
                    payload: { action: 'PAUSE', project: 'Auto-billing' }
                }
             });
        } else if (lowerInput.includes('query') || lowerInput.includes('find') || lowerInput.includes('check')) {
            const potentialProject = words.find(word => mockConfigs.some(c => c.projectName.toLowerCase() === word));
            const potentialVendor = words.find(word => mockConfigs.some(c => c.vendorId?.toLowerCase() === word));

            const matches = mockConfigs.filter(config => {
                const projectMatch = potentialProject && config.projectName.toLowerCase() === potentialProject;
                const vendorMatch = potentialVendor && config.vendorId?.toLowerCase() === potentialVendor;

                if (potentialProject && potentialVendor) {
                    return projectMatch && vendorMatch;
                }
                if (potentialProject) {
                    return projectMatch;
                }
                 if (potentialVendor) {
                    return vendorMatch;
                }
                return false;
            });

            if (matches.length > 0) {
                addMessage({
                    actor: Actor.BOT,
                    content: `Found ${matches.length} matching configuration(s):`
                });
                matches.forEach(config => {
                    addMessage({
                        actor: Actor.BOT,
                        card: {
                            type: CardType.CONFIG_DETAILS,
                            payload: config
                        }
                    });
                });
            } else {
                addMessage({ actor: Actor.BOT, content: "I couldn't find a configuration matching your query. Try 'check config for Auto-billing' or 'find VEN-12345'." });
            }
        } else {
             addMessage({ actor: Actor.BOT, content: `I'm not sure how to handle "${userInput}". Try "new config", "test AutoVouch", or "show benchmarks".` });
        }

        setIsLoading(false);
    }, [addMessage]);

    useEffect(() => {
        const initialBotMessage = () => {
            setIsLoading(true);
            setTimeout(() => {
                addMessage({
                    actor: Actor.BOT,
                    card: { type: CardType.WELCOME }
                });
                setIsLoading(false);
            }, 1000);
        };
        initialBotMessage();
        
        // Example of a proactive alert
        setTimeout(() => {
             addMessage({
                actor: Actor.BOT,
                card: {
                    type: CardType.ALERT,
                    payload: {
                        project: "Q-Gen",
                        severity: "High",
                        message: "Detected an unusual spike in data mismatches over the last hour."
                    }
                }
            })
        }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendMessage = () => {
        if (input.trim() === '') return;
        addMessage({ actor: Actor.USER, content: input });
        handleBotResponse(input);
        setInput('');
    };
    
    const handleCardAction = async (action: ActionType, payload?: any) => {
        setIsLoading(true);
        
        // Finds the latest, active SOP guide card to prevent acting on an outdated one.
        const findSopMessage = (guideId: number) => messages.slice().reverse().find(msg => 
            msg.card?.type === CardType.SOP_GUIDE && 
            msg.card?.payload?.guideId === guideId &&
            msg.card?.payload?.status !== 'superseded'
        );

        // Deactivates the old SOP guide and posts a new, updated one, merging any new payload data.
        const advanceSopGuide = (guideId: number, additionalPayload: object = {}) => {
            const sopMessage = findSopMessage(guideId);
            if (sopMessage && sopMessage.card) {
                // Deactivate the old card in the message history.
                updateCardInMessage(sopMessage.id, { status: 'superseded' });

                // Prepare the payload for the new, updated card.
                const newPayload = {
                    ...sopMessage.card.payload,
                    ...additionalPayload, // Merge new data like selectedConfig
                    currentStep: (sopMessage.card.payload.currentStep || 1) + 1,
                    status: 'active' // Ensure new card is active
                };

                // Add the new card to the conversation.
                addMessage({
                    actor: Actor.BOT,
                    card: { type: CardType.SOP_GUIDE, payload: newPayload }
                });
            }
        };

        switch(action) {
            case ActionType.SHOW_FLASHCARDS:
                setIsFlashcardModalOpen(true);
                break;
            case ActionType.SHOW_SOP_CHOOSER:
                addMessage({ actor: Actor.USER, content: "Start a Guided SOP" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.SOP_CHOOSER } });
                break;
            case ActionType.START_SOP:
                addMessage({ actor: Actor.USER, content: `Selected SOP: ${payload.sopTitle}`});
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.SOP_GUIDE,
                        payload: { guideId: Date.now(), sopType: payload.sopType, sopTitle: payload.sopTitle, currentStep: 1 }
                    }
                });
                break;
            case ActionType.SHOW_CONFIG_SELECTOR:
                addMessage({ actor: Actor.USER, content: "Select Existing Configuration" });
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_SELECTOR,
                        payload: { guideId: payload?.guideId, source: payload?.source }
                    }
                });
                break;
            case ActionType.SELECT_CONFIG:
                 addMessage({ actor: Actor.USER, content: `Selected config: ${payload.selectedConfig.projectName} ${payload.selectedConfig.vendorId || ''}` });
                 updateCardInMessage(payload.messageId, { status: 'selected' });
                 
                 if (payload.source === 'clone') {
                    addMessage({ actor: Actor.BOT, content: "Starting wizard with cloned data..." });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_WIZARD, payload: { step: 1, data: { clonedData: payload.selectedConfig, guideId: payload.guideId } } } });
                    setIsLoading(false);
                    return;
                 }

                 if (payload.guideId) {
                    addMessage({ actor: Actor.BOT, content: "Configuration selected. Here is the next step." });
                    advanceSopGuide(payload.guideId, { selectedConfig: payload.selectedConfig });
                 } else if (payload.source === 'quickAction') {
                    addMessage({ actor: Actor.BOT, content: "Great. Now, how do you want to provide the test data?" });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.TEST_STARTER, payload: { config: payload.selectedConfig } } });
                 }
                break;
            case ActionType.START_CONFIG:
                addMessage({ actor: Actor.USER, content: "Start: Create Configuration" });
                addMessage({ 
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_CREATOR_CHOOSER,
                        payload: { guideId: payload?.guideId }
                    }
                 });
                break;
            case ActionType.START_FROM_TEMPLATE:
                addMessage({ actor: Actor.USER, content: "Create config from template" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.TEMPLATE_SELECTOR, payload: { guideId: payload?.guideId } } });
                break;
            case ActionType.START_CLONE:
                addMessage({ actor: Actor.USER, content: "Clone existing config" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'clone', guideId: payload?.guideId } } });
                break;
            case ActionType.SELECT_TEMPLATE:
                addMessage({ actor: Actor.USER, content: `Selected template: ${payload.selectedTemplate.templateName}` });
                updateCardInMessage(payload.messageId, { status: 'selected' });
                addMessage({ actor: Actor.BOT, content: "Starting wizard with the selected template..." });
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_WIZARD,
                        payload: { step: 1, data: { template: payload.selectedTemplate, guideId: payload.guideId } }
                    }
                });
                break;
            case ActionType.SUBMIT_CONFIG_STEP:
                const { step: currentStep, data, messageId } = payload;
                const totalSteps = data.level === 'Vendor' ? 4 : 3;

                if (currentStep === 1) {
                    updateCardInMessage(messageId, { step: 2, data });
                } else if (currentStep === 2) {
                    const nextStep = data.level === 'Vendor' ? 3 : totalSteps;
                    updateCardInMessage(messageId, { step: nextStep, data });
                } else if (currentStep === 3 && data.level === 'Vendor') {
                    updateCardInMessage(messageId, { step: 4, data });
                } else if (currentStep === totalSteps) {
                    updateCardInMessage(messageId, { status: 'complete', data });
                    const newConfig: Configuration = {
                        projectName: data.projectName,
                        vendorId: data.vendorId,
                        level: data.level,
                        status: 'Active',
                        lastModified: new Date().toISOString().split('T')[0],
                        createdBy: 'user@example.com',
                        settings: data.settings
                    };
                    addMessage({ actor: Actor.BOT, content: `Configuration for ${data.projectName} ${data.vendorId ? `(${data.vendorId})` : ''} submitted successfully!`});
                    
                    if (data.guideId) {
                        addMessage({ actor: Actor.BOT, content: "Configuration saved. Here is the next step." });
                        advanceSopGuide(data.guideId, { selectedConfig: newConfig });
                    }
                }
                break;
            case ActionType.START_TEST:
                 addMessage({ actor: Actor.USER, content: `Run Test` });
                 addMessage({ actor: Actor.BOT, content: "Sure, which configuration do you want to run a test for?" });
                 addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'quickAction' } } });
                break;
            case ActionType.START_BATCH_TEST:
                if (payload.path) {
                    addMessage({ actor: Actor.USER, content: `Start batch test from: ${payload.path}` });
                    addMessage({ actor: Actor.BOT, content: `Starting test on batch data from ${payload.path} against benchmark ${payload.benchmarkId}. This may take a moment...` });
                    await new Promise(res => setTimeout(res, 4000));
                    addMessage({
                        actor: Actor.BOT,
                        content: "Batch test complete. Here are the results:",
                        card: {
                            type: CardType.TEST_RESULTS_SUMMARY,
                            payload: { project: 'Batch Process', matched: 1250, mismatched: 75, testId: 'TID-BATCH-001', guideId: payload?.guideId, benchmarkId: payload.benchmarkId }
                        }
                    });
                    if (payload?.guideId) {
                        addMessage({ actor: Actor.BOT, content: "Test complete. Here is the next step." });
                        advanceSopGuide(payload.guideId);
                    }
                } else {
                    addMessage({ actor: Actor.USER, content: "Run Verification Test" });
                    const sopMessage = findSopMessage(payload.guideId);
                    if (sopMessage) {
                        const config = sopMessage.card?.payload?.selectedConfig;
                        if (config) {
                             addMessage({
                                actor: Actor.BOT,
                                content: "Please provide the data for the test.",
                                card: {
                                    type: CardType.TEST_STARTER,
                                    payload: { guideId: payload.guideId, config: config }
                                }
                            });
                        } else {
                             addMessage({ actor: Actor.BOT, content: "Error: No configuration was selected or created in the previous step." });
                        }
                    } else {
                        addMessage({ actor: Actor.BOT, content: "Error: Could not find the associated SOP Guide." });
                    }
                }
                break;
            case ActionType.RUN_TEST_WITH_FILE:
                addMessage({ actor: Actor.USER, content: `Run test with file: ${payload.file.name}` });
                updateCardInMessage(payload.messageId, { status: 'submitted' });
                addMessage({ actor: Actor.BOT, content: `Uploading and processing ${payload.file.name} against benchmark ${payload.benchmarkId}...` });
                await new Promise(res => setTimeout(res, 4000));
                addMessage({
                    actor: Actor.BOT,
                    content: "Single file test complete. Here are the results:",
                    card: {
                        type: CardType.TEST_RESULTS_SUMMARY,
                        payload: { project: 'Single File Test', matched: 85, mismatched: 15, testId: 'TID-SINGLE-556', guideId: payload?.guideId, benchmarkId: payload.benchmarkId }
                    }
                });
                if (payload?.guideId) {
                    addMessage({ actor: Actor.BOT, content: "Test complete. Here is the next step." });
                    advanceSopGuide(payload.guideId);
                }
                break;
             case ActionType.DOWNLOAD_REPORT:
                addMessage({ actor: Actor.USER, content: "Download Report" });
                addMessage({ actor: Actor.BOT, content: "Your report is being generated... Here is the link: detailed_report.xlsx" });
                break;
             case ActionType.TRIGGER_ANALYSIS:
                addMessage({ actor: Actor.USER, content: "Analyze Discrepancies" });
                addMessage({ actor: Actor.BOT, content: "Running analysis on test results..." });
                await new Promise(res => setTimeout(res, 2000));
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.ANALYSIS_RESULTS,
                        payload: { dataQuality: 12, logic: 3, testId: payload.testId, guideId: payload?.guideId }
                    }
                });
                 if (payload?.guideId) {
                    addMessage({ actor: Actor.BOT, content: "Analysis complete. Here is the next step." });
                    advanceSopGuide(payload.guideId);
                 }
                break;
            case ActionType.VIEW_METABASE_REPORT:
                addMessage({ actor: Actor.USER, content: "View on Metabase" });
                addMessage({ actor: Actor.BOT, content: "Here is the link to the detailed report on Metabase: [metabase.example.com/d/12345](https://metabase.example.com/d/12345)" });
                break;
            case ActionType.INVESTIGATE_ROOT_CAUSE:
                addMessage({ actor: Actor.USER, content: "Find Root Cause & Suggestions" });
                addMessage({ actor: Actor.BOT, content: "Investigating discrepancies... this may take a moment." });
                await new Promise(res => setTimeout(res, 2500));
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.ROOT_CAUSE_ANALYSIS,
                        payload: {
                            cause: "Analysis suggests a high probability of misaligned master data for vendor IDs in the 'VEN-6xxxx' range.",
                            suggestedActions: [
                                { title: "Refresh Vendor Master Data & Rerun Test", action: "REFRESH_DATA" },
                                { title: "Adjust Config Threshold for this Vendor", action: "ADJUST_CONFIG" },
                                { title: "Escalate to Data Stewardship Team", action: "ESCALATE" }
                            ]
                        }
                    }
                });
                 if (payload?.guideId) {
                    addMessage({ actor: Actor.BOT, content: "Investigation complete. Here is the next step." });
                    advanceSopGuide(payload.guideId);
                 }
                break;
             case ActionType.SUGGESTED_ACTION:
                addMessage({ actor: Actor.USER, content: `Perform action: ${payload.title}` });
                addMessage({ actor: Actor.BOT, content: `Acknowledged. I have initiated the action: "${payload.title}".`});
                break;
            case ActionType.TRIGGER_DIAGNOSTIC:
                 addMessage({ actor: Actor.USER, content: `Diagnose record ${payload?.recordId}` });
                 addMessage({ actor: Actor.BOT, content: "Fetching details for diagnostic..." });
                 await new Promise(res => setTimeout(res, 1500));
                 addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.INTERACTIVE_DIAGNOSTIC,
                        payload: { 
                            recordId: payload?.recordId || 'CM-123', 
                            data: { 'invoice_amount': 100.50, 'system_amount': 95.50, 'rule_applied': 'RULE-005' }, 
                            status: 'new',
                            guideId: payload?.guideId
                        }
                    }
                 });
                break;
            case ActionType.RERUN_DIAGNOSTIC:
                updateCardInMessage(payload.messageId, { status: 'running' });
                await new Promise(res => setTimeout(res, 2500));
                updateCardInMessage(payload.messageId, { status: 'resolved' });
                break;
            case ActionType.CONFIRM_PAUSE_PRODUCTION:
                addMessage({ actor: Actor.USER, content: "Confirm PAUSE Production" });
                addMessage({ actor: Actor.BOT, content: `Acknowledged. Production process for ${payload?.project} is now paused.` });
                break;
            case ActionType.CANCEL_ACTION:
                addMessage({ actor: Actor.USER, content: "Cancel Action" });
                addMessage({ actor: Actor.BOT, content: "Action cancelled." });
                break;
            case ActionType.UPLOAD_FILE:
                 if (payload && payload.file) {
                    updateCardInMessage(payload.messageId, { status: 'uploading', fileName: payload.file.name });
                    await new Promise(res => setTimeout(res, 2000)); // Simulate upload
                    updateCardInMessage(payload.messageId, { status: 'processing' });
                    await new Promise(res => setTimeout(res, 3000)); // Simulate processing
                    updateCardInMessage(payload.messageId, { status: 'complete', result: 'File processed. Standardized 56 rows.' });
                    if (payload.guideId) {
                        advanceSopGuide(payload.guideId);
                    }
                 } else {
                    addMessage({ actor: Actor.USER, content: "Upload Data File" });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.FILE_UPLOAD, payload: { status: 'idle', guideId: payload?.guideId } } });
                 }
                 break;
            case ActionType.VIEW_BENCHMARK_DETAILS:
                addMessage({ actor: Actor.USER, content: `Show details for benchmark ${payload.benchmarkId}` });
                const benchmark = mockBenchmarkDatasets.find(b => b.id === payload.benchmarkId);
                if (benchmark) {
                    addMessage({ 
                        actor: Actor.BOT, 
                        content: `Here are the details for benchmark dataset ${payload.benchmarkId}:`,
                        card: { type: CardType.BENCHMARK_LIST, payload: benchmark }
                    });
                } else {
                    addMessage({ actor: Actor.BOT, content: `Sorry, I couldn't find details for benchmark ${payload.benchmarkId}.` });
                }
                break;
            case ActionType.VIEW_BENCHMARK_ON_METABASE:
                addMessage({ actor: Actor.USER, content: `View benchmark ${payload.benchmarkId} on Metabase` });
                addMessage({ actor: Actor.BOT, content: `Here is the link to the detailed dashboard for this benchmark: [metabase.example.com/d/benchmark-${payload.benchmarkId}](https://metabase.example.com/d/benchmark-${payload.benchmarkId})` });
                break;
        }

        setIsLoading(false);
    };

    const handleSearchResultClick = (config: Configuration) => {
        addMessage({
            actor: Actor.BOT,
            content: `Displaying details for configuration: ${config.projectName}`,
            card: {
                type: CardType.CONFIG_DETAILS,
                payload: config,
            }
        });
        setSearchQuery('');
        setShowSearchResults(false);
    };

    return (
        <div className="bg-gray-900 text-white h-screen flex flex-col font-sans">
            <FlashcardModal 
                isOpen={isFlashcardModalOpen} 
                onClose={() => setIsFlashcardModalOpen(false)}
                cards={mockFlashcards}
            />
            <header className="bg-gray-800 p-4 shadow-md z-20 flex justify-between items-center">
                <h1 className="text-xl font-bold">Teams SOP Bot Simulator</h1>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsFlashcardModalOpen(true)}
                        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        aria-label="Show tips and commands"
                    >
                        <SparklesIcon />
                        <span className="text-sm font-medium hidden md:block">Tips</span>
                    </button>
                    <div className="relative w-64 md:w-80" ref={searchRef}>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon />
                            </span>
                            <input 
                                type="text"
                                placeholder="Search configurations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        {showSearchResults && (
                            <div className="absolute mt-2 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <ul>
                                    {searchResults.length > 0 ? (
                                        searchResults.map(config => (
                                            <li 
                                                key={`${config.projectName}-${config.vendorId || 'project'}`} 
                                                className="px-4 py-2 hover:bg-indigo-600 cursor-pointer"
                                                onClick={() => handleSearchResultClick(config)}
                                            >
                                                <div className="font-semibold">{config.projectName} <span className={`text-xs font-bold ${config.level === 'Project' ? 'text-indigo-400' : 'text-teal-400'}`}>({config.level})</span></div>
                                                <div className="text-sm text-gray-400">{config.vendorId || 'Applies to all vendors'}</div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-400">No results found</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-4 ${msg.actor === Actor.USER ? 'justify-end' : ''}`}>
                            {msg.actor === Actor.BOT && <BotIcon />}
                            <div className={`flex flex-col ${msg.actor === Actor.USER ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center space-x-2 ${msg.actor === Actor.USER ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <span className="font-bold text-sm">{msg.actor === Actor.BOT ? 'SOP Bot' : 'You'}</span>
                                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                </div>
                                <div className={`mt-1 max-w-lg w-full ${msg.actor === Actor.USER ? 'text-right' : ''}`}>
                                    {msg.content && <div className={`px-4 py-2 rounded-lg inline-block ${msg.actor === Actor.BOT ? 'bg-gray-700' : 'bg-indigo-600'}`}>{msg.content}</div>}
                                    {msg.card && <CardRenderer card={msg.card} onAction={handleCardAction} messageId={msg.id} allConfigs={mockConfigs} allTemplates={mockTemplates} allBenchmarks={mockBenchmarkDatasets} />}
                                </div>
                            </div>
                             {msg.actor === Actor.USER && <UserIcon />}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <BotIcon />
                            <div className="flex flex-col items-start">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-sm">SOP Bot</span>
                                </div>
                                <div className="mt-2 flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="bg-gray-800 p-4 border-t border-gray-700 z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center bg-gray-700 rounded-lg p-2">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors" onClick={() => handleCardAction(ActionType.UPLOAD_FILE)}>
                            <PaperclipIcon />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent px-2 text-white placeholder-gray-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={isLoading || input.trim() === ''}
                            className="p-2 bg-indigo-600 rounded-md text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                        >
                            {isLoading ? <LoadingSpinner /> : <SendIcon />}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;