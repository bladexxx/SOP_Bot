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
                 <h4 className="font-bold text-md text-gray-800">SOP: {sopTitle}</h4>
                 {currentStep > 1 && !isComplete && (
                     <button 
                        onClick={() => onAction(ActionType.REWIND_SOP_STEP, { sopContext })} 
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                         Previous Step
                     </button>
                 )}
            </div>
            <ol className="relative border-l border-gray-300 ml-2">
                {sop.steps.map(step => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;

                    return (
                        <li key={step.id} className="mb-6 ml-6">
                            <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white
                                ${isCompleted ? 'bg-green-100' : ''}
                                ${isActive ? 'bg-teal-100' : ''}
                                ${!isCompleted && !isActive ? 'bg-gray-200' : ''}
                            `}>
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <span className={`font-bold text-xs
                                        ${isActive ? 'text-teal-800' : 'text-gray-500'}
                                    `}>{step.id}</span>
                                )}
                            </span>
                            <h5 className={`font-semibold
                                ${isActive ? 'text-gray-900' : 'text-gray-500'}
                                ${isCompleted ? 'line-through text-gray-400' : ''}
                            `}>{step.title}</h5>
                        </li>
                    );
                })}
            </ol>
             {isComplete && (
                 <div className="mt-4 p-2 rounded-md bg-green-50 border border-green-300 text-center">
                    <p className="font-semibold text-green-700">SOP Complete!</p>
                </div>
            )}
        </div>
    );
};

export { sopDefinitions };