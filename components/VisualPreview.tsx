import React from 'react';

interface VisualPreviewProps {
  imageUrl: string;
  altText?: string;
}

export const VisualPreview: React.FC<VisualPreviewProps> = ({ imageUrl, altText = "Keuken visualisatie" }) => {
  return (
    <div className="w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-inner">
      <img 
        src={imageUrl} 
        alt={altText} 
        className="w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-0"
        onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
        onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/600x400/e2e8f0/94a3b8?text=Afbeelding+niet+beschikbaar'; // Light theme placeholder
            target.alt = 'Afbeelding niet beschikbaar';
            target.style.opacity = '1';
        }}
        loading="lazy"
      />
    </div>
  );
};