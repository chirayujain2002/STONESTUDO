import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import { RoomType, DetectedObject } from '../types';
import RoomSelector from './RoomSelector';
import DesignStudio from './DesignStudio';
import { analyzeRoom, validateImage } from '../services/geminiService';
import StockManager from './StockManager';
import { Icon } from './Icon';
import Spinner from './Spinner';
import CatalogueBuilder from './CatalogueBuilder';

const MainPage: React.FC = () => {
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
  const [isCatalogueBuilderOpen, setIsCatalogueBuilderOpen] = useState(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoomSelect = (selectedRoomType: RoomType) => {
    setRoomType(selectedRoomType);
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && roomType) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setValidationError(null);
        setIsValidating(true);
        setError(null);
        try {
          const validation = await validateImage(result, 'room');
          if (validation.isValid) {
            handleImageUploadAndAnalyze(result);
          } else {
            setValidationError(validation.reason);
            setRoomType(null); 
          }
        } catch (err) {
          setError("An error occurred during image validation. Please try again.");
          setRoomType(null);
        } finally {
          setIsValidating(false);
        }
      };
      reader.readAsDataURL(file);
    }
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleImageUploadAndAnalyze = useCallback(async (imageDataUrl: string) => {
    if (!roomType) return;
    setOriginalImage(imageDataUrl);
    setIsAnalyzing(true);
    setError(null);
    try {
      const objects = await analyzeRoom(imageDataUrl, roomType);
      setDetectedObjects(objects);
    } catch (err) {
      setError('Failed to analyze the image. Please try a different photo or check your API key.');
      console.error(err);
      setOriginalImage(null);
      setDetectedObjects([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [roomType]);

  const handleStartOver = () => {
    setRoomType(null);
    setOriginalImage(null);
    setDetectedObjects([]);
    setError(null);
    setValidationError(null);
  };
  
  const renderContent = () => {
    if (originalImage && roomType) {
      return (
        <DesignStudio
          image={originalImage}
          detectedObjects={detectedObjects}
          onStartOver={handleStartOver}
          roomType={roomType}
          isAnalyzing={isAnalyzing}
          onClearImage={() => {
            setOriginalImage(null);
            setDetectedObjects([]);
          }}
        />
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-4" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={isValidating} />

        <div className="w-full max-w-3xl bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/50">
             {(isValidating || isAnalyzing) ? (
                 <div className="flex flex-col items-center justify-center text-center h-64">
                    <Spinner className="h-12 w-12 text-brand-primary" />
                    <p className="mt-6 text-xl font-semibold text-text-main">
                        {isValidating ? 'Validating your image...' : 'Analyzing your space...'}
                    </p>
                    <p className="mt-2 text-text-secondary">This will just take a moment.</p>
                </div>
            ) : validationError ? (
                 <div className="text-center h-64 flex flex-col justify-center items-center">
                    <Icon name="close" className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-red-700">Upload Failed</h2>
                    <p className="text-red-600 mt-2 mb-6">{validationError}</p>
                    <button 
                        onClick={() => {
                            setValidationError(null);
                            setRoomType(null);
                        }}
                        className="bg-brand-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-brand-primary-hover transition-colors"
                    >
                        Try Again
                    </button>
                 </div>
            ) : (
                <RoomSelector 
                    onSelectRoom={handleRoomSelect} 
                    onManageStock={() => setIsStockManagerOpen(true)}
                    onCreateCatalogue={() => setIsCatalogueBuilderOpen(true)}
                />
            )}
        </div>
      </div>
    );
  };

  return (
    <>
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative m-4 flex-shrink-0" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {renderContent()}
      </main>
      <StockManager isOpen={isStockManagerOpen} onClose={() => setIsStockManagerOpen(false)} />
      <CatalogueBuilder isOpen={isCatalogueBuilderOpen} onClose={() => setIsCatalogueBuilderOpen(false)} />
    </>
  );
};

export default MainPage;