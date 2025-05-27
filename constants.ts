import { Question } from './types';

export const KITCHEN_STYLES_IMAGES: Record<string, string> = {
  modern: 'https://picsum.photos/seed/modernkitchen/600/400',
  klassiek: 'https://picsum.photos/seed/classickitchen/600/400',
  landelijk: 'https://picsum.photos/seed/countrykitchen/600/400',
  industrieel: 'https://picsum.photos/seed/industrialkitchen/600/400',
  default: 'https://picsum.photos/seed/kitchensample/600/400',
};

export const EMAIL_QUESTION: Question = {
  id: 'userEmailInput',
  text: 'Wat is uw e-mailadres?',
  detailText: 'Vul hieronder uw e-mailadres in. U dient ook akkoord te gaan met het gebruik ervan om verder te gaan.', // Updated detailText
  type: 'text-input', // This will be handled specially in QuestionCard to include consent checkbox
  categoryKey: 'gebruiker',
  required: true,
  placeholder: 'voorbeeld@email.com',
};

// CONSENT_QUESTION has been removed. Its functionality is merged with EMAIL_QUESTION.

export const QUESTIONS: Question[] = [
  {
    id: 'userName',
    text: 'Wat is uw naam?',
    detailText: 'Dit helpt ons om uw offerte persoonlijker te maken.',
    type: 'text-input',
    categoryKey: 'gebruiker', 
    required: true,
    placeholder: 'Voer uw volledige naam in',
  },
  {
    id: 'saveCalculationPreference',
    text: 'Wilt u deze berekening opslaan voor later?',
    detailText: 'Indien ja, kunt u aan het einde de resultaten downloaden en vragen we uw e-mailadres en toestemming.',
    type: 'multiple-choice',
    categoryKey: 'gebruiker',
    required: true,
    options: [
      { value: 'yes', label: 'Ja, graag', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Opslagvoorkeur' } },
      { value: 'no', label: 'Nee, bedankt', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Opslagvoorkeur' } },
    ],
  },
  // EMAIL_QUESTION will be conditionally inserted here by App.tsx
  // The consent checkbox will be part of the EMAIL_QUESTION rendering in QuestionCard.tsx
  {
    id: 'dimensions',
    text: 'Wat zijn de afmetingen van uw keuken?',
    detailText: 'Voer de lengte en breedte in meters in. Dit helpt ons de kosten voor vloer en werkblad te schatten.',
    type: 'dimensions',
    categoryKey: 'algemeen',
    required: true,
  },
  {
    id: 'familySize',
    text: 'Voor welke gezinssamenstelling is de keuken bedoeld?',
    type: 'multiple-choice',
    categoryKey: 'algemeen',
    required: true,
    options: [
      { value: 'single', label: 'Alleenstaand', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Gezinssamenstelling' } },
      { value: 'couple', label: 'Stel', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Gezinssamenstelling' } },
      { value: 'family', label: 'Stel met kinderen', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Gezinssamenstelling' } },
      { value: 'seniors', label: 'Senioren', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Gezinssamenstelling' } },
    ],
  },
  {
    id: 'style',
    text: 'Welke keukenstijl spreekt u aan?',
    type: 'multiple-choice',
    categoryKey: 'stijl',
    required: true,
    options: [
      { value: 'modern', label: 'Modern', imageUrl: KITCHEN_STYLES_IMAGES.modern, costMapping: { type: 'fixed', amount: 1000, categoryLabel: 'Stijl Keuze' }, priceIndication: '+ €1000' },
      { value: 'klassiek', label: 'Klassiek', imageUrl: KITCHEN_STYLES_IMAGES.klassiek, costMapping: { type: 'fixed', amount: 1500, categoryLabel: 'Stijl Keuze' }, priceIndication: '+ €1500' },
      { value: 'landelijk', label: 'Landelijk', imageUrl: KITCHEN_STYLES_IMAGES.landelijk, costMapping: { type: 'fixed', amount: 1800, categoryLabel: 'Stijl Keuze' }, priceIndication: '+ €1800' },
      { value: 'industrieel', label: 'Industrieel', imageUrl: KITCHEN_STYLES_IMAGES.industrieel, costMapping: { type: 'fixed', amount: 1200, categoryLabel: 'Stijl Keuze' }, priceIndication: '+ €1200' },
    ],
  },
  {
    id: 'qualityLevel',
    text: 'Welk kwaliteitsniveau wenst u?',
    detailText: 'Dit beïnvloedt de algehele prijs en duurzaamheid van materialen en afwerking.',
    type: 'multiple-choice',
    categoryKey: 'kwaliteit',
    required: true,
    options: [
      { value: 'budget', label: 'Budget', costMapping: { type: 'multiplier', factor: 0.8, categoryLabel: 'Kwaliteitsniveau' }, priceIndication: 'Voordelige materialen en afwerking' },
      { value: 'midden', label: 'Middenklasse', costMapping: { type: 'multiplier', factor: 1.0, categoryLabel: 'Kwaliteitsniveau' }, priceIndication: 'Goede balans prijs/kwaliteit (Standaard)' },
      { value: 'luxe', label: 'Luxe', costMapping: { type: 'multiplier', factor: 1.5, categoryLabel: 'Kwaliteitsniveau' }, priceIndication: 'Hoogwaardige materialen en luxe details' },
    ],
  },
  {
    id: 'appliances',
    text: 'Welk niveau van keukenapparatuur wenst u?',
    type: 'multiple-choice',
    categoryKey: 'apparatuur',
    required: true,
    options: [
      { value: 'basis', label: 'Basis set', detail: 'Kookplaat, oven, afzuigkap, koelkast.', costMapping: { type: 'fixed', amount: 2000, categoryLabel: 'Apparatuur' }, priceIndication: '+ €2000' },
      { value: 'standaard', label: 'Standaard set', detail: 'Inductiekookplaat, combi-oven, vaatwasser, koel-vriescombinatie.', costMapping: { type: 'fixed', amount: 4500, categoryLabel: 'Apparatuur' }, priceIndication: '+ €4500' },
      { value: 'luxe', label: 'Luxe set', detail: 'Geavanceerde kookplaat met afzuiging, stoomoven, premium vaatwasser, grote koel-vriescombinatie, wijnklimaatkast.', costMapping: { type: 'fixed', amount: 8000, categoryLabel: 'Apparatuur' }, priceIndication: '+ €8000' },
    ],
  },
  {
    id: 'countertop',
    text: 'Welk type werkblad heeft uw voorkeur?',
    type: 'multiple-choice',
    categoryKey: 'werkblad',
    required: true,
    options: [
      { value: 'laminaat', label: 'Laminaat', costMapping: { type: 'per_sqm', amount_per_sqm: 100, categoryLabel: 'Werkblad' }, priceIndication: '+ €100/m²' },
      { value: 'composiet', label: 'Composiet', costMapping: { type: 'per_sqm', amount_per_sqm: 250, categoryLabel: 'Werkblad' }, priceIndication: '+ €250/m²' },
      { value: 'graniet', label: 'Graniet', costMapping: { type: 'per_sqm', amount_per_sqm: 350, categoryLabel: 'Werkblad' }, priceIndication: '+ €350/m²' },
      { value: 'keramiek', label: 'Keramiek', costMapping: { type: 'per_sqm', amount_per_sqm: 450, categoryLabel: 'Werkblad' }, priceIndication: '+ €450/m²' },
    ],
  },
  {
    id: 'lighting',
    text: 'Wat voor soort verlichting overweegt u?',
    type: 'multiple-choice',
    categoryKey: 'verlichting',
    required: true,
    options: [
      { value: 'basis', label: 'Basis plafondverlichting', costMapping: { type: 'fixed', amount: 200, categoryLabel: 'Verlichting' }, priceIndication: '+ €200' },
      { value: 'spots', label: 'Inbouwspots', costMapping: { type: 'fixed', amount: 500, categoryLabel: 'Verlichting' }, priceIndication: '+ €500' },
      { value: 'ledstrips', label: 'LED strips onder kasten', costMapping: { type: 'fixed', amount: 800, categoryLabel: 'Verlichting' }, priceIndication: '+ €800' },
      { value: 'design', label: 'Design hanglampen & spots', costMapping: { type: 'fixed', amount: 1200, categoryLabel: 'Verlichting' }, priceIndication: '+ €1200' },
    ],
  },
  {
    id: 'installationTimeline',
    text: 'Wanneer verwacht u de nieuwe keuken te laten plaatsen?',
    detailText: 'Dit helpt ons de planning en eventuele aanbiedingen beter op uw situatie af te stemmen.',
    type: 'multiple-choice',
    categoryKey: 'planning',
    required: true,
    options: [
      { value: 'within_3_months', label: 'Binnen 3 maanden', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Installatietermijn' } },
      { value: '3_to_6_months', label: 'Binnen 3 tot 6 maanden', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Installatietermijn' } },
      { value: 'later_than_6_months', label: 'Later dan 6 maanden', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Installatietermijn' } },
    ],
  },
  {
    id: 'extras',
    text: 'Zijn er nog extra\'s die u wenst?',
    detailText: 'Selecteer eventuele aanvullende opties. U kunt meerdere opties kiezen.',
    type: 'multiple-choice', 
    categoryKey: 'extras', 
    required: false, // Not required, so user can skip
    allowMultiple: true, // This question allows multiple selections
    options: [
      { value: 'geen', label: 'Geen extra\'s', costMapping: { type: 'fixed', amount: 0, categoryLabel: 'Extras' }, priceIndication: 'Geen meerkosten' },
      { value: 'kookeiland', label: 'Kookeiland (basis)', costMapping: { type: 'fixed', amount: 2500, categoryLabel: 'Extra: Kookeiland' }, priceIndication: '+ €2500' },
      { value: 'quooker', label: 'Quooker (kokendwaterkraan)', costMapping: { type: 'fixed', amount: 1200, categoryLabel: 'Extra: Quooker' }, priceIndication: '+ €1200' },
      { value: 'bar', label: 'Bar aan werkblad/eiland', costMapping: { type: 'fixed', amount: 700, categoryLabel: 'Extra: Bar' }, priceIndication: '+ €700' },
    ],
  },
];