
import React from 'react';
import type { Question, QuestionOption, DimensionValue, Answer, Answers } from '../types';
import { EMAIL_QUESTION } from '../constants'; // Import EMAIL_QUESTION to identify it

interface QuestionCardProps {
  question: Question;
  value: Answer;
  allAnswers: Answers; 
  onChange: (value: string | number | DimensionValue) => void;
  onOptionDoubleClick?: (value: string | number | DimensionValue) => void;
  onEnterPress?: () => void; 
  getOptionCostImpact?: (questionId: string, optionValue: string) => { impact: number; isContribution: boolean };
  emailConsentValue?: boolean; // For the integrated consent checkbox
  onEmailConsentChange?: (isChecked: boolean) => void; // Handler for consent checkbox
}

const PRESET_DIMENSIONS: Array<{ id: string; label: string; value: DimensionValue; description: string }> = [
  { id: 'small', label: "Klein", value: { length: 3, width: 3 }, description: "tot 10m² (bv. 3x3m)" },
  { id: 'medium', label: "Medium", value: { length: 4, width: 3.5 }, description: "tot 15m² (bv. 4x3.5m)" },
  { id: 'large', label: "Groot", value: { length: 5, width: 3.5 }, description: "vanaf 15m² (bv. 5x3.5m)" },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const CONSENT_TEXT = "Ik geef toestemming om mijn e-mailadres te gebruiken voor het ontvangen van deze berekening en voor eventueel contact door een specialist. Raadpleeg ons privacybeleid voor meer informatie.";

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  value, 
  allAnswers, 
  onChange, 
  onOptionDoubleClick, 
  onEnterPress, 
  getOptionCostImpact, // Prop remains, but its direct rendering is removed
  emailConsentValue,
  onEmailConsentChange
}) => {
  const renderInput = () => {
    switch (question.type) {
      case 'dimensions':
        const currentDimValue = (value && typeof value === 'object' && 'length' in value && 'width' in value)
          ? value as DimensionValue
          : { length: 0, width: 0 };

        const displayLength = currentDimValue?.length ? String(currentDimValue.length) : '';
        const displayWidth = currentDimValue?.width ? String(currentDimValue.width) : '';

        const handlePresetClick = (presetValue: DimensionValue) => {
          onChange(presetValue);
        };

        const isPresetActive = (preset: DimensionValue) => {
          return currentDimValue.length === preset.length && currentDimValue.width === preset.width;
        };

        return (
          <>
            <div className="mb-6">
              <h3 className="text-md font-medium text-sky-700 mb-2">Kies een standaardgrootte (optioneel):</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESET_DIMENSIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className={`rounded-lg border p-3 text-center transition-all duration-200 ease-in-out transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white 
                      ${ isPresetActive(preset.value)
                        ? 'bg-sky-500 text-white ring-2 ring-sky-500 shadow-lg scale-[1.01]' 
                        : 'bg-white hover:bg-gray-50 text-slate-700 border-gray-300 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-gray-400'
                      }`}
                  >
                    <div className="font-semibold text-sm">{preset.label}</div>
                    <div className={`text-xs mt-0.5 ${isPresetActive(preset.value) ? 'text-sky-100' : 'text-gray-500'}`}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
               <h3 className="text-md font-medium text-sky-700 mb-2 pt-2 border-t border-gray-200 mt-4">Of voer aangepaste afmetingen in:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${question.id}-length`} className="block text-sm font-medium text-sky-700 mb-1">Lengte (m)</label>
                  <input
                    type="number"
                    id={`${question.id}-length`}
                    value={displayLength}
                    onChange={(e) => {
                      const newLength = parseFloat(e.target.value) || 0; 
                      onChange({ ...currentDimValue, length: newLength });
                    }}
                    placeholder="bv. 3.5"
                    min="0.1"
                    step="0.1"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700 shadow-sm"
                    required={question.required && !(currentDimValue &&currentDimValue.length > 0 && currentDimValue.width > 0)}
                    aria-required={question.required && !(currentDimValue && currentDimValue.length > 0 && currentDimValue.width > 0)}
                  />
                </div>
                <div>
                  <label htmlFor={`${question.id}-width`} className="block text-sm font-medium text-sky-700 mb-1">Breedte (m)</label>
                  <input
                    type="number"
                    id={`${question.id}-width`}
                    value={displayWidth}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value) || 0; 
                      onChange({ ...currentDimValue, width: newWidth });
                    }}
                    placeholder="bv. 2.8"
                    min="0.1"
                    step="0.1"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700 shadow-sm"
                    required={question.required && !(currentDimValue && currentDimValue.length > 0 && currentDimValue.width > 0)}
                    aria-required={question.required && !(currentDimValue && currentDimValue.length > 0 && currentDimValue.width > 0)}
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 'multiple-choice':
        const hasImages = question.options?.some(opt => opt.imageUrl);
        const currentAnswerArray = Array.isArray(value) ? value : (value !== undefined ? [String(value)] : []);
        
        return (
          <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${hasImages ? 'md:grid-cols-2' : (question.options && question.options.length > 3 ? 'md:grid-cols-2' : 'md:grid-cols-1')}`}>
            {question.options?.map((option: QuestionOption) => {
              const isSelected = question.allowMultiple 
                ? currentAnswerArray.includes(option.value)
                : value === option.value;

              // The costImpactDisplay logic is removed from here.
              // The getOptionCostImpact prop is still available if needed for other purposes,
              // but it's not used to render text next to the option label anymore.

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  onDoubleClick={onOptionDoubleClick && !question.allowMultiple ? () => onOptionDoubleClick(option.value) : undefined}
                  className={`rounded-lg border text-left transition-all duration-200 ease-in-out transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white 
                    ${ isSelected
                      ? 'bg-sky-500 text-white ring-2 ring-sky-500 shadow-lg scale-[1.01]' 
                      : 'bg-white hover:bg-gray-50 text-slate-700 border-gray-300 shadow-md hover:shadow-lg hover:scale-[1.02] hover:border-gray-400'
                    }`}
                  aria-pressed={isSelected}
                >
                  <div className="p-4 flex flex-col h-full">
                    {option.imageUrl && (
                      <img 
                        src={option.imageUrl} 
                        alt={option.label} 
                        className="w-full h-32 sm:h-40 object-cover rounded-md mb-3" 
                        loading="lazy"
                      />
                    )}
                    <div className={`font-semibold text-base ${option.imageUrl ? 'mt-auto' : ''}`}>{option.label}</div>
                    {option.priceIndication && (
                      <div className={`text-sm mt-0.5 ${isSelected ? 'text-sky-100' : 'text-sky-600'}`}>
                        ({option.priceIndication})
                      </div>
                    )}
                    {/* costImpactDisplay rendering removed */}
                    {option.detail && (
                      <p className={`text-xs mt-1 ${isSelected ? 'text-gray-50' : 'text-gray-500'}`}>
                        {option.detail}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
        case 'text-input':
          if (question.id === EMAIL_QUESTION.id) {
            return (
              <div className="space-y-4">
                <div>
                  <label htmlFor={question.id} className="sr-only">{question.text}</label>
                  <input
                    type="email"
                    id={question.id}
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onEnterPress) {
                        e.preventDefault();
                        onEnterPress();
                      }
                    }}
                    placeholder={question.placeholder || `Voer ${question.text.toLowerCase()} in`}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700 shadow-sm"
                    required={question.required}
                    aria-required={question.required}
                  />
                </div>
                {onEmailConsentChange && ( 
                  <div className="flex items-start">
                    <input
                      id="emailConsentCheckbox"
                      type="checkbox"
                      checked={!!emailConsentValue}
                      onChange={(e) => onEmailConsentChange(e.target.checked)}
                      className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mt-1"
                      aria-required="true"
                    />
                    <label htmlFor="emailConsentCheckbox" className="ml-2.5 text-sm text-gray-600">
                      {CONSENT_TEXT}
                    </label>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div>
              <label htmlFor={question.id} className="sr-only">{question.text}</label>
              <input
                type={question.id === 'userEmailInput' ? 'email' : 'text'}
                id={question.id}
                value={(value as string) || ''}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onEnterPress) {
                    e.preventDefault();
                    onEnterPress();
                  }
                }}
                placeholder={question.placeholder || `Voer ${question.text.toLowerCase()} in`}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700 shadow-sm"
                required={question.required}
                aria-required={question.required}
              />
            </div>
          );
      default:
        return <p className="text-red-500">Vraagtype niet ondersteund.</p>;
    }
  };

  return (
    <div className="bg-white p-0">
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-sky-700">{question.text}</h2>
      {question.detailText && <p className="text-gray-600 mb-5 text-sm md:text-base">{question.detailText}</p>}
      {renderInput()}
    </div>
  );
};
