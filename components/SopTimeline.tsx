import React from 'react';
import { ActionType } from '../types';
import { CheckCircleIcon } from './Icons';

interface SopTimelineProps {
    sopType: string;
    sopTitle: string;
    currentStep: number;
    onAction: (action: ActionType, payload?: any) => void;
    sopContext: any;
}

const sopDefinitions: { [key: string]: { title: string, steps: { id: number, title: string, action: ActionType | null }[] } } = {
    'NEW_CONFIG_SINGLE': {
        title: 'Unit & Functional Testing',
        steps: [
            { id: 1, title: "Create or Modify Configuration", action: ActionType.START_CONFIG },
            { id: 2, title: "Run Verification Test", action: ActionType.START_BATCH_TEST },
            { id: 3, title: "Analyze Discrepancies", action: ActionType.TRIGGER_ANALYSIS },
            { id: 4, title: "Complete Verification", action: null }
        ]
    },
    'NEW_CONFIG_BATCH': {
        title: 'Full Regression & Performance Test',
        steps: [
            { id: 1, title: "Create or Select Configuration", action: ActionType.START_CONFIG },
            { id: 2, title: "Run Batch Test", action: ActionType.START_BATCH_TEST },
            { id: 3, title: "Analyze Discrepancies", action: ActionType.TRIGGER_ANALYSIS },
            { id: 4, "title": "Complete Verification", action: null }
        ]
    },
    'EXISTING_CONFIG_SINGLE': {
        title: 'Regression Testing',
        steps: [
            { id: 1, title: "Select Existing Configuration", action: ActionType.SHOW_CONFIG_SELECTOR },
            { id: 2, title: "Run Verification Test", action: ActionType.START_BATCH_TEST },
            { id: 3, title: "Analyze Discrepancies", action: ActionType.TRIGGER_ANALYSIS },
            { id: 4, title: "Complete Verification", action: null }
        ]
    },
    'EXISTING_CONFIG_BATCH': {
        title: 'End-to-End Business Validation',
        steps: [
            { id: 1, title: "Select Existing Configuration", action: ActionType.SHOW_CONFIG_SELECTOR },
            { id: 2, title: "Run Batch Test", action: ActionType.START_BATCH_TEST },
            { id: 3, title: "Analyze Discrepancies", action: ActionType.TRIGGER_ANALYSIS },
            { id: 4, title: "Complete Verification", action: null }
        ]
    }
};

export const SopTimeline: React.FC<SopTimelineProps> = ({ sopType, sopTitle, currentStep, onAction, sopContext }) => {
    const sop = sopDefinitions[sopType] || sopDefinitions['NEW_CONFIG_SINGLE'];
    const isComplete = currentStep > sop.steps.length;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-md text-white">SOP: {sopTitle}</h4>
                 {currentStep > 1 && !isComplete && (
                     <button 
                        onClick={() => onAction(ActionType.REWIND_SOP_STEP, { sopContext })} 
                        className="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                         Previous Step
                     </button>
                 )}
            </div>
            <ol className="relative border-l border-gray-600 ml-2">
                {sop.steps.map(step => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;

                    return (
                        <li key={step.id} className="mb-6 ml-6">
                            <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-gray-800
                                ${isCompleted ? 'bg-green-900' : ''}
                                ${isActive ? 'bg-indigo-900' : ''}
                                ${!isCompleted && !isActive ? 'bg-gray-700' : ''}
                            `}>
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                ) : (
                                    <span className={`font-bold text-xs
                                        ${isActive ? 'text-indigo-300' : 'text-gray-400'}
                                    `}>{step.id}</span>
                                )}
                            </span>
                            <h5 className={`font-semibold
                                ${isActive ? 'text-white' : 'text-gray-400'}
                                ${isCompleted ? 'line-through text-gray-500' : ''}
                            `}>{step.title}</h5>
                        </li>
                    );
                })}
            </ol>
             {isComplete && (
                 <div className="mt-4 p-2 rounded-md bg-green-900/50 border border-green-700 text-center">
                    <p className="font-semibold text-green-300">SOP Complete!</p>
                </div>
            )}
        </div>
    );
};

export { sopDefinitions };
