
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { MaterialOption } from '../types';
import { CATEGORY_STRUCTURE } from '../constants';
import { Icon } from './Icon';
import Spinner from './Spinner';
import { validateImage, cleanMaterialImage } from '../services/geminiService';

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: MaterialOption) => void;
  existingMaterial?: MaterialOption | null;
  initialCategory?: 'Marble' | 'Granite' | 'Tiles';
  initialSubCategory?: string;
}

const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingMaterial,
  initialCategory = 'Marble',
  initialSubCategory,
}) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<'Marble' | 'Granite' | 'Tiles'>(initialCategory);
  const [subCategory, setSubCategory] = useState<string>('');
  const [price, setPrice] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!existingMaterial;

  useEffect(() => {
    if (existingMaterial) {
      setName(existingMaterial.name);
      setPrompt(existingMaterial.prompt);
      setImageUrl(existingMaterial.imageUrl);
      setCategory(existingMaterial.category || 'Marble');
      setSubCategory(existingMaterial.subCategory || '');
      setPrice(existingMaterial.price?.toString() || '');
      setWidth(existingMaterial.width?.toString() || '');
      setHeight(existingMaterial.height?.toString() || '');
    } else {
      resetForm();
      setCategory(initialCategory);
      setSubCategory(initialSubCategory || CATEGORY_STRUCTURE[initialCategory]?.[0] || '');
    }
  }, [existingMaterial, initialCategory, initialSubCategory]);

  useEffect(() => {
    // When category changes, reset subCategory if it's not valid for the new category
    const validSubCategories = CATEGORY_STRUCTURE[category];
    if (subCategory && validSubCategories && !validSubCategories.includes(subCategory)) {
      setSubCategory(validSubCategories[0] || '');
    }
  }, [category, subCategory]);


  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPrompt('');
    setImageUrl(null);
    setCategory(initialCategory);
    setSubCategory(initialSubCategory || '');
    setPrice('');
    setWidth('');
    setHeight('');
    setError(null);
    setIsUploading(false);
    setIsValidating(false);
    setIsCleaning(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setIsUploading(false);
        setIsValidating(true);
        try {
          const validation = await validateImage(dataUrl, 'material');
          if (!validation.isValid) {
            setError(validation.reason);
            setImageUrl(null);
            setIsValidating(false);
            return;
          }
          
          setIsValidating(false);
          setIsCleaning(true);
          const cleanedImageUrl = await cleanMaterialImage(dataUrl);
          setImageUrl(cleanedImageUrl);
          setError(null);

        } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : "An error occurred during image processing.";
          setError(errorMessage);
          setImageUrl(null);
        } finally {
          setIsValidating(false);
          setIsCleaning(false);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleSave = () => {
    if (!imageUrl) {
      setError("An image is required.");
      return;
    }
    if (!name.trim()) {
      setError("Material name is required.");
      return;
    }

    let newMaterial: MaterialOption;

    if (isEditMode) {
       if (!prompt.trim()) {
        setError("A descriptive prompt for the AI is required.");
        return;
      }
      if (!category || !subCategory) {
          setError("Category and Sub-Category must be selected.");
          return;
      }
      newMaterial = {
        id: existingMaterial.id,
        name: name.trim(),
        prompt: prompt.trim(),
        imageUrl: imageUrl,
        category: category,
        subCategory: subCategory,
        price: price ? parseFloat(price) : undefined,
        width: width ? parseFloat(width) : undefined,
        height: height ? parseFloat(height) : undefined,
        savedDesigns: existingMaterial.savedDesigns || [],
      };
    } else {
      newMaterial = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        prompt: name.trim(), // Automatically use name as prompt
        imageUrl: imageUrl,
        category: category,
        subCategory: subCategory,
      };
    }

    onSave(newMaterial);
    handleClose();
  };
  
  const subCategoriesForSelected = CATEGORY_STRUCTURE[category] || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-text-main">
            {isEditMode ? 'Edit Material' : 'Add New Material'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <Icon name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
            <div className={`grid grid-cols-1 ${isEditMode ? 'md:grid-cols-2' : ''} gap-6`}>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Material Swatch *</label>
                    {imageUrl ? (
                        <div className="relative group w-full aspect-square rounded-lg overflow-hidden border">
                           <img src={imageUrl} alt="Material Swatch" className="w-full h-full object-cover"/>
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => setImageUrl(null)} className="bg-white/80 text-red-600 p-2 rounded-full hover:bg-white">
                                    <Icon name="trash" className="w-5 h-5"/>
                                </button>
                           </div>
                        </div>
                    ) : (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isValidating || isCleaning}
                                className="w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors hover:border-brand-primary hover:bg-gray-50 disabled:cursor-wait"
                            >
                                {isUploading || isValidating || isCleaning ? <Spinner/> : <Icon name="upload" className="w-8 h-8 text-gray-400"/>}
                                <span className="text-sm mt-2 text-gray-500">{isUploading ? 'Uploading...' : isValidating ? 'Validating...' : isCleaning ? 'Optimizing Image...' : 'Upload Image'}</span>
                            </button>
                        </>
                    )}
                </div>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Material Name *</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Calacatta Gold Marble" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                    </div>

                    {isEditMode && (
                      <>
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">AI Prompt *</label>
                            <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="A short, descriptive prompt for the AI, e.g., 'white marble with thick grey and gold veins'." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value as any)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                    {Object.keys(CATEGORY_STRUCTURE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">Sub-Category *</label>
                                <select id="subCategory" value={subCategory} onChange={e => setSubCategory(e.target.value as any)} disabled={!category} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100">
                                    <option value="" disabled>Select...</option>
                                    {subCategoriesForSelected.map(subCat => <option key={subCat} value={subCat}>{subCat}</option>)}
                                </select>
                            </div>
                        </div>
                      </>
                    )}
                </div>
            </div>

            {isEditMode && (
              <div>
                  <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">Optional Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (USD)</label>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g., 120.50" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                      </div>
                      <div>
                          <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width (mm)</label>
                          <input type="number" id="width" value={width} onChange={e => setWidth(e.target.value)} placeholder="e.g., 600" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                      </div>
                      <div>
                          <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (mm)</label>
                          <input type="number" id="height" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g., 600" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                      </div>
                  </div>
              </div>
            )}


            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        </main>
        <footer className="p-5 border-t bg-gray-50 flex justify-end items-center rounded-b-2xl flex-shrink-0">
            <div className="flex items-center space-x-4">
                <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-400">
                    {isEditMode ? 'Save Changes' : 'Add Material'}
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default MaterialUploadModal;
