import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-1.5 text-sm font-medium text-gray-700">
        <span>Stap {currentStep + 1} van {totalSteps}</span>
        <span>{Math.round(progressPercentage)}% voltooid</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
        <div
          className="bg-gradient-to-r from-sky-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          aria-label={`Voortgang: ${Math.round(progressPercentage)}%`}
        ></div>
      </div>
    </div>
  );
};