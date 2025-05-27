

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QUESTIONS, KITCHEN_STYLES_IMAGES, EMAIL_QUESTION } from './constants'; // Removed CONSENT_QUESTION from imports
import { QuestionCard } from './components/QuestionCard';
import { ProgressBar } from './components/ProgressBar';
import { CostSummary } from './components/CostSummary';
import { ChevronLeftIcon, ChevronRightIcon } from './components/icons/NavigationIcons';
import type { Answers, Question, EstimatedCost, CostBreakdownItem, DimensionValue, QuestionOption, ChosenOptionSummary, CostMapping, Answer } from './types';

// Define a unique ID for the email consent answer
const EMAIL_CONSENT_ID = 'emailConsent';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [estimatedCost, setEstimatedCost] = useState<EstimatedCost | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState(''); 
  const [contactMessage, setContactMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastAnsweredMcQuestionId, setLastAnsweredMcQuestionId] = useState<string | null>(null);

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeQuestions = useMemo(() => {
    const baseQuestions = [...QUESTIONS];
    const savePreferenceAnswer = answers.saveCalculationPreference;
    const prefIndex = baseQuestions.findIndex(q => q.id === 'saveCalculationPreference');

    if (savePreferenceAnswer === 'yes' && prefIndex !== -1) {
        baseQuestions.splice(prefIndex + 1, 0, EMAIL_QUESTION); // Only add EMAIL_QUESTION
    } else if (savePreferenceAnswer === 'yes') { 
        baseQuestions.push(EMAIL_QUESTION);
    }
    return baseQuestions;
  }, [answers.saveCalculationPreference]);

  const totalActiveQuestions = activeQuestions.length;

  const clearValidationError = () => {
    if (validationError) {
      setValidationError(null);
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateCurrentStep = useCallback((): boolean => {
    const currentQuestion = activeQuestions[currentStep];
    if (!currentQuestion) return true; 

    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id];
      let isValid = true;
      let message = `Beantwoord alstublieft de vraag: "${currentQuestion.text}"`;

      if (currentQuestion.id === EMAIL_QUESTION.id) { // Special handling for email question + consent
        const emailValue = answers[EMAIL_QUESTION.id] as string | undefined;
        const consentGiven = answers[EMAIL_CONSENT_ID] === true;
        if (typeof emailValue !== 'string' || !isValidEmail(emailValue)) {
          isValid = false;
          message = 'Voer alstublieft een geldig e-mailadres in.';
        } else if (!consentGiven) {
          isValid = false;
          message = 'U dient akkoord te gaan met het gebruik van uw e-mailadres om verder te gaan.';
        }
      } else if (currentQuestion.allowMultiple && Array.isArray(answer)) {
        if (answer.length === 0) {
          isValid = false;
        }
      } else if (answer === undefined || (typeof answer === 'string' && answer.trim() === '')) {
        isValid = false;
      } else if (currentQuestion.type === 'dimensions') {
        const dimAnswer = answer as DimensionValue;
        if (!dimAnswer || dimAnswer.length === undefined || dimAnswer.width === undefined || dimAnswer.length <= 0 || dimAnswer.width <= 0) {
          isValid = false;
          message = `Voer geldige afmetingen (groter dan 0) in voor: "${currentQuestion.text}"`;
        }
      } else if (currentQuestion.type === 'text-input' && currentQuestion.id === 'userName' && (answer as string).trim().length < 2) {
        isValid = false;
        message = `Voer alstublieft een geldige naam in (minimaal 2 karakters).`;
      }
      // Removed CONSENT_QUESTION specific validation block as it's merged with EMAIL_QUESTION

      if (!isValid) {
        setValidationError(message);
        return false;
      }
    }
    clearValidationError();
    return true;
  }, [currentStep, answers, activeQuestions]);
  
  const calculateCost = useCallback(() => {
    let subTotal = 0; 
    const breakdown: CostBreakdownItem[] = [];
    let qualityMultiplier = 1.0;
    let kitchenArea = 0;

    const dimensions = answers.dimensions as DimensionValue | undefined;
    if (dimensions && dimensions.length > 0 && dimensions.width > 0) {
      kitchenArea = dimensions.length * dimensions.width;
      breakdown.push({
        categoryKey: 'algemeen',
        label: 'Keuken Afmeting',
        cost: 0, 
        details: `${dimensions.length}m x ${dimensions.width}m = ${kitchenArea.toFixed(2)} m²`
      });
    } else {
       const dimQuestion = QUESTIONS.find(q => q.id === 'dimensions');
       if (dimQuestion && answers[dimQuestion.id] !== undefined) {
         kitchenArea = 10; 
         console.warn("Keukenafmetingen ongeldig (bv. 0), standaard 10m² gebruikt voor calculatie per m².")
       } else {
         kitchenArea = 10; 
         console.warn("Keukenafmetingen niet ingevuld, standaard 10m² gebruikt voor calculatie per m².")
       }
    }
    
    // Process quality level first to establish multiplier
    const qualityQuestion = QUESTIONS.find(q => q.id === 'qualityLevel');
    if (qualityQuestion) {
        const qualityAnswer = answers[qualityQuestion.id] as string | undefined;
        const defaultQualityOption = qualityQuestion.options?.find(opt => opt.value === 'midden');
        let chosenQualityOption = qualityQuestion.options?.find(opt => opt.value === qualityAnswer) || defaultQualityOption;
        
        if (chosenQualityOption && chosenQualityOption.costMapping?.type === 'multiplier') {
            qualityMultiplier = chosenQualityOption.costMapping.factor || 1.0;
            breakdown.push({
                categoryKey: qualityQuestion.categoryKey,
                label: chosenQualityOption.costMapping.categoryLabel,
                cost: 0,
                details: `${chosenQualityOption.label} (x${qualityMultiplier.toFixed(2)})`
            });
        }
    }


    QUESTIONS.forEach(q => { 
      if (q.id === 'qualityLevel' || q.categoryKey === 'gebruiker') return; // Already processed or skip user data

      const answer = answers[q.id];
      if (answer === undefined) return;

      if (q.allowMultiple && Array.isArray(answer)) {
        answer.forEach(selectedValue => {
          const chosenOption = q.options?.find(opt => opt.value === selectedValue);
          if (chosenOption && chosenOption.costMapping) {
            const itemCost = getOptionCost(chosenOption.costMapping, kitchenArea); // No multiplier here yet
            breakdown.push({
              categoryKey: q.categoryKey,
              label: chosenOption.costMapping.categoryLabel, // Or specific label if needed
              cost: itemCost, 
              details: chosenOption.label
            });
          }
        });
      } else if (typeof answer === 'string' && q.options) {
        const chosenOption = q.options.find(opt => opt.value === answer);
        if (chosenOption && chosenOption.costMapping) {
          const itemCost = getOptionCost(chosenOption.costMapping, kitchenArea); // No multiplier here yet
          breakdown.push({
            categoryKey: q.categoryKey,
            label: chosenOption.costMapping.categoryLabel,
            cost: itemCost,
            details: chosenOption.label
          });
        }
      }
    });
    
    const finalBreakdown = breakdown.map(item => {
      if (item.categoryKey !== 'kwaliteit' && item.categoryKey !== 'algemeen' && item.categoryKey !== 'gebruiker') {
        return { ...item, cost: item.cost * qualityMultiplier };
      }
      return item;
    });

    const finalTotalCost = finalBreakdown.reduce((acc, item) => {
        if (item.categoryKey !== 'kwaliteit' && 
            item.categoryKey !== 'gebruiker' &&
            !(item.categoryKey === 'algemeen' && item.details?.includes('m²'))) { 
            return acc + item.cost;
        }
        return acc;
    }, 0);
    
    setEstimatedCost({
      total: finalTotalCost,
      breakdown: finalBreakdown,
      qualityMultiplier: qualityMultiplier,
      area: kitchenArea
    });
  }, [answers]);

  const advanceToNextStep = useCallback(() => {
    if (currentStep < totalActiveQuestions - 1) {
      setCurrentStep(currentStep + 1);
      clearValidationError();
    } else {
      calculateCost();
      setShowSummary(true);
      clearValidationError();
    }
  }, [currentStep, totalActiveQuestions, calculateCost, clearValidationError]);

  const handleAnswerChange = useCallback((questionId: string, clickedValue: string | number | DimensionValue) => {
    const question = activeQuestions.find(q => q.id === questionId);
    
    if (question && question.allowMultiple && typeof clickedValue === 'string') {
        setAnswers(prev => {
            const currentSelection = (prev[questionId] as string[] | undefined) || [];
            let newSelection: string[];

            if (clickedValue === 'geen') { // Special 'none' option for extras
                newSelection = currentSelection.includes('geen') ? [] : ['geen'];
            } else {
                const tempSelection = currentSelection.filter(v => v !== 'geen');
                if (tempSelection.includes(clickedValue)) {
                    newSelection = tempSelection.filter(v => v !== clickedValue);
                } else {
                    newSelection = [...tempSelection, clickedValue];
                }
                // If 'extras' is not required and newSelection is empty, it's fine.
                // If it were required and newSelection becomes empty, we might default to ['geen']
                // but 'extras' is not required.
                 if (questionId === 'extras' && newSelection.length === 0 && !question.required) {
                   // It's okay for it to be empty if not required
                 } else if (questionId === 'extras' && newSelection.length === 0 && question.required) {
                    newSelection = ['geen']; // Fallback if it was required and all deselected
                 }

            }
            return { ...prev, [questionId]: newSelection };
        });
    } else {
        setAnswers(prev => ({ ...prev, [questionId]: clickedValue }));
    }

    clearValidationError();

    if (questionId === 'saveCalculationPreference' && clickedValue === 'no') {
      setAnswers(prev => {
        const newAnswers = {...prev};
        delete newAnswers[EMAIL_QUESTION.id];
        delete newAnswers[EMAIL_CONSENT_ID]; // Clear consent status
        return newAnswers;
      });
    }

    const currentQ = activeQuestions[currentStep];
    if (currentQ && currentQ.id === questionId && currentQ.type === 'multiple-choice' && !currentQ.allowMultiple) {
      setLastAnsweredMcQuestionId(questionId); 
    }
  }, [currentStep, activeQuestions, clearValidationError]);

  const handleEmailConsentChange = useCallback((isChecked: boolean) => {
    setAnswers(prev => ({ ...prev, [EMAIL_CONSENT_ID]: isChecked }));
    clearValidationError();
  }, [clearValidationError]);


  const handleOptionDoubleClick = useCallback((questionId: string, value: string | number | DimensionValue) => {
    const question = activeQuestions.find(q => q.id === questionId);
    if (question && question.allowMultiple) { // Disable double click auto-advance for multi-select
        handleAnswerChange(questionId, value); // Still toggle the option
        return;
    }

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setLastAnsweredMcQuestionId(null); 

    setAnswers(prev => ({ ...prev, [questionId]: value }));
    clearValidationError();
    
    const currentQ = activeQuestions[currentStep];
    let canAdvance = true;
    
    if(currentQ.required) {
        if (currentQ.id === EMAIL_QUESTION.id) {
            const emailVal = value as string | undefined; 
            const consentGiven = answers[EMAIL_CONSENT_ID] === true; 
            if (typeof emailVal !== 'string' || !isValidEmail(emailVal)) {
                canAdvance = false;
                setValidationError('Voer alstublieft een geldig e-mailadres in.');
            } else if (!consentGiven) {
                // This case is less likely for double-click as consent is separate UI element
            }
        } else if (value === undefined || (typeof value === 'string' && value.trim() === '')) {
            canAdvance = false;
            setValidationError(`Beantwoord alstublieft de vraag: "${currentQ.text}"`);
        }
    }

    if (canAdvance) {
      advanceToNextStep();
    }

  }, [currentStep, activeQuestions, advanceToNextStep, clearValidationError, answers, handleAnswerChange]); 


  useEffect(() => {
    if (lastAnsweredMcQuestionId) {
      const question = activeQuestions[currentStep];
      // Only auto-advance if not multi-select
      if (question && question.id === lastAnsweredMcQuestionId && question.type === 'multiple-choice' && !question.allowMultiple) {
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
        autoAdvanceTimerRef.current = setTimeout(() => {
          if (validateCurrentStep()) { 
            advanceToNextStep();
          }
          setLastAnsweredMcQuestionId(null); 
          autoAdvanceTimerRef.current = null;
        }, 300); 
      } else {
        setLastAnsweredMcQuestionId(null);
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
      }
    }
    return () => { 
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [lastAnsweredMcQuestionId, currentStep, activeQuestions, advanceToNextStep, validateCurrentStep]);


  const prevStep = () => {
    clearValidationError();
    setLastAnsweredMcQuestionId(null); 
     if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
    }
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
    
  const resetApp = () => {
    clearValidationError();
    setCurrentStep(0);
    setAnswers({}); 
    setEstimatedCost(null);
    setShowSummary(false);
    setShowContactModal(false);
    setUserName(''); 
    setUserEmail('');
    setContactMessage('');
    setLastAnsweredMcQuestionId(null);
    if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
    }
  };

  const chosenOptionsSummary: ChosenOptionSummary[] = useMemo(() => {
    const summaryItems: ChosenOptionSummary[] = [];
    activeQuestions.forEach(q => {
      const answer = answers[q.id];
      let chosenValue = '';
      let imageUrl: string | undefined;

      if (q.id === EMAIL_QUESTION.id && typeof answer === 'string') {
          chosenValue = answer; // Email address
          summaryItems.push({ questionText: q.text, chosenValue });
          if (answers[EMAIL_CONSENT_ID] === true) {
            summaryItems.push({ questionText: "Toestemming e-mailgebruik", chosenValue: "Ja" });
          } else if (answers.saveCalculationPreference === 'yes') { 
             summaryItems.push({ questionText: "Toestemming e-mailgebruik", chosenValue: "Nee (vereist om op te slaan)" });
          }
          return; 
      }

      if (q.allowMultiple && Array.isArray(answer) && q.options) {
        if (answer.length > 0) {
          chosenValue = answer.map(val => q.options?.find(opt => opt.value === val)?.label || val).join(', ');
        } else if (!q.required) {
            chosenValue = 'Geen selectie'; // Or omit if not preferred
        }
      } else if (q.type === 'dimensions' && typeof answer === 'object' && answer && 'length' in answer && 'width' in answer) {
        const dims = answer as DimensionValue;
        chosenValue = (dims.length && dims.width) ? `${dims.length}m x ${dims.width}m` : '';
      } else if (typeof answer === 'string' && q.options) {
        const selectedOption = q.options.find(opt => opt.value === answer);
        if (selectedOption) {
          chosenValue = selectedOption.label;
          if (q.id === 'style') imageUrl = selectedOption.imageUrl;
        }
      } else if (typeof answer === 'string' || typeof answer === 'number') {
        chosenValue = String(answer);
      }
      
      // Only add if there's a meaningful chosen value, or if it's an empty multi-select that's not required.
      if (chosenValue && (chosenValue !== 'Geen selectie' || (q.allowMultiple && !q.required && Array.isArray(answer) && answer.length === 0))) {
        if (q.allowMultiple && !q.required && Array.isArray(answer) && answer.length === 0) {
           // Optionally show "Geen extra's gekozen" or similar if desired, or skip
        } else {
          summaryItems.push({
            questionText: q.text,
            chosenValue: chosenValue,
            imageUrl: q.id === 'style' ? imageUrl : undefined,
          });
        }
      }
    });
    return summaryItems.filter(summary => summary.chosenValue && summary.chosenValue !== 'Niet gespecificeerd');
  }, [answers, activeQuestions]);


  const visualPreviewUrl = answers.style && typeof answers.style === 'string' 
    ? KITCHEN_STYLES_IMAGES[answers.style] || KITCHEN_STYLES_IMAGES.default
    : KITCHEN_STYLES_IMAGES.default;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact Form Submitted:', { 
        name: userName, 
        email: userEmail, 
        message: contactMessage, 
        allAnswers: answers, 
        consentGivenForContactForm: answers[EMAIL_CONSENT_ID] === true 
    });
    alert('Bedankt voor uw bericht! Een specialist neemt contact met u op (dit is een demo).');
    setShowContactModal(false);
    setContactMessage(''); 
  };
  
  useEffect(() => {
    if (showContactModal) { 
        if (answers.userName && typeof answers.userName === 'string') {
          setUserName(answers.userName);
        }
        if (answers.userEmailInput && typeof answers.userEmailInput === 'string') {
          setUserEmail(answers.userEmailInput); 
        }
    }
  }, [answers.userName, answers.userEmailInput, showContactModal]);


  const isCurrentQuestionValid = useCallback((): boolean => {
    if (showSummary) return true; 
    const currentQuestion = activeQuestions[currentStep];
    if (!currentQuestion) return true;

    if (!currentQuestion.required) {
        return true; 
    }
    const answer = answers[currentQuestion.id];

    if (currentQuestion.id === EMAIL_QUESTION.id) {
      const emailValue = answers[EMAIL_QUESTION.id] as string | undefined;
      const consentGiven = answers[EMAIL_CONSENT_ID] === true;
      if (typeof emailValue !== 'string' || !isValidEmail(emailValue) || !consentGiven) {
        return false;
      }
      return true;
    }
    
    if (currentQuestion.allowMultiple && Array.isArray(answer)) {
        if (answer.length === 0) return false; // If required and multi-select, must have at least one.
    } else if (answer === undefined || (typeof answer === 'string' && answer.trim() === '')) {
        return false;
    }

    if (currentQuestion.type === 'dimensions') {
        const dimAnswer = answer as DimensionValue;
        if (!dimAnswer || typeof dimAnswer.length !== 'number' || typeof dimAnswer.width !== 'number' || 
            dimAnswer.length <= 0 || dimAnswer.width <= 0) {
            return false;
        }
    }
    if (currentQuestion.type === 'text-input' && currentQuestion.id === 'userName') {
        if (typeof answer !== 'string' || (answer as string).trim().length < 2) {
            return false;
        }
    }
    return true;
  }, [currentStep, answers, showSummary, activeQuestions]);

  const isNextButtonDisabled = !isCurrentQuestionValid();
  const currentQuestion = activeQuestions[currentStep];

  const handleEnterPressInInput = useCallback(() => {
    if (validateCurrentStep()) {
        advanceToNextStep();
    }
  }, [validateCurrentStep, advanceToNextStep]);
  
  const getOptionCost = (costMapping: CostMapping, area: number): number => {
    let itemCost = 0;
    if (costMapping.type === 'fixed' && costMapping.amount !== undefined) {
      itemCost = costMapping.amount;
    } else if (costMapping.type === 'per_sqm' && costMapping.amount_per_sqm !== undefined) {
      if (costMapping.categoryLabel === 'Werkblad') { 
        itemCost = costMapping.amount_per_sqm * (area > 0 ? Math.max(2, area / 3) : 3);
      } else {
        itemCost = costMapping.amount_per_sqm * area;
      }
    }
    return itemCost;
  };
  
  const getOptionCostImpact = useCallback((questionId: string, optionValue: string): { impact: number; isContribution: boolean } => {
    const question = QUESTIONS.find(q => q.id === questionId); 
    if (!question || !question.options || question.id === 'qualityLevel') {
      return { impact: 0, isContribution: false };
    }
  
    const targetOption = question.options.find(opt => opt.value === optionValue);
    if (!targetOption || !targetOption.costMapping) {
      return { impact: 0, isContribution: false };
    }
  
    const currentQualityAnswer = answers.qualityLevel as string | undefined;
    let qualityMultiplier = 1.0;
    const qualityQuestionDef = QUESTIONS.find(q => q.id === 'qualityLevel');
    if (currentQualityAnswer) {
      const selectedQualityOpt = qualityQuestionDef?.options?.find(opt => opt.value === currentQualityAnswer);
      if (selectedQualityOpt?.costMapping?.type === 'multiplier' && selectedQualityOpt.costMapping.factor) {
        qualityMultiplier = selectedQualityOpt.costMapping.factor;
      }
    } else {
      const defaultQualityOpt = qualityQuestionDef?.options?.find(opt => opt.value === 'midden');
      if (defaultQualityOpt?.costMapping?.type === 'multiplier' && defaultQualityOpt.costMapping.factor) {
        qualityMultiplier = defaultQualityOpt.costMapping.factor;
      }
    }
  
    const dimensions = answers.dimensions as DimensionValue | undefined;
    let kitchenArea = 10; 
    if (dimensions && dimensions.length > 0 && dimensions.width > 0) {
      kitchenArea = dimensions.length * dimensions.width;
    }
  
    const targetRawCost = getOptionCost(targetOption.costMapping, kitchenArea);
    const targetCostWithQuality = targetRawCost * qualityMultiplier;

    const currentAnswerForQuestion = answers[questionId] as Answer;

    if (question.allowMultiple && Array.isArray(currentAnswerForQuestion)) {
        const isCurrentlySelected = currentAnswerForQuestion.includes(optionValue);
        if (isCurrentlySelected) {
             // Impact of removing this option
            return { impact: -targetCostWithQuality, isContribution: false };
        } else {
            // Impact of adding this option
            return { impact: targetCostWithQuality, isContribution: false };
        }
    } else if (typeof currentAnswerForQuestion === 'string') { // Single select
        if (currentAnswerForQuestion === optionValue) {
            return { impact: targetCostWithQuality, isContribution: true }; // It's the current contribution
        } else {
            let currentSelectedCost = 0;
            const currentSelectedOption = question.options.find(opt => opt.value === currentAnswerForQuestion);
            if (currentSelectedOption && currentSelectedOption.costMapping) {
                const currentRawCost = getOptionCost(currentSelectedOption.costMapping, kitchenArea);
                currentSelectedCost = currentRawCost * qualityMultiplier;
            }
            return { impact: targetCostWithQuality - currentSelectedCost, isContribution: false }; // Difference if switched
        }
    } else { // No answer yet for this question (single select)
         return { impact: targetCostWithQuality, isContribution: false }; // Impact is simply its cost
    }
  }, [answers]);


  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl mb-6 md:mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500">
          Keuken kosten berekenen
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Ontvang een schatting voor uw droomkeuken in een paar stappen.
        </p>
      </header>

      <main className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-5 sm:p-8 md:p-10">
        {!showSummary && currentQuestion ? (
          <>
            <ProgressBar currentStep={currentStep} totalSteps={totalActiveQuestions} />
            <div className="mt-6 md:mt-8">
              <QuestionCard
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                allAnswers={answers}
                onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                onOptionDoubleClick={(value) => handleOptionDoubleClick(currentQuestion.id, value)}
                onEnterPress={currentQuestion.type === 'text-input' ? handleEnterPressInInput : undefined}
                getOptionCostImpact={getOptionCostImpact}
                emailConsentValue={currentQuestion.id === EMAIL_QUESTION.id ? !!answers[EMAIL_CONSENT_ID] : undefined}
                onEmailConsentChange={currentQuestion.id === EMAIL_QUESTION.id ? handleEmailConsentChange : undefined}
              />
            </div>
            {validationError && (
              <div role="alert" className="mt-4 text-red-700 bg-red-100 p-3 rounded-md text-sm">
                {validationError}
              </div>
            )}
            <div className="mt-8 md:mt-10 flex flex-col-reverse sm:flex-row sm:justify-between items-center space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0 && !showSummary}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-slate-600 font-medium rounded-lg border border-gray-300 shadow-sm transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5"/>
                Vorige
              </button>
              <button
                onClick={() => { if (validateCurrentStep()) advanceToNextStep(); }}
                disabled={isNextButtonDisabled}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-lg shadow-md transition-colors duration-150 ease-in-out 
                  ${isNextButtonDisabled 
                    ? 'bg-sky-300 cursor-not-allowed' 
                    : 'bg-sky-600 hover:bg-sky-700'}`}
              >
                {currentStep === totalActiveQuestions - 1 ? 'Bereken Kosten' : 'Volgende'}
                <ChevronRightIcon className="w-5 h-5"/>
              </button>
            </div>
          </>
        ) : estimatedCost ? (
          <CostSummary
            estimatedCost={estimatedCost}
            // chosenOptions={chosenOptionsSummary} // This prop is no longer used by CostSummary
            visualPreviewUrl={visualPreviewUrl}
            onEdit={prevStep} 
            onRestart={resetApp}
            onContact={() => setShowContactModal(true)}
          />
        ) : (
           <div className="text-center py-10">
            <p className="text-xl text-gray-500">Laden...</p>
          </div>
        )}
      </main>
      <footer className="mt-10 md:mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Keuken kosten berekenen. Demo Versie.</p>
        <p>Prijzen zijn schattingen en kunnen afwijken.</p>
      </footer>

      {showContactModal && (
         <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contactModalTitle"
          >
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg text-slate-800 relative">
            <button 
              onClick={() => setShowContactModal(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Sluit contactformulier"
            >
              &times;
            </button>
            <h2 id="contactModalTitle" className="text-2xl font-semibold mb-6 text-sky-700">Neem Contact Op</h2>
            <p className="mb-6 text-gray-600">Vul het formulier in en een keukenspecialist neemt zo spoedig mogelijk contact met u op voor een gedetailleerde offerte.</p>
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <label htmlFor="contactFormUserName" className="block text-sm font-medium text-sky-700 mb-1">Naam</label>
                <input 
                  type="text" 
                  id="contactFormUserName" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700"
                  placeholder="Uw volledige naam"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-sky-700 mb-1">Email</label>
                <input 
                  type="email" 
                  id="userEmail" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  required 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700"
                  placeholder="uw.email@voorbeeld.com"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="contactMessage" className="block text-sm font-medium text-sky-700 mb-1">Bericht (optioneel)</label>
                <textarea 
                  id="contactMessage" 
                  rows={4}
                  value={contactMessage} 
                  onChange={(e) => setContactMessage(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 text-slate-700"
                  placeholder="Eventuele specifieke wensen of vragen..."
                />
              </div>
              <button 
                type="submit"
                className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150"
              >
                Verstuur Bericht
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;