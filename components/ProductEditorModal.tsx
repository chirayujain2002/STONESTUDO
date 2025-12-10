import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { CatalogueProduct } from '../types';
import { Icon } from './Icon';
import Spinner from './Spinner';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: CatalogueProduct) => void;
  existingProduct?: CatalogueProduct | null;
}

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ isOpen, onClose, onSave, existingProduct }) => {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [color, setColor] = useState('');
  const [finish, setFinish] = useState<'Polished' | 'Unpolished'>('Polished');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setImageUrl(existingProduct.imageUrl);
      setColor(existingProduct.color || '');
      setFinish(existingProduct.finish || 'Polished');
      setWidth(existingProduct.width?.toString() || '');
      setHeight(existingProduct.height?.toString() || '');
    } else {
      resetForm();
    }
  }, [existingProduct]);
  
  if (!isOpen) return null;
  
  const resetForm = () => {
    setName('');
    setImageUrl(null);
    setColor('');
    setFinish('Polished');
    setWidth('');
    setHeight('');
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!imageUrl) {
      setError("A product image is required.");
      return;
    }
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    
    const newProduct: CatalogueProduct = {
      id: existingProduct?.id || Date.now().toString(),
      name: name.trim(),
      imageUrl: imageUrl,
      color: color.trim() || undefined,
      finish: finish,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
    };
    
    onSave(newProduct);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="p-5 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-text-main">
            {existingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <Icon name="close" className="w-6 h-6 text-gray-500"/>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
                {imageUrl ? (
                    <div className="relative group w-48 h-48 rounded-lg overflow-hidden border">
                       <img src={imageUrl} alt="Product" className="w-full h-full object-cover"/>
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
                            className="w-48 h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors hover:border-brand-primary hover:bg-gray-50"
                        >
                            {isUploading ? <Spinner/> : <Icon name="upload" className="w-8 h-8 text-gray-400"/>}
                            <span className="text-sm mt-2 text-gray-500">{isUploading ? 'Loading...' : 'Upload Image'}</span>
                        </button>
                    </>
                )}
            </div>
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
                  <input type="text" id="color" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g., Beige, Charcoal" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
                <div>
                  <label htmlFor="finish" className="block text-sm font-medium text-gray-700">Finish</label>
                  <select id="finish" value={finish} onChange={e => setFinish(e.target.value as any)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                      <option>Polished</option>
                      <option>Unpolished</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width (mm)</label>
                    <input type="number" id="width" value={width} onChange={e => setWidth(e.target.value)} placeholder="e.g., 600" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
                 <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (mm)</label>
                    <input type="number" id="height" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g., 600" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"/>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
        </main>
        <footer className="p-5 border-t bg-gray-50 flex justify-end items-center rounded-b-2xl flex-shrink-0">
            <div className="flex items-center space-x-4">
                <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black">Cancel</button>
                <button onClick={handleSave} disabled={!name.trim() || !imageUrl} className="px-5 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-400">
                    {existingProduct ? 'Save Changes' : 'Add to Catalogue'}
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default ProductEditorModal;
