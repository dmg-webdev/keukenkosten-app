
export interface CostMapping {
  type: 'fixed' | 'per_sqm' | 'multiplier';
  amount?: number;
  amount_per_sqm?: number;
  factor?: number;
  categoryLabel: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  imageUrl?: string;
  costMapping?: CostMapping;
  detail?: string;
  priceIndication?: string; // Toegevoegd voor prijsindicatie per keuze
}

export interface Question {
  id: string;
  text: string;
  detailText?: string;
  type: 'dimensions' | 'multiple-choice' | 'text-input'; // Added text-input
  categoryKey: string; // Used for grouping answers and costs
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string; // for text-input
  unit?: string; // for dimensions or text-input with number
  allowMultiple?: boolean; // Added for multi-select questions
}

export interface DimensionValue {
  length: number;
  width: number;
}

export type Answer = string | number | DimensionValue | boolean | string[] | undefined;

export interface Answers {
  [key: string]: Answer;
}

export interface CostBreakdownItem {
  categoryKey: string; // from Question.categoryKey
  label: string; // from QuestionOption.label or Question.text
  cost: number;
  details?: string; // e.g. chosen option like "Modern"
}

export interface EstimatedCost {
  total: number;
  breakdown: CostBreakdownItem[];
  qualityMultiplier: number;
  area: number;
}

export interface ChosenOptionSummary {
  questionText: string;
  chosenValue: string;
  imageUrl?: string;
}