import React, { useState, useEffect, useCallback } from 'react';
import { MaterialOption } from '../types';
import { Icon } from './Icon';
import MaterialUploadModal from './MaterialUploadModal';
import { getStoredMaterials, saveStoredMaterial, deleteStoredMaterial } from '../services/storageService';

interface StockManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const StockManager: React.FC<StockManagerProps> = ({ isOpen, onClose }) => {
  const [stock, setStock] = useState<MaterialOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialOption | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      const materials = await getStoredMaterials();
      setStock(materials.reverse()); // Newest first
    } catch (error) {
      console.error("Failed to load stock from DB", error);
      setStock([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStock();
    }
  }, [isOpen, fetchStock]);

  if (!isOpen) {
      return null;
  }

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  }

  const handleOpenEditModal = (material: MaterialOption) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  }

  const handleSaveMaterial = async (material: MaterialOption) => {
    setStock(currentStock => {
      const existingIndex = currentStock.findIndex(m => m.id === material.id);
      if (existingIndex > -1) {
        const updated = [...currentStock];
        updated[existingIndex] = material;
        return updated;
      } else {
        return [material, ...currentStock];
      }
    });

    try {
        await saveStoredMaterial(material);
    } catch (error) {
        console.error("Failed to save stock to DB", error);
    }
  };

  const handleDeleteMaterial = async (materialToDelete: MaterialOption) => {
    if(window.confirm(`Are you sure you want to delete "${materialToDelete.name}"?`)) {
        setStock(currentStock => currentStock.filter(m => m.id !== materialToDelete.id));
        try {
            await deleteStoredMaterial(materialToDelete.id);
        } catch (error) {
            console.error("Failed to delete stock from DB", error);
        }
    }
  };

  const handleDeleteSavedDesign = async (materialId: string, designUrlToDelete: string) => {
    let updatedMaterial: MaterialOption | undefined;

    setStock(currentStock => {
        const updatedStock = currentStock.map(material => {
            if (material.id === materialId) {
                const updatedDesigns = material.savedDesigns?.filter(url => url !== designUrlToDelete);
                updatedMaterial = { ...material, savedDesigns: updatedDesigns };
                return updatedMaterial;
            }
            return material;
        });
        return updatedStock;
    });

    if (updatedMaterial) {
        try {
            await saveStoredMaterial(updatedMaterial);
        } catch (error) {
            console.error("Failed to update stock in DB", error);
        }
    }
  };

  const handleDownloadDesign = (designUrl: string, materialName: string, index: number) => {
    const link = document.createElement('a');
    link.href = designUrl;
    const safeMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Stone_Studio_${safeMaterialName}_example_${index + 1}.png`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
         <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
            <header className="p-4 sm:p-5 border-b flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
                <h1 className="text-xl font-bold text-text-main">My Stock Library</h1>
                <div className="flex items-center space-x-4">
                    <button onClick={handleOpenAddModal} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-primary-hover transition duration-300 flex items-center justify-center space-x-2 shadow-sm">
                        <Icon name="plus" className="w-5 h-5" />
                        <span>Add New Material</span>
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
                        <Icon name="close" className="w-6 h-6 text-gray-500"/>
                    </button>
                </div>
            </header>
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {stock.length === 0 ? (
                <div className="text-center h-full flex flex-col justify-center items-center">
                    <div className="bg-white p-8 rounded-full border-8 border-gray-100 mb-6">
                        <Icon name="layers" className="w-16 h-16 text-gray-300 mx-auto"/>
                    </div>
                    <h2 className="text-2xl font-semibold text-text-main">Your Stock Library is Empty</h2>
                    <p className="text-text-secondary mt-2 mb-6 max-w-sm mx-auto">Upload your own material swatches to visualize them directly in your room photos.</p>
                     <button onClick={handleOpenAddModal} className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg text-md hover:bg-brand-primary-hover transition duration-300 flex items-center justify-center space-x-2 shadow-lg">
                        <Icon name="plus" className="w-5 h-5" />
                        <span>Add Your First Material</span>
                    </button>
                </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {stock.map((material) => (
                    <div key={material.id} className="bg-white rounded-xl shadow-sm border border-ui-border group flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="relative">
                            <div className="aspect-square bg-gray-100">
                                <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover"/>
                            </div>
                            <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenEditModal(material)}
                                    className="bg-white/50 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-gray-700 hover:text-white shadow-md"
                                    aria-label={`Edit ${material.name}`}
                                >
                                    <Icon name="edit" className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteMaterial(material)}
                                    className="bg-red-500/80 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-500 shadow-md"
                                    aria-label={`Delete ${material.name}`}
                                >
                                    <Icon name="trash" className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-text-main truncate" title={material.name}>{material.name}</h3>
                            <p className="text-sm text-text-secondary">{material.category} / {material.subCategory}</p>
                            <div className="text-sm text-text-secondary mt-3 space-y-2">
                                {material.price && (
                                    <div className="flex items-center space-x-2">
                                        <Icon name="tag" className="w-4 h-4 text-gray-400" />
                                        <span>${material.price}</span>
                                    </div>
                                )}
                                {(material.height || material.width) && (
                                    <div className="flex items-center space-x-2">
                                        <Icon name="pencil-ruler" className="w-4 h-4 text-gray-400" />
                                        <span>{material.width || 'N/A'}mm x {material.height || 'N/A'}mm</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {material.savedDesigns && material.savedDesigns.length > 0 && (
                            <div className="p-4 border-t mt-auto">
                                <h4 className="text-xs font-bold text-text-secondary mb-2 uppercase">Saved Examples</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {material.savedDesigns.map((designUrl, index) => (
                                        <div key={index} className="relative group/design aspect-square bg-gray-100 rounded-md overflow-hidden">
                                            <img src={designUrl} alt={`Saved design ${index + 1}`} className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/design:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                <button onClick={() => setViewingImage(designUrl)} className="bg-white/80 text-gray-800 p-1.5 rounded-full hover:bg-white shadow-md" aria-label="View saved design">
                                                    <Icon name="fullscreen" className="w-4 h-4"/>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadDesign(designUrl, material.name, index); }} className="bg-white/80 text-gray-800 p-1.5 rounded-full hover:bg-white shadow-md" aria-label="Download saved design">
                                                    <Icon name="download" className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => handleDeleteSavedDesign(material.id, designUrl)} className="bg-white/80 text-red-600 p-1.5 rounded-full hover:bg-white shadow-md" aria-label="Delete saved design">
                                                    <Icon name="trash" className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
                )}
            </main>
        </div>
      </div>
      {isModalOpen && (
          <MaterialUploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveMaterial}
            existingMaterial={editingMaterial}
          />
      )}
       {viewingImage && (
        <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-zoom-out" 
            onClick={() => setViewingImage(null)}
            role="dialog"
            aria-modal="true"
        >
            <button 
                onClick={() => setViewingImage(null)} 
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
                aria-label="Close image viewer"
            >
                <Icon name="close" className="w-8 h-8"/>
            </button>
            <img 
                src={viewingImage} 
                alt="Saved design preview" 
                className="max-w-full max-h-full object-contain rounded-lg cursor-default" 
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}
    </>
  );
};

export default StockManager;
