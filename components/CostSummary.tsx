

import React from 'react';
import type { EstimatedCost, ChosenOptionSummary } from '../types';
import { VisualPreview } from './VisualPreview';
import { EditIcon, RestartIcon, CalendarDaysIcon, CubeTransparentIcon, BookOpenIcon } from './icons/ActionIcons';
import { ChevronRightIcon } from './icons/NavigationIcons'; // Corrected path

interface CostSummaryProps {
  estimatedCost: EstimatedCost;
  // chosenOptions: ChosenOptionSummary[]; // Kept for potential future use, but save button is removed
  visualPreviewUrl: string;
  onEdit: () => void;
  onRestart: () => void;
  onContact: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const CostSummary: React.FC<CostSummaryProps> = ({ estimatedCost, visualPreviewUrl, onEdit, onRestart, onContact }) => {
  
  const handlePlannerRedirect = () => {
    alert("Doorverwijzing naar 3D Keukenplanner (Demo)...");
    // In a real app: window.location.href = 'https://your-planner-url.com';
  };

  const handleMagazineSignup = () => {
    alert("Magazine aanvraagformulier wordt geopend (Demo)...");
    // In a real app: // Potentially open contact modal with different context, or redirect
    // onContact(); // Example: Reuse contact modal
  };

  const costBreakdownItems = estimatedCost.breakdown
    .filter(item => item.categoryKey !== 'gebruiker')
    .filter(item => item.cost !== 0 || item.details?.includes('m²') || (item.categoryKey === 'kwaliteit' && item.details?.includes('x')));

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-700">Uw Kostenraming</h2>
      </div>

      {/* Estimated Total Cost */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-sky-700">Geschatte Totale Kosten</h3>
        <p className="text-3xl sm:text-4xl font-bold text-cyan-600">{formatCurrency(estimatedCost.total)}</p>
      </div>

      {/* Primary CTA: "Maak nu een afspraak" Button */}
      <div className="mt-4 flex justify-center">
        <button
            onClick={onContact}
            className="flex items-center justify-center gap-2 w-full max-w-md mx-auto px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-lg transition-colors text-base"
        >
            <CalendarDaysIcon className="w-5 h-5" /> Maak nu een afspraak
        </button>
      </div>

      {/* Secondary CTAs: 3D Planner & Magazine */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        <button
            onClick={handlePlannerRedirect}
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-white border-2 border-sky-500 text-sky-600 hover:bg-sky-50 font-semibold rounded-lg shadow-md transition-colors text-sm"
        >
            <CubeTransparentIcon className="w-5 h-5" /> Ga naar de 3D Keukenplanner
        </button>
        <button
            onClick={handleMagazineSignup}
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 font-semibold rounded-lg shadow-md transition-colors text-sm"
        >
            <BookOpenIcon className="w-5 h-5" /> Ontvang inspiratiemagazine
        </button>
      </div>


      {/* Visual Preview Section - Collapsible */}
      <details className="bg-white p-3 md:p-4 rounded-xl shadow-lg border border-gray-200 group mt-5" open>
        <summary className="list-none flex justify-between items-center cursor-pointer group-open:mb-3">
          <h3 className="text-md sm:text-lg font-semibold text-sky-700">Visuele Impressie</h3>
          <ChevronRightIcon className="w-5 h-5 text-sky-600 group-open:rotate-90 transition-transform duration-200" />
        </summary>
        <div className="max-w-sm mx-auto lg:max-w-none">
          <VisualPreview imageUrl={visualPreviewUrl} altText="Gekozen keukenstijl" />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">Representatieve afbeelding.</p>
      </details>

      {/* Cost Breakdown Table Section - Collapsible */}
      <details className="bg-white p-3 md:p-4 rounded-xl shadow-lg border border-gray-200 group" open>
        <summary className="list-none flex justify-between items-center cursor-pointer group-open:mb-3">
          <h4 className="text-md sm:text-lg font-semibold text-sky-700">Kosten Uitsplitsing</h4>
          <ChevronRightIcon className="w-5 h-5 text-sky-600 group-open:rotate-90 transition-transform duration-200" />
        </summary>
        <div className="overflow-x-auto"> {/* Removed max-h-72 and custom-scrollbar */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"> {/* Removed sticky top-0 z-10 */}
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Omschrijving
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kosten
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costBreakdownItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-normal text-sm text-slate-700">
                    {item.label}
                    {item.details && <em className="text-gray-500 text-xs block sm:inline sm:ml-1">({item.details})</em>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-800 font-semibold text-right">
                    {(item.categoryKey === 'kwaliteit' && item.details?.includes('x')) || (item.categoryKey === 'algemeen' && item.details?.includes('m²'))
                      ? '' 
                      : formatCurrency(item.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {costBreakdownItems.length === 0 && (
            <p className="text-gray-500 mt-2 text-sm">Geen kostenspecificaties beschikbaar.</p>
        )}
      </details>
      
      {/* Tertiary Action Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 border border-gray-300 font-medium rounded-md shadow-sm transition-colors text-sm"
        >
          <EditIcon className="w-4 h-4" /> Aanpassen
        </button>
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium rounded-md shadow-sm transition-colors text-sm"
        >
          <RestartIcon className="w-4 h-4" /> Opnieuw
        </button>
      </div>
      {/* Removed style block for custom-scrollbar */}
    </div>
  );
};