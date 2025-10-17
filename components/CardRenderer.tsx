import React, { useState, ChangeEvent, useRef, useMemo, useEffect } from 'react';
import { Card, CardType, ActionType, Configuration, BenchmarkDataset, ConfigTemplate } from '../types';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, LoadingSpinner, BookOpenIcon, HierarchyIcon, PaperclipIcon, FolderIcon, ExternalLinkIcon, LightBulbIcon, ClipboardListIcon, SearchIcon, DatabaseIcon, TemplateIcon, DuplicateIcon, CodeIcon, ThumbsUpIcon, ThumbsDownIcon, ImportIcon, AddDatabaseIcon, UploadIcon } from './Icons';
import { SopTimeline } from './SopTimeline';

interface CardRendererProps {
  card: Card;
  onAction: (action: ActionType, payload?: any) => void;
  messageId: number;
  allConfigs?: Configuration[];
  allTemplates?: ConfigTemplate[];
  allBenchmarks?: BenchmarkDataset[];
}

const CardButton: React.FC<{ onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean }> = ({ onClick, children, className = 'bg-teal-900 hover:bg-teal-800 text-white', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center justify-center ${className} ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
    >
        {children}
    </button>
);

const formatTitle = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

const EditableJsonTable: React.FC<{
    value: any[];
    onChange: (newValue: any[]) => void;
}> = ({ value, onChange }) => {
    // Determine headers from the first object, or handle empty array gracefully
    const headers = value && value.length > 0 ? Object.keys(value[0]) : [];

    const handleCellChange = (rowIndex: number, key: string, cellValue: string) => {
        const newValue = [...value];
        newValue[rowIndex] = { ...newValue[rowIndex], [key]: cellValue };
        onChange(newValue);
    };

    const handleAddRow = () => {
        // Create a new row with the same keys but empty values
        const newRow = headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {});
        onChange([...value, newRow]);
    };

    const handleDeleteRow = (rowIndex: number) => {
        const newValue = value.filter((_, index) => index !== rowIndex);
        onChange(newValue);
    };

    if (headers.length === 0) {
        return (
             <div>
                <p className="text-sm text-gray-500 mb-2">This setting is empty. Add the first item to define its structure.</p>
                <CardButton onClick={() => {
                    // Provide a default structure for the 'transformation' setting if it's empty
                    onChange([{ method: '', specFile: '', specDir: '' }]);
                }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs py-1 px-3">Add Item</CardButton>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-300">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-4 py-2 text-left text-sm font-semibold text-slate-800">
                                {formatTitle(header)}
                            </th>
                        ))}
                        <th scope="col" className="relative px-4 py-2 w-12">
                            <span className="sr-only">Delete</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {value.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map(header => (
                                <td key={`${rowIndex}-${header}`} className="px-2 py-1 whitespace-nowrap">
                                    <input
                                        type="text"
                                        value={row[header] || ''}
                                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 sm:text-sm"
                                    />
                                </td>
                            ))}
                            <td className="px-2 py-1 whitespace-nowrap text-center text-sm font-medium">
                                <button onClick={() => handleDeleteRow(rowIndex)} className="text-red-600 hover:text-red-500" title="Delete row">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-2 bg-gray-100 text-right">
                <CardButton onClick={handleAddRow} className="bg-teal-900 hover:bg-teal-800 text-white text-xs py-1 px-3">
                    Add Row
                </CardButton>
            </div>
        </div>
    );
};


const WelcomeCard: React.FC<{ onAction: CardRendererProps['onAction'] }> = ({ onAction }) => {
    const [showQuickActions, setShowQuickActions] = useState(false);

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Welcome to the FlowX SOP Bot!</h3>
            <p className="text-gray-600 mt-1">This self-service SOP bot helps you perform end-to-end validation, functional, regression, performance, and stress testing for your TDS automation workflows.</p>
            <div className="mt-4">
                 <CardButton onClick={() => onAction(ActionType.SHOW_SOP_CHOOSER)} className="w-full bg-teal-900 hover:bg-teal-800 text-white">
                    Start a Guided SOP
                </CardButton>
            </div>
            <details className="mt-3" onToggle={(e) => setShowQuickActions((e.target as HTMLDetailsElement).open)}>
                <summary className="text-sm font-medium text-gray-500 hover:text-gray-800 cursor-pointer">
                   {showQuickActions ? 'Hide' : 'Show'} Quick Actions
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <CardButton onClick={() => onAction(ActionType.START_CONFIG)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">New Config</CardButton>
                    <CardButton onClick={() => onAction(ActionType.START_TEST)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">Run Test</CardButton>
                    <CardButton onClick={() => onAction(ActionType.SHOW_BENCHMARK_WIZARD)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs col-span-2">Add Golden Benchmark</CardButton>
                </div>
            </details>
        </div>
    );
};

const SopChooserCard: React.FC<{ onAction: CardRendererProps['onAction'] }> = ({ onAction }) => {
    const sopCategories = [
        {
            persona: 'For Business Users',
            icon: <HierarchyIcon />,
            color: 'text-sky-600',
            sops: [
                { type: 'EXISTING_CONFIG_BATCH', title: 'End-to-End Business Validation', description: 'Validate a business process using an existing configuration and a large dataset.' },
            ]
        },
        {
            persona: 'For IT Developers',
            icon: <CodeIcon />,
            color: 'text-teal-600',
            sops: [
                { type: 'NEW_CONFIG_SINGLE', title: 'Unit & Functional Testing', description: 'Create a new config and run a quick test with a single file to validate logic.' },
                { type: 'EXISTING_CONFIG_SINGLE', title: 'Regression Testing', description: 'Select an existing config and run a quick test with a single file to verify changes.' },
            ]
        },
        {
            persona: 'For IT QC / QA',
            icon: <ClipboardListIcon />,
            color: 'text-teal-700',
            sops: [
                { type: 'NEW_CONFIG_BATCH', title: 'Full Regression & Performance Test', description: 'Run a comprehensive test on a configuration using a full benchmark dataset.' },
            ]
        }
    ];

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><BookOpenIcon /><span className="ml-2">Choose a Guided SOP</span></h3>
            <p className="text-gray-600 mt-1">Select a workflow based on your role and objective.</p>
            <div className="mt-4 space-y-5">
                {sopCategories.map(category => (
                    <div key={category.persona}>
                        <h4 className={`font-semibold flex items-center ${category.color}`}>
                            {React.cloneElement(category.icon, { className: `h-5 w-5 ${category.color}` })}
                            <span className="ml-2">{category.persona}</span>
                        </h4>
                        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                            {category.sops.map(sop => (
                                <button
                                    key={sop.type}
                                    onClick={() => onAction(ActionType.START_SOP, { sopType: sop.type, sopTitle: sop.title })}
                                    className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                                >
                                    <p className="font-semibold text-gray-800">{sop.title}</p>
                                    <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConfigCreatorChooserCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'] }> = ({ payload, onAction }) => (
    <div>
        <h3 className="font-bold text-lg text-gray-900">Create New Configuration</h3>
        <p className="text-gray-600 mt-1">How would you like to start?</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
            <button
                onClick={() => onAction(ActionType.START_FROM_TEMPLATE, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <TemplateIcon />
                    <p className="ml-2 font-semibold text-gray-800">Start from a Project Template</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Use a pre-defined schema for a specific project.</p>
            </button>
            <button
                onClick={() => onAction(ActionType.START_CLONE, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <DuplicateIcon />
                    <p className="ml-2 font-semibold text-gray-800">Clone an Existing Configuration</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Copy and modify an existing configuration.</p>
            </button>
            <button
                onClick={() => onAction(ActionType.SHOW_JSON_IMPORTER, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <ImportIcon />
                    <p className="ml-2 font-semibold text-gray-800">Import from JSON</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Create a config and template from raw JSON data.</p>
            </button>
        </div>
    </div>
);

const TemplateSelectorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], allTemplates: ConfigTemplate[], messageId: number }> = ({ payload, onAction, allTemplates, messageId }) => {
    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><TemplateIcon /><span className="ml-2">Select a Template</span></h3>
            <p className="text-gray-600 mt-1">Choose a template to base your new configuration on.</p>
            <div className="mt-4 space-y-3">
                {allTemplates.map(template => (
                     <button 
                        key={template.templateName}
                        onClick={() => onAction(ActionType.SELECT_TEMPLATE, { ...payload, messageId, selectedTemplate: template })}
                        className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                    >
                        <p className="font-semibold text-gray-800">{template.templateName}</p>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const ConfigSelectorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], allConfigs: Configuration[], messageId: number }> = ({ payload, onAction, allConfigs, messageId }) => {
    const [query, setQuery] = useState('');
    const action = payload.source === 'clone' ? ActionType.SELECT_CONFIG : ActionType.SELECT_CONFIG;
    
    const filteredConfigs = useMemo(() => {
        if (!query) return allConfigs;
        const lowerQuery = query.toLowerCase();
        return allConfigs.filter(c => 
            c.projectName.toLowerCase().includes(lowerQuery) ||
            c.vendorId?.toLowerCase().includes(lowerQuery)
        );
    }, [query, allConfigs]);

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center">
                {payload.source === 'clone' ? <DuplicateIcon /> : <ClipboardListIcon />}
                <span className="ml-2">{payload.source === 'clone' ? 'Select Configuration to Clone' : 'Select a Configuration'}</span>
            </h3>
            <div className="relative mt-3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Search by project or vendor..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
            </div>
            <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-2">
                {filteredConfigs.map(config => (
                    <button 
                        key={`${config.projectName}-${config.vendorId || 'project'}`}
                        onClick={() => onAction(action, { ...payload, messageId, selectedConfig: config })}
                        className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                    >
                        <div className="font-semibold text-gray-800">{config.projectName} <span className={`text-xs font-bold ${config.level === 'Project' ? 'text-teal-800' : 'text-green-700'}`}>({config.level})</span></div>
                        <div className="text-sm text-gray-500">{config.vendorId || 'Applies to all vendors'}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};


const ConfigWizardCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { step = 1, status, data = {} } = payload;
    const { level, template, clonedData } = data;
    const isComplete = status === 'complete';
    const isClone = !!clonedData;
    
    const schema = template?.settingsSchema || clonedData?.settings || {};
    const totalSteps = level === 'Vendor' ? 4 : 3;

    // State for form inputs, initialized from payload
    const [projectName, setProjectName] = useState(data.projectName || '');
    const [vendorId, setVendorId] = useState(data.vendorId || '');
    const [settings, setSettings] = useState(data.settings || {});

    // Pre-fill from template or clone
    useEffect(() => {
        if (template && !data.projectName) {
            setProjectName(template.projectName);
            const initialSettings = { ...(template.defaultValues || {}) };
            setSettings(initialSettings);
        }
        if (clonedData && !data.projectName) {
            setProjectName(clonedData.projectName);
            setVendorId(clonedData.vendorId || '');
            setSettings(clonedData.settings || {});
        }
    }, [template, clonedData, data.projectName]);

    const handleSettingsChange = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };
    
    const handleNext = () => {
        const basePayload = { messageId, data: { ...data, settings } };
        if (step === 2) { // Submitting project name
            onAction(ActionType.SUBMIT_CONFIG_STEP, { ...basePayload, step: 2, data: { ...basePayload.data, projectName } });
        } else if (step === 3) { // Submitting vendor ID
            onAction(ActionType.SUBMIT_CONFIG_STEP, { ...basePayload, step: 3, data: { ...basePayload.data, vendorId } });
        } else if (step === totalSteps) { // Submitting settings
             onAction(ActionType.SUBMIT_CONFIG_STEP, { ...basePayload, step: totalSteps, data: { ...basePayload.data, settings } });
        }
    }
    
    const finalStep = (step === 4 || (step === 3 && level==='Project'));
    const allSettingsFilled = finalStep ? Object.keys(schema).every(key => settings[key] !== undefined && settings[key] !== '') : false;

    // Separate schema fields into simple (for the grid) and complex (for full-width display)
    const [simpleFields, complexFields] = useMemo(() => {
        const simple: [string, any][] = [];
        const complex: [string, any][] = [];
        Object.entries(schema).forEach(([key, type]) => {
            if (type === 'json') {
                complex.push([key, type]);
            } else {
                simple.push([key, type]);
            }
        });
        return [simple, complex];
    }, [schema]);


    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Configuration Wizard {isComplete ? '(Completed)' : level ? `(${isClone ? 'Clone' : 'New'} - Step ${step-1}/${totalSteps})` : ''}</h3>
            {step === 1 && (
                <div className="mt-2">
                    <p className="text-sm text-gray-700">What level of configuration do you want to create?</p>
                    <div className="flex space-x-2 mt-3">
                         <CardButton onClick={() => onAction(ActionType.SUBMIT_CONFIG_STEP, { messageId, step: 1, data: { ...data, level: 'Project' } })}>
                            Project Level
                        </CardButton>
                        <CardButton onClick={() => onAction(ActionType.SUBMIT_CONFIG_STEP, { messageId, step: 1, data: { ...data, level: 'Vendor' } })}>
                            Vendor Specific
                        </CardButton>
                    </div>
                </div>
            )}
            {step >= 2 && <p className="text-sm text-gray-500 mb-2">Level: <span className="font-semibold text-teal-800">{level}</span></p>}
            
            {step === 2 && (
                <div className="mt-2">
                    <label htmlFor={`project-name-${messageId}`} className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input type="text" id={`project-name-${messageId}`} value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm" placeholder="e.g., Auto-billing" readOnly={isClone}/>
                </div>
            )}
             {step === 3 && level === 'Vendor' && (
                <div className="mt-2">
                    <p className="text-gray-700 mb-2">Project: <span className="font-semibold text-gray-800">{data.projectName}</span></p>
                    <label htmlFor={`vendor-id-${messageId}`} className="block text-sm font-medium text-gray-700">Vendor ID</label>
                    <input type="text" id={`vendor-id-${messageId}`} value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm" placeholder="e.g., VEN-12345"/>
                </div>
            )}
            {finalStep && (
                 <div className="mt-2 space-y-4">
                     <p className="text-gray-700 mb-2">Project: <span className="font-semibold text-gray-800">{data.projectName}</span></p>
                    
                    {/* Render simple fields in a grid */}
                    {simpleFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                            {simpleFields.map(([key, type]) => {
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                const id = `${key}-${messageId}`;
                                if (type === 'boolean') {
                                    return (
                                        <div key={id} className="relative flex items-center col-span-1 py-2">
                                            <div className="flex items-center h-5">
                                                <input id={id} type="checkbox" checked={!!settings[key]} onChange={(e) => handleSettingsChange(key, e.target.checked)} className="focus:ring-teal-600 h-4 w-4 text-teal-900 border-gray-300 rounded" />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor={id} className="font-medium text-gray-700">{label}</label>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={id} className="col-span-1">
                                        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
                                        <input 
                                            type={type === 'number' ? 'number' : 'text'} 
                                            id={id} 
                                            value={settings[key] || ''} 
                                            onChange={(e) => handleSettingsChange(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)} 
                                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm" 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                     )}
                     
                     {/* Render complex fields below the grid */}
                     {complexFields.length > 0 && (
                        <div className="space-y-4">
                            {complexFields.map(([key, type]) => {
                                const label = formatTitle(key);
                                const id = `${key}-${messageId}`;
                                const value = settings[key] || [];
                                 if (type === 'json' && Array.isArray(value)) {
                                    return (
                                        <div key={id}>
                                            <label className="block text-sm font-medium text-gray-700">{label}</label>
                                            <div className="mt-1">
                                                <EditableJsonTable 
                                                    value={value} 
                                                    onChange={(newValue) => handleSettingsChange(key, newValue)} 
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                                // Fallback for non-array JSON - though not used in current templates
                                return (
                                    <div key={id}>
                                        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
                                        <textarea 
                                            id={id}
                                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                                            onChange={(e) => handleSettingsChange(key, e.target.value)}
                                            rows={5}
                                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 font-mono text-xs focus:outline-none focus:ring-teal-600 focus:border-teal-600"
                                            placeholder={`Enter a valid JSON for ${label}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                     )}
                 </div>
            )}

            {step > 1 && (
                <div className="flex justify-end mt-4">
                     <CardButton onClick={handleNext} disabled={isComplete || (step === 2 && !projectName) || (step === 3 && level === 'Vendor' && !vendorId) || (finalStep && !allSettingsFilled)}>
                        {isComplete ? 'Submitted' : finalStep ? 'Submit' : 'Next'}
                    </CardButton>
                </div>
            )}
        </div>
    );
};


const ConfigDetailsCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState<Configuration>(payload);

    const [simpleEditFields, complexEditFields] = useMemo(() => {
        const simple: string[] = [];
        const complex: string[] = [];
        if (editState.settings) {
            Object.entries(editState.settings).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    complex.push(key);
                } else {
                    simple.push(key);
                }
            });
        }
        return [simple, complex];
    }, [editState.settings]);

    const handleEditClick = () => {
        const stateForEditing = JSON.parse(JSON.stringify(payload)); // Deep clone
        setEditState(stateForEditing);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditState(payload); // Revert changes
    };

    const handleSave = () => {
        onAction(ActionType.UPDATE_CONFIG, {
            messageId,
            originalConfig: payload,
            updatedConfig: { ...editState, lastModified: new Date().toISOString().split('T')[0] },
        });
        setIsEditing(false);
    };

    const handleFieldChange = (key: keyof Configuration, value: any) => {
        setEditState(prev => ({ ...prev, [key]: value }));
    };

    const handleSettingsChange = (key: string, value: any) => {
        setEditState(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [key]: value,
            },
        }));
    };

    if (isEditing) {
        const settings = editState.settings || {};
        const commonInputClass = "mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm";
        return (
            <div>
                <h3 className="font-bold text-lg text-gray-900 mb-3">Editing Configuration</h3>
                <div className="space-y-4">
                    {/* Core fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                         <div>
                            <label htmlFor={`project-name-${messageId}-edit`} className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input type="text" id={`project-name-${messageId}-edit`} value={editState.projectName} onChange={(e) => handleFieldChange('projectName', e.target.value)} className={commonInputClass} />
                        </div>
                         <div>
                            <label htmlFor={`vendor-id-${messageId}-edit`} className="block text-sm font-medium text-gray-700">Vendor ID (Optional)</label>
                            <input type="text" id={`vendor-id-${messageId}-edit`} value={editState.vendorId || ''} onChange={(e) => handleFieldChange('vendorId', e.target.value || undefined)} className={commonInputClass} />
                        </div>
                        <div>
                            <label htmlFor={`level-${messageId}-edit`} className="block text-sm font-medium text-gray-700">Level</label>
                            <select id={`level-${messageId}-edit`} value={editState.level} onChange={(e) => handleFieldChange('level', e.target.value as Configuration['level'])} className={commonInputClass}>
                                <option value="Project">Project</option>
                                <option value="Vendor">Vendor</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor={`status-${messageId}-edit`} className="block text-sm font-medium text-gray-700">Status</label>
                             <select id={`status-${messageId}-edit`} value={editState.status} onChange={(e) => handleFieldChange('status', e.target.value as Configuration['status'])} className={commonInputClass}>
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                            </select>
                        </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-700 mb-2 pt-2">Settings</h4>
                    {/* Simple fields grid */}
                    {simpleEditFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                            {simpleEditFields.map(key => {
                                const id = `${key}-${messageId}-edit`;
                                const originalValueType = typeof payload.settings[key];
                                if (originalValueType === 'boolean') {
                                    return (
                                        <div key={id} className="relative flex items-center col-span-1 py-2">
                                            <div className="flex items-center h-5">
                                                <input id={id} type="checkbox" checked={!!settings[key]} onChange={(e) => handleSettingsChange(key, e.target.checked)} className="focus:ring-teal-600 h-4 w-4 text-teal-900 border-gray-300 rounded" />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor={id} className="font-medium text-gray-700">{formatTitle(key)}</label>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={id} className="col-span-1">
                                        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{formatTitle(key)}</label>
                                        <input type={originalValueType === 'number' ? 'number' : 'text'} id={id} value={settings[key] || ''} onChange={(e) => handleSettingsChange(key, originalValueType === 'number' ? parseFloat(e.target.value) : e.target.value)} className={commonInputClass} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Complex fields */}
                     {complexEditFields.map(key => {
                        const id = `${key}-${messageId}-edit`;
                        const value = settings[key] || [];
                        if (Array.isArray(value)) {
                             return (
                                <div key={id}>
                                    <label className="block text-sm font-medium text-gray-700">{formatTitle(key)}</label>
                                    <div className="mt-1">
                                        <EditableJsonTable 
                                            value={value} 
                                            onChange={(newValue) => handleSettingsChange(key, newValue)} 
                                        />
                                    </div>
                                </div>
                            );
                        }
                        // Fallback for non-array JSON
                        return (
                            <div key={id}>
                                <label htmlFor={id} className="block text-sm font-medium text-gray-700">{formatTitle(key)}</label>
                                <textarea id={id} value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''} onChange={(e) => handleSettingsChange(key, e.target.value)} rows={5} className={commonInputClass} />
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <CardButton onClick={handleCancel} className="bg-transparent hover:bg-gray-100 text-teal-900 font-semibold">Cancel</CardButton>
                    <CardButton onClick={handleSave}>Save Changes</CardButton>
                </div>
            </div>
        );
    }

    // Display Mode
    const { settings = {} } = payload;
    const simpleSettings = Object.entries(settings).filter(([, value]) => typeof value !== 'object' || value === null);
    const complexSettings = Object.entries(settings).filter(([, value]) => typeof value === 'object' && value !== null);
    
    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3">Configuration Details</h3>
            
            <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50 divide-y divide-gray-200">
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Project Name</p>
                    <p className="text-sm text-gray-800 font-semibold">{payload.projectName}</p>
                </div>
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Vendor ID</p>
                    <p className="text-sm text-gray-800">{payload.vendorId || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Level</p>
                    <p className={`text-sm font-semibold ${payload.level === 'Project' ? 'text-teal-800' : 'text-green-700'}`}>{payload.level}</p>
                </div>
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm text-gray-800">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payload.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {payload.status}
                        </span>
                    </p>
                </div>
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Last Modified</p>
                    <p className="text-sm text-gray-800">{payload.lastModified} by {payload.createdBy}</p>
                </div>
            </div>

            {simpleSettings.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        {simpleSettings.map(([key, value]) => (
                            <div key={key}>
                                <p className="text-sm font-medium text-gray-500">{formatTitle(key)}</p>
                                <p className="text-sm text-gray-800 font-mono break-all">
                                    {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {complexSettings.map(([key, value]) => (
                <div key={key} className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{formatTitle(key)}</h4>
                    {Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-300">
                                    <tr>
                                        {Object.keys(value[0]).map(header => (
                                            <th key={header} scope="col" className="px-4 py-2 text-left text-sm font-semibold text-slate-800">
                                                {formatTitle(header)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-stone-100 divide-y divide-gray-300">
                                    {value.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {Object.values(row).map((cell: any, cellIndex) => (
                                                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-mono">
                                                    {String(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                            <pre className="p-2 bg-gray-100 rounded-md text-xs text-gray-600 overflow-x-auto">
                                <code>{JSON.stringify(value, null, 2)}</code>
                            </pre>
                        </div>
                    )}
                </div>
            ))}
            <div className="flex justify-end mt-4">
                <CardButton onClick={handleEditClick} className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm">
                    Edit Configuration
                </CardButton>
            </div>
        </div>
    );
};

const TestStarterCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number, allBenchmarks: BenchmarkDataset[] }> = ({ payload, onAction, messageId, allBenchmarks }) => {
    const [path, setPath] = useState('ftp://data.example.com/incoming/batch_001/');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const relevantBenchmarks = useMemo(() => {
        if (!payload.config || !allBenchmarks) return [];
        return allBenchmarks.filter(b => b.projectName === payload.config.projectName);
    }, [allBenchmarks, payload.config]);

    const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | undefined>(
        relevantBenchmarks.length > 0 ? relevantBenchmarks[0].id : undefined
    );

    useEffect(() => {
        if (relevantBenchmarks.length > 0 && !selectedBenchmarkId) {
            setSelectedBenchmarkId(relevantBenchmarks[0].id);
        }
    }, [relevantBenchmarks, selectedBenchmarkId]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            onAction(ActionType.RUN_TEST_WITH_FILE, { messageId, file, sopContext: payload.sopContext, benchmarkId: selectedBenchmarkId, config: payload.config });
        }
    };
    
    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Start a New Test</h3>
            {payload.config && <p className="text-sm text-gray-500 -mt-1 mb-2">For Configuration: <span className="font-semibold text-teal-800">{payload.config.projectName} {payload.config.vendorId || ''}</span></p>}
            
            {payload.config && (
                <div className="mt-4">
                    <label htmlFor={`benchmark-selector-${messageId}`} className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                        <DatabaseIcon /><span className="ml-2">Target Benchmark Dataset</span>
                    </label>
                    {relevantBenchmarks.length > 0 ? (
                        <select
                            id={`benchmark-selector-${messageId}`}
                            value={selectedBenchmarkId || ''}
                            onChange={(e) => setSelectedBenchmarkId(e.target.value)}
                            className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        >
                            {relevantBenchmarks.map(b => <option key={b.id} value={b.id}>{b.id} ({b.description.substring(0, 30)}...)</option>)}
                        </select>
                    ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md text-center">
                            <p className="text-sm text-yellow-700">No Golden Benchmarks found for project '{payload.config.projectName}'.</p>
                            <p className="text-xs text-yellow-600 mt-1">A benchmark is required to run a test.</p>
                            <CardButton 
                                onClick={() => onAction(ActionType.SHOW_BENCHMARK_WIZARD, { projectName: payload.config.projectName })}
                                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 mt-2 text-xs py-1 px-3"
                            >
                                Add Benchmark
                            </CardButton>
                        </div>
                    )}
                </div>
            )}
            
            <p className="text-gray-600 mt-4">Choose how you want to provide data for this test run.</p>
            
            <div className="mt-4 space-y-4">
                {/* Batch Test */}
                <div className="p-3 border border-gray-200 rounded-lg">
                    <label htmlFor={`batch-path-${messageId}`} className="block text-sm font-medium text-gray-700 flex items-center"><FolderIcon /><span className="ml-2">Run Batch Test</span></label>
                    <p className="text-xs text-gray-500 mt-1">Specify the FTP, SFTP, or local path for batch data processing.</p>
                    <input type="text" id={`batch-path-${messageId}`} value={path} onChange={(e) => setPath(e.target.value)} className="mt-2 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm" />
                    <div className="flex justify-end mt-2">
                        <CardButton onClick={() => onAction(ActionType.START_BATCH_TEST, { path, sopContext: payload.sopContext, messageId, benchmarkId: selectedBenchmarkId, config: payload.config })} disabled={!path || !selectedBenchmarkId}>
                            Start Batch Test
                        </CardButton>
                    </div>
                </div>

                {/* Single File Test */}
                <div className="p-3 border border-gray-200 rounded-lg">
                     <h4 className="text-sm font-medium text-gray-700 flex items-center"><PaperclipIcon /><span className="ml-2">Run with Single File</span></h4>
                     <p className="text-xs text-gray-500 mt-1">Upload a single file for immediate testing.</p>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.eml" />
                     <div className="flex justify-end mt-2">
                        <CardButton onClick={() => fileInputRef.current?.click()} disabled={!selectedBenchmarkId}>
                           Upload and Run
                        </CardButton>
                     </div>
                </div>
            </div>
        </div>
    );
};

const TestResultsSummaryCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => (
    <div>
        <h3 className="font-bold text-lg text-gray-900">Test Results: {payload.project}</h3>

        {payload.benchmarkId && (
            <div className="mt-3 p-2 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500">Verified Against Benchmark</p>
                    <p className="font-semibold text-teal-600">{payload.benchmarkId}</p>
                </div>
                <button 
                    onClick={() => onAction(ActionType.VIEW_BENCHMARK_DETAILS, { benchmarkId: payload.benchmarkId })}
                    className="text-sm text-teal-800 hover:text-teal-700 font-medium flex items-center"
                >
                    View Details <ExternalLinkIcon />
                </button>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">{payload.matched}</p>
                <p className="text-sm text-gray-600">Matched</p>
            </div>
             <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-600">{payload.mismatched}</p>
                <p className="text-sm text-gray-600">Mismatched</p>
            </div>
        </div>
        <div className="flex space-x-2 mt-4">
            <CardButton onClick={() => onAction(ActionType.DOWNLOAD_REPORT)} className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm">Download Report</CardButton>
            <CardButton onClick={() => onAction(ActionType.TRIGGER_ANALYSIS, { testId: payload.testId, sopContext: payload.sopContext, messageId })}>Analyze Discrepancies</CardButton>
        </div>
    </div>
);

const AnalysisResultsCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [feedbackGiven, setFeedbackGiven] = useState(payload.feedbackGiven || false);

    const handleFeedback = (isGood: boolean) => {
        setFeedbackGiven(true); // Optimistic UI update
        onAction(ActionType.ANALYSIS_FEEDBACK, { messageId, isGood });
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Discrepancy Analysis</h3>
            <ul className="mt-2 space-y-2">
                <li className="flex items-center space-x-2 p-2 bg-gray-100/50 rounded-md">
                    <XCircleIcon />
                    <span className="text-gray-700 flex-grow">Data Quality Issues</span>
                    <span className="font-semibold text-gray-800">{payload.dataQuality}</span>
                </li>
                <li className="flex items-center space-x-2 p-2 bg-gray-100/50 rounded-md">
                    <ExclamationCircleIcon />
                    <span className="text-gray-700 flex-grow">Configuration/Logic Problems</span>
                    <span className="font-semibold text-gray-800">{payload.logic}</span>
                </li>
            </ul>
            <div className="flex space-x-2 mt-4">
                <CardButton onClick={() => onAction(ActionType.VIEW_METABASE_REPORT)} className="bg-slate-600 hover:bg-slate-700 text-white">View on Metabase <ExternalLinkIcon /></CardButton>
                <CardButton onClick={() => onAction(ActionType.INVESTIGATE_ROOT_CAUSE, { testId: payload.testId, sopContext: payload.sopContext, messageId })}>Find Root Cause & Suggestions</CardButton>
            </div>
            {/* Feedback Section */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end items-center space-x-3">
                {feedbackGiven ? (
                     <p className="text-xs text-gray-500 italic">Thank you for your feedback!</p>
                ) : (
                    <>
                        <span className="text-sm text-gray-500">Was this analysis helpful?</span>
                        <button onClick={() => handleFeedback(true)} className="text-gray-400 hover:text-green-500 transition-colors" aria-label="Good analysis">
                            <ThumbsUpIcon />
                        </button>
                        <button onClick={() => handleFeedback(false)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Bad analysis">
                            <ThumbsDownIcon />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const RootCauseAnalysisCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [feedbackGiven, setFeedbackGiven] = useState(payload.feedbackGiven || false);

    const handleFeedback = (isGood: boolean) => {
        setFeedbackGiven(true); // Optimistic UI update
        onAction(ActionType.ROOT_CAUSE_FEEDBACK, { messageId, isGood });
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><LightBulbIcon /><span className="ml-2">Root Cause Analysis</span></h3>
            <div className="mt-3 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold text-yellow-600">Probable Cause: </span>
                    {payload.cause}
                </p>
            </div>
            <div className="mt-4">
                <h4 className="font-semibold text-gray-800">Suggested Actions</h4>
                <div className="mt-2 space-y-2">
                    {payload.suggestedActions.map((action: {title: string, action: string}) => (
                        <CardButton key={action.action} onClick={() => onAction(ActionType.SUGGESTED_ACTION, { action: action.action, title: action.title })} className="w-full bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm justify-start">
                            {action.title}
                        </CardButton>
                    ))}
                </div>
            </div>
            {/* Feedback Section */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end items-center space-x-3">
                {feedbackGiven ? (
                     <p className="text-xs text-gray-500 italic">Thank you for your feedback!</p>
                ) : (
                    <>
                        <span className="text-sm text-gray-500">Was this helpful?</span>
                        <button onClick={() => handleFeedback(true)} className="text-gray-400 hover:text-green-500 transition-colors" aria-label="Good analysis">
                            <ThumbsUpIcon />
                        </button>
                        <button onClick={() => handleFeedback(false)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Bad analysis">
                            <ThumbsDownIcon />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};


const InteractiveDiagnosticCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => (
     <div>
        <h3 className="font-bold text-lg text-gray-900">Interactive Diagnostic: {payload.recordId}</h3>
        <div className="mt-2 p-3 bg-gray-100 rounded-md font-mono text-xs text-gray-600 overflow-x-auto">
            <pre>{JSON.stringify(payload.data, null, 2)}</pre>
        </div>
        {payload.status === 'resolved' ? (
             <div className="mt-4 flex items-center space-x-2 text-green-600">
                <CheckCircleIcon />
                <span>Rerun successful: Record now matches.</span>
            </div>
        ) : payload.status === 'running' ? (
             <div className="mt-4 flex items-center space-x-2 text-teal-800">
                <LoadingSpinner />
                <span>Rerunning with new parameters...</span>
            </div>
        ) : (
            <div className="flex space-x-2 mt-4">
                <CardButton onClick={() => onAction(ActionType.RERUN_DIAGNOSTIC, { messageId, ruleToDisable: 'RULE-005', sopContext: payload.sopContext })}>Rerun (Disable RULE-005)</CardButton>
            </div>
        )}
    </div>
);

const ConfirmationCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => (
    <div>
        <h3 className="font-bold text-lg text-yellow-600 flex items-center"><ExclamationCircleIcon /> <span className="ml-2">Confirm Action</span></h3>
        <p className="text-gray-700 mt-2">
            You are about to <span className="font-bold text-red-600">{payload.action}</span> for project <span className="font-bold text-gray-800">{payload.project}</span>.
            This is a production environment. Are you sure you want to proceed?
        </p>
        <div className="flex justify-end space-x-2 mt-4">
            <CardButton onClick={() => onAction(ActionType.CANCEL_ACTION, { messageId })} className="bg-transparent hover:bg-gray-100 text-teal-900 font-semibold">Cancel</CardButton>
            <CardButton onClick={() => onAction(ActionType.CONFIRM_PAUSE_PRODUCTION, { messageId, project: payload.project })} className="bg-red-600 hover:bg-red-700 text-white">Confirm {payload.action}</CardButton>
        </div>
    </div>
);

const AlertCard: React.FC<{ payload: any }> = ({ payload }) => (
    <div>
        <h3 className="font-bold text-lg text-red-600 flex items-center"><ExclamationCircleIcon /> <span className="ml-2">Production Alert</span></h3>
        <p className="text-gray-700 mt-2">{payload.message}</p>
        <div className="mt-2 p-3 bg-gray-100 rounded-md font-mono text-xs text-gray-600">
            Project: {payload.project}<br/>
            Severity: {payload.severity}
        </div>
    </div>
);

const FileUploadCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            onAction(ActionType.UPLOAD_FILE, { messageId, file, sopContext: payload.sopContext });
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Upload File</h3>
            {payload.status === 'idle' && (
                <>
                    <p className="text-gray-600 mt-1">Please upload the data file for processing.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".xlsx,.xls,.csv,.pdf,.eml"
                    />
                    <div className="mt-4">
                        <CardButton onClick={handleClick}>Select File</CardButton>
                    </div>
                </>
            )}
             {payload.status === 'uploading' && (
                <div className="mt-4 flex items-center space-x-2 text-teal-800">
                    <LoadingSpinner />
                    <span>Uploading {payload.fileName}...</span>
                </div>
            )}
            {payload.status === 'processing' && (
                <div className="mt-4 flex items-center space-x-2 text-teal-800">
                    <LoadingSpinner />
                    <span>Processing file...</span>
                </div>
            )}
            {payload.status === 'complete' && (
                <div className="mt-4 flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon />
                    <span>{payload.result}</span>
                </div>
            )}
        </div>
    );
};

const BenchmarkListCard: React.FC<{ payload: BenchmarkDataset, onAction: CardRendererProps['onAction'] }> = ({ payload, onAction }) => {
    const [vendorQuery, setVendorQuery] = useState('');
    const [checkResult, setCheckResult] = useState<{ covered: boolean; vendorId: string } | null>(null);

    const handleCheck = () => {
        if (!vendorQuery) return;
        const isCovered = payload.coveredVendors.some(v => v.toLowerCase() === vendorQuery.toLowerCase());
        setCheckResult({ covered: isCovered, vendorId: vendorQuery });
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><DatabaseIcon /><span className="ml-2">Golden Benchmark: {payload.projectName}</span></h3>
            <p className="text-sm text-gray-500 mt-1 italic">{payload.description}</p>
            
            <div className="mt-3 space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50 divide-y divide-gray-200">
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Data Volume</p>
                    <p className="text-sm text-gray-800 font-semibold">{payload.dataVolume.toLocaleString()} Records</p>
                </div>
                 <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Vendor Coverage</p>
                    <p className="text-sm text-gray-800 font-semibold">{payload.vendorCount} Vendors</p>
                </div>
                <div className="flex justify-between items-center py-1">
                    <p className="text-sm font-medium text-gray-500">Timeliness</p>
                    <p className="text-sm text-gray-800 font-semibold">{payload.timeliness}</p>
                </div>
            </div>

            <div className="mt-3">
                 <CardButton onClick={() => onAction(ActionType.VIEW_BENCHMARK_ON_METABASE, { benchmarkId: payload.id })} className="w-full bg-teal-700 hover:bg-teal-800 text-white">
                    View Full Dashboard on Metabase <ExternalLinkIcon />
                </CardButton>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Check Vendor Coverage</h4>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Enter Vendor ID..."
                        value={vendorQuery}
                        onChange={(e) => setVendorQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
                        className="flex-grow bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-600 sm:text-sm"
                    />
                    <CardButton onClick={handleCheck} className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm" disabled={!vendorQuery}>
                        Check
                    </CardButton>
                </div>
                {checkResult && (
                    <div className="mt-2 text-sm flex items-center">
                        {checkResult.covered ? (
                            <>
                                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-green-700">Vendor <span className="font-bold">{checkResult.vendorId}</span> is covered.</span>
                            </>
                        ) : (
                             <>
                                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-red-700">Vendor <span className="font-bold">{checkResult.vendorId}</span> is not covered.</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const JsonImporterCard: React.FC<{ onAction: CardRendererProps['onAction'], messageId: number }> = ({ onAction, messageId }) => {
    const [jsonString, setJsonString] = useState('');
    const [error, setError] = useState('');

    const handleImport = () => {
        if (!jsonString.trim()) {
            setError('JSON input cannot be empty.');
            return;
        }
        try {
            // Sanitize input: attempt to remove common errors like trailing commas
            const sanitizedJsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
            
            JSON.parse(sanitizedJsonString); // Validate the sanitized string
            setError('');
            // Pass the sanitized (and now validated) string to the action handler
            onAction(ActionType.IMPORT_JSON_CONFIG, { messageId, jsonString: sanitizedJsonString });
        } catch (e) {
            setError('Invalid JSON format. Please check for syntax errors.');
        }
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><ImportIcon /><span className="ml-2">Import Configuration from JSON</span></h3>
            <p className="text-gray-600 mt-1">Paste your raw JSON configuration below. The tool will convert it into a bot-managed configuration and auto-generate a corresponding template.</p>
            <div className="mt-4">
                <textarea
                    value={jsonString}
                    onChange={(e) => setJsonString(e.target.value)}
                    placeholder='{ "yourKey": "yourValue", ... }'
                    rows={10}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 font-mono text-sm focus:outline-none focus:ring-teal-600 focus:border-teal-600"
                />
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
            <div className="flex justify-end mt-3">
                <CardButton onClick={handleImport}>Import and Generate</CardButton>
            </div>
        </div>
    );
};

const TemplateEditorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [template, setTemplate] = useState(payload.template);
    const [isSaved, setIsSaved] = useState(payload.isSaved || false);

    const handleSave = () => {
        onAction(ActionType.SAVE_GENERATED_TEMPLATE, { messageId, template });
        setIsSaved(true);
    };
    
    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><TemplateIcon /><span className="ml-2">Generated Template Editor</span></h3>
            <p className="text-gray-600 mt-1">A template has been generated from your JSON. Review and save it to the library.</p>
            
            <div className="mt-4 space-y-3">
                <div>
                    <label htmlFor={`template-name-${messageId}`} className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input 
                        type="text" 
                        id={`template-name-${messageId}`} 
                        value={template.templateName} 
                        onChange={(e) => setTemplate({ ...template, templateName: e.target.value })}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 sm:text-sm" 
                        disabled={isSaved}
                    />
                </div>
                <div>
                    <label htmlFor={`template-desc-${messageId}`} className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea 
                        id={`template-desc-${messageId}`} 
                        value={template.description} 
                        onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        rows={2}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 sm:text-sm" 
                        disabled={isSaved}
                    />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700">Inferred Schema</h4>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono text-gray-500 space-y-1">
                        {Object.entries(template.settingsSchema).map(([key, value]) => (
                            <div key={key}><span className="text-sky-600">{key}</span>: <span className="text-yellow-600">{`"${value}"`}</span></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                {isSaved ? (
                     <div className="flex items-center space-x-2 text-green-600 font-semibold">
                        <CheckCircleIcon />
                        <span>Template Saved!</span>
                     </div>
                ) : (
                    <CardButton onClick={handleSave} disabled={!template.templateName || !template.description}>
                        Save Template
                    </CardButton>
                )}
            </div>
        </div>
    );
};

const BenchmarkWizardCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number, allConfigs?: Configuration[] }> = ({ payload, onAction, messageId, allConfigs = [] }) => {
    const [benchmark, setBenchmark] = useState<Partial<BenchmarkDataset>>({});
    const [vendors, setVendors] = useState('');
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(payload?.isSaved || false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // This effect ensures the component's state is synchronized with the payload from App.tsx
    // This is important for when the card is re-rendered after a save action.
    useEffect(() => {
        setIsSaved(payload?.isSaved || false);
        setBenchmark(payload?.benchmark || {
            projectName: payload?.projectName || '',
            timeliness: 'Last 3 Months',
        });
        setVendors((payload?.benchmark?.coveredVendors || []).join(', '));
    }, [payload]);

    const projectNames = useMemo(() => {
        const uniqueNames = new Set(allConfigs.map(c => c.projectName));
        return Array.from(uniqueNames).sort();
    }, [allConfigs]);

    // Effect to set a default project name if the list is available and none is set
    useEffect(() => {
        if (!benchmark.projectName && projectNames.length > 0) {
            setBenchmark(prev => ({ ...prev, projectName: projectNames[0] }));
        }
    }, [projectNames, benchmark.projectName]);


    const handleChange = (field: keyof BenchmarkDataset, value: any) => {
        setBenchmark(prev => ({ ...prev, [field]: value }));
    };

    const handleVendorFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                // Handle CSV (comma-separated) and TXT (newline-separated)
                const vendorsArray = text
                    .replace(/\r\n/g, '\n') // Standardize newlines
                    .split(/[\n,]+/)        // Split by newline or comma
                    .map(v => v.trim())
                    .filter(Boolean);      // Remove empty strings
                setVendors(vendorsArray.join(', '));
            }
        };
        reader.readAsText(file);

        // Allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleSave = () => {
        if (!benchmark.id || !benchmark.projectName || !benchmark.description) {
            setError('ID, Project Name, and Description are required.');
            return;
        }
        setError('');
        const coveredVendors = vendors.split(',').map(v => v.trim()).filter(Boolean);
        const finalBenchmark: BenchmarkDataset = {
            id: benchmark.id,
            projectName: benchmark.projectName,
            description: benchmark.description,
            dataVolume: Number(benchmark.dataVolume) || 0,
            timeliness: benchmark.timeliness || 'Last 3 Months',
            vendorCount: coveredVendors.length,
            coveredVendors,
        };
        onAction(ActionType.SUBMIT_BENCHMARK_WIZARD, { messageId, benchmark: finalBenchmark });
    };

    const handleEdit = () => {
        setIsSaved(false);
    };
    
    const commonInputClass = "mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm";
    const disabledClass = isSaved ? "disabled:bg-gray-100/50 disabled:cursor-not-allowed disabled:text-gray-500" : "";

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><AddDatabaseIcon /><span className="ml-2">Add Golden Benchmark</span></h3>
            <p className="text-gray-600 mt-1">Define a new benchmark dataset for testing and validation.</p>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={`bm-id-${messageId}`} className="block text-sm font-medium text-gray-700">Benchmark ID</label>
                        <input type="text" id={`bm-id-${messageId}`} value={benchmark.id || ''} onChange={e => handleChange('id', e.target.value)} className={`${commonInputClass} ${disabledClass}`} placeholder="e.g., BM-AV-02" disabled={isSaved} />
                    </div>
                    <div>
                        <label htmlFor={`bm-project-${messageId}`} className="block text-sm font-medium text-gray-700">Project Name</label>
                         <select
                            id={`bm-project-${messageId}`}
                            value={benchmark.projectName || ''}
                            onChange={e => handleChange('projectName', e.target.value)}
                            className={`${commonInputClass} ${disabledClass}`}
                            disabled={isSaved}
                        >
                            <option value="" disabled>Select a project</option>
                            {projectNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor={`bm-desc-${messageId}`} className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id={`bm-desc-${messageId}`} value={benchmark.description || ''} onChange={e => handleChange('description', e.target.value)} rows={2} className={`${commonInputClass} ${disabledClass}`} disabled={isSaved}></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={`bm-volume-${messageId}`} className="block text-sm font-medium text-gray-700">Data Volume (Records)</label>
                        <input type="number" id={`bm-volume-${messageId}`} value={benchmark.dataVolume || ''} onChange={e => handleChange('dataVolume', e.target.value)} className={`${commonInputClass} ${disabledClass}`} placeholder="e.g., 50000" disabled={isSaved} />
                    </div>
                     <div>
                        <label htmlFor={`bm-time-${messageId}`} className="block text-sm font-medium text-gray-700">Timeliness</label>
                        <select id={`bm-time-${messageId}`} value={benchmark.timeliness || 'Last 3 Months'} onChange={e => handleChange('timeliness', e.target.value as BenchmarkDataset['timeliness'])} className={`${commonInputClass} ${disabledClass}`} disabled={isSaved}>
                            <option>Last 1 Month</option>
                            <option>Last 3 Months</option>
                            <option>Last 6 Months</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor={`bm-vendors-${messageId}`} className="block text-sm font-medium text-gray-700">Covered Vendors</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center text-xs text-teal-800 hover:text-teal-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={isSaved}
                        >
                            <UploadIcon />
                            <span className="ml-1">Upload List (.csv, .txt)</span>
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleVendorFileUpload} className="hidden" accept=".csv,.txt" disabled={isSaved} />
                    <textarea id={`bm-vendors-${messageId}`} value={vendors} onChange={e => setVendors(e.target.value)} rows={3} className={`${commonInputClass} ${disabledClass}`} placeholder="Enter comma-separated vendor IDs or upload a file..." disabled={isSaved}></textarea>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
             <div className="flex justify-end mt-4">
                {isSaved ? (
                    <CardButton onClick={handleEdit} className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm">Edit Benchmark</CardButton>
                ) : (
                    <CardButton onClick={handleSave}>Save Benchmark</CardButton>
                )}
            </div>
        </div>
    );
};


export const CardRenderer: React.FC<CardRendererProps> = ({ card, onAction, messageId, allConfigs = [], allTemplates = [], allBenchmarks = [] }) => {
  const cardMap: { [key in CardType]?: React.ReactNode } = {
    [CardType.WELCOME]: <WelcomeCard onAction={onAction} />,
    [CardType.SOP_CHOOSER]: <SopChooserCard onAction={onAction} />,
    [CardType.CONFIG_CREATOR_CHOOSER]: <ConfigCreatorChooserCard payload={card.payload} onAction={onAction} />,
    [CardType.TEMPLATE_SELECTOR]: <TemplateSelectorCard payload={card.payload} onAction={onAction} allTemplates={allTemplates} messageId={messageId} />,
    [CardType.CONFIG_SELECTOR]: <ConfigSelectorCard payload={card.payload} onAction={onAction} allConfigs={allConfigs} messageId={messageId} />,
    [CardType.CONFIG_WIZARD]: <ConfigWizardCard payload={card.payload} onAction={onAction} messageId={messageId}/>,
    [CardType.CONFIG_DETAILS]: <ConfigDetailsCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.TEST_STARTER]: <TestStarterCard payload={card.payload} onAction={onAction} messageId={messageId} allBenchmarks={allBenchmarks || []} />,
    [CardType.TEST_RESULTS_SUMMARY]: <TestResultsSummaryCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.ANALYSIS_RESULTS]: <AnalysisResultsCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.ROOT_CAUSE_ANALYSIS]: <RootCauseAnalysisCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.INTERACTIVE_DIAGNOSTIC]: <InteractiveDiagnosticCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.CONFIRMATION]: <ConfirmationCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.ALERT]: <AlertCard payload={card.payload} />,
    [CardType.FILE_UPLOAD]: <FileUploadCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.BENCHMARK_LIST]: <BenchmarkListCard payload={card.payload} onAction={onAction} />,
    [CardType.JSON_IMPORTER]: <JsonImporterCard onAction={onAction} messageId={messageId} />,
    [CardType.TEMPLATE_EDITOR]: <TemplateEditorCard payload={card.payload} onAction={onAction} messageId={messageId} />,
    [CardType.BENCHMARK_WIZARD]: <BenchmarkWizardCard payload={card.payload} onAction={onAction} messageId={messageId} allConfigs={allConfigs} />,
  };

  const Component = cardMap[card.type];
  const sopContext = card.payload?.sopContext;

  if (!Component) {
    return <div className="text-red-500">Error: Unknown card type "{card.type}"</div>;
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {sopContext && <SopTimeline {...sopContext} onAction={onAction} sopContext={sopContext} />}
      {Component}
    </div>
  );
};