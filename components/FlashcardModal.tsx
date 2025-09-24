import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { XCircleIcon } from './Icons';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset state when modal is opened or cards change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  if (!isOpen || cards.length === 0) return null;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  const currentCard = cards[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flashcard-title"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto flex flex-col relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="flashcard-title" className="text-lg font-bold text-white">Flashcards: Bot Commands & Tips</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close flashcards">
            <XCircleIcon className="h-7 w-7" />
          </button>
        </header>

        <main className="p-6 flex-grow">
          <div 
            className="w-full h-64 perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setIsFlipped(!isFlipped)}
            aria-live="polite"
          >
            <div className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front of Card */}
              <div className="absolute w-full h-full backface-hidden bg-indigo-900/50 border border-indigo-500 rounded-lg flex flex-col justify-center items-center p-6 text-center">
                <p className="text-sm font-semibold text-indigo-300">Question</p>
                <p className="mt-4 text-xl font-medium text-white">{currentCard.question}</p>
              </div>
              {/* Back of Card */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gray-700 border border-gray-600 rounded-lg flex flex-col justify-center items-center p-6 text-center">
                 <p className="text-sm font-semibold text-gray-300">Answer</p>
                 <p className="mt-4 text-lg text-white">{currentCard.answer}</p>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="p-4 border-t border-gray-700">
          <div className="flex justify-center mb-3">
             <button onClick={() => setIsFlipped(!isFlipped)} className="px-6 py-2 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-500 rounded-md transition-colors duration-200">
                {isFlipped ? 'Show Question' : 'Flip to Answer'}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={handlePrev} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200">
              Previous
            </button>
            <p className="text-sm text-gray-400 font-medium">Card {currentIndex + 1} of {cards.length}</p>
            <button onClick={handleNext} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200">
              Next
            </button>
          </div>
        </footer>
      </div>
       <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
