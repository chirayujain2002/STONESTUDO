import React from 'react';
import { RoomType } from '../types';
import { Icon } from './Icon';

interface RoomSelectorProps {
  onSelectRoom: (roomType: RoomType) => void;
  onManageStock: () => void;
  onCreateCatalogue: () => void;
}

const RoomSelector: React.FC<RoomSelectorProps> = ({ onSelectRoom, onManageStock, onCreateCatalogue }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl lg:text-4xl font-bold text-text-main mb-2">Visualize Your Floor in Seconds</h2>
      <p className="text-lg text-text-secondary mb-8">Upload a photo of your room to see how new flooring will look.</p>
      
      <button
        onClick={() => onSelectRoom(RoomType.LIVING_ROOM)} // Use a default room type to trigger file upload
        className="w-full max-w-sm mx-auto bg-brand-primary text-white font-bold py-4 px-4 rounded-xl text-lg hover:bg-brand-primary-hover transition duration-300 flex items-center justify-center space-x-3 shadow-lg"
      >
        <Icon name="upload" className="w-6 h-6"/>
        <span>Upload Photo & Visualize</span>
      </button>

      <div className="mt-10 pt-6 border-t border-ui-border text-center">
          <p className="text-text-secondary mb-4">Or, manage your professional assets first.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
                onClick={onManageStock}
                className="font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors inline-flex items-center space-x-2 group"
            >
                <span>Manage My Stock Library</span>
                <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
            </button>
             <span className="text-gray-300 hidden sm:inline">|</span>
            <button
                onClick={onCreateCatalogue}
                className="font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors inline-flex items-center space-x-2 group"
            >
                <span>Create Product Catalogue</span>
                <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
            </button>
          </div>
      </div>
    </div>
  );
};

export default RoomSelector;