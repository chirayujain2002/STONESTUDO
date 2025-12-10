import React, { useState, useEffect, useCallback } from 'react';
import { CatalogueProduct } from '../types';
import { Icon } from './Icon';
import ProductEditorModal from './ProductEditorModal';
import jsPDF from 'jspdf';
import Spinner from './Spinner';
import { getStoredProducts, saveStoredProduct, deleteStoredProduct } from '../services/storageService';

interface CatalogueBuilderProps {
    isOpen: boolean;
    onClose: () => void;
}

const CatalogueBuilder: React.FC<CatalogueBuilderProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogueProduct | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);


  const fetchProducts = useCallback(async () => {
    try {
      const storedProducts = await getStoredProducts();
      setProducts(storedProducts.reverse()); // Newest first
    } catch (error) {
      console.error("Failed to load catalogue from DB", error);
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setSelectedProductIds([]); // Reset selection when opening
    }
  }, [isOpen, fetchProducts]);

  if (!isOpen) {
      return null;
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  const handleOpenEditModal = (product: CatalogueProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  const handleSaveProduct = async (product: CatalogueProduct) => {
    setProducts(currentProducts => {
      const existingIndex = currentProducts.findIndex(p => p.id === product.id);
      if (existingIndex > -1) {
        const updated = [...currentProducts];
        updated[existingIndex] = product;
        return updated;
      } else {
        return [product, ...currentProducts];
      }
    });

    try {
        await saveStoredProduct(product);
    } catch (error) {
        console.error("Failed to save product to DB", error);
    }
  };

  const handleDeleteProduct = async (productToDelete: CatalogueProduct) => {
    if(window.confirm(`Are you sure you want to delete "${productToDelete.name}"?`)) {
        setProducts(currentProducts => currentProducts.filter(p => p.id !== productToDelete.id));
        setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
        try {
            await deleteStoredProduct(productToDelete.id);
        } catch (error) {
            console.error("Failed to delete product from DB", error);
        }
    }
  };
  
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
  };

  const handleExportPdf = async () => {
    const productsToExport = products.filter(p => selectedProductIds.includes(p.id));
    if (productsToExport.length === 0) return;

    setIsExporting(true);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const productsPerPage = 2;

    // --- Title Page ---
    doc.setFillColor(249, 250, 251); // ui-bg
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // text-main
    doc.text('Product Catalogue', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(107, 114, 128); // text-secondary
    doc.text('Stone Studio', pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    for (let i = 0; i < productsToExport.length; i++) {
        const pageIndex = Math.floor(i / productsPerPage);
        const indexOnPage = i % productsPerPage;

        if (indexOnPage === 0) {
            doc.addPage();
        }

        const product = productsToExport[i];
        const productSectionHeight = (pageHeight - (margin*2)) / productsPerPage;
        const productYStart = margin + (indexOnPage * productSectionHeight);
        
        const targetImageHeightMM = productSectionHeight * 0.65;
        const targetImageWidthMM = contentWidth;

        try {
            const img = await loadImage(product.imageUrl);
            
            const DPI = 300;
            const scaleFactor = DPI / 25.4; // pixels per mm

            const canvas = document.createElement('canvas');
            const canvasWidth = Math.round(targetImageWidthMM * scaleFactor);
            const canvasHeight = Math.round(targetImageHeightMM * scaleFactor);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const canvasRatio = canvasWidth / canvasHeight;
                const imgRatio = img.naturalWidth / img.naturalHeight;
                let sx, sy, sWidth, sHeight;

                // "object-fit: cover" logic
                if (imgRatio > canvasRatio) { // Image is wider than the target box
                    sHeight = img.naturalHeight;
                    sWidth = sHeight * canvasRatio;
                    sx = (img.naturalWidth - sWidth) / 2;
                    sy = 0;
                } else { // Image is taller than or same aspect ratio as the target box
                    sWidth = img.naturalWidth;
                    sHeight = sWidth / canvasRatio;
                    sx = 0;
                    sy = (img.naturalHeight - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
                const croppedImageDataUrl = canvas.toDataURL('image/png');
                
                const imgX = margin;
                const imgY = productYStart;
                
                doc.addImage(croppedImageDataUrl, 'PNG', imgX, imgY, targetImageWidthMM, targetImageHeightMM);
            } else {
                 // Fallback for safety, though unlikely to fail
                doc.addImage(img, 'PNG', margin, productYStart, targetImageWidthMM, targetImageHeightMM);
            }
            
            let textY = productYStart + targetImageHeightMM + 12;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            const splitName = doc.splitTextToSize(product.name, contentWidth);
            doc.text(splitName, margin, textY);
            textY += (splitName.length * 6) + 5;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(199, 21, 133); // Dark Red color for details

            const details = [
                { label: 'Color', value: product.color },
                { label: 'Finish', value: product.finish },
                { label: 'Dimensions', value: (product.width || product.height) ? `${product.width || 'N/A'}mm x ${product.height || 'N/A'}mm` : undefined }
            ];

            details.forEach(detail => {
                if (detail.value) {
                    const detailText = `${detail.label}: ${detail.value}`;
                    doc.text(detailText, margin, textY);
                    textY += 7;
                }
            });

        } catch (error) {
            console.error(`Could not load image for ${product.name}`, error);
            const imageYPos = productYStart;
            const targetImageHeightMM = productSectionHeight * 0.65;
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, imageYPos, contentWidth, targetImageHeightMM, 'F');
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Image not found', margin + contentWidth / 2, imageYPos + targetImageHeightMM / 2, { align: 'center' });
        }

        if (indexOnPage < productsPerPage - 1 && i < productsToExport.length -1) {
             doc.setDrawColor(229, 231, 235); // ui-border
             const lineY = productYStart + productSectionHeight - 2;
             doc.line(margin, lineY, contentWidth + margin, lineY);
        }
    }

    doc.deletePage(1); // Delete the initial blank page created by jsPDF
    doc.save('Stone_Studio_Catalogue.pdf');
    setIsExporting(false);
  };
  
  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProductIds(products.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds([]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
         <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
            <header className="p-4 sm:p-5 border-b flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
                <div>
                  <h1 className="text-xl font-bold text-text-main">Catalogue Builder</h1>
                  <p className="text-sm text-text-secondary">Select products to include in your PDF export.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={handleOpenAddModal} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-primary-hover transition duration-300 flex items-center justify-center space-x-2 shadow-sm">
                        <Icon name="plus" className="w-5 h-5" />
                        <span>Add New Product</span>
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
                        <Icon name="close" className="w-6 h-6 text-gray-500"/>
                    </button>
                </div>
            </header>
            
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center space-x-2">
                    <button onClick={handleSelectAll} disabled={products.length === 0} className="text-xs font-semibold text-gray-600 hover:text-black disabled:opacity-50">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={handleDeselectAll} disabled={selectedProductIds.length === 0} className="text-xs font-semibold text-gray-600 hover:text-black disabled:opacity-50">Deselect All</button>
                </div>
                <button 
                    onClick={handleExportPdf}
                    disabled={selectedProductIds.length === 0 || isExporting}
                    className="text-sm font-semibold flex items-center space-x-2 bg-brand-primary text-white px-4 py-2 rounded-lg shadow-sm border border-transparent disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-colors"
                >
                     {isExporting ? <Spinner className="w-5 h-5" /> : <Icon name="document" className="w-5 h-5"/>}
                    <span>{isExporting ? 'Exporting...' : `Export ${selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''} as PDF`}</span>
                </button>
            </div>

            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {products.length === 0 ? (
                <div className="text-center h-full flex flex-col justify-center items-center">
                    <div className="bg-white p-8 rounded-full border-8 border-gray-100 mb-6">
                        <Icon name="book" className="w-16 h-16 text-gray-300 mx-auto"/>
                    </div>
                    <h2 className="text-2xl font-semibold text-text-main">Your Catalogue is Empty</h2>
                    <p className="text-text-secondary mt-2 mb-6 max-w-sm mx-auto">Add products to create a professional catalogue that you can share with clients.</p>
                     <button onClick={handleOpenAddModal} className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg text-md hover:bg-brand-primary-hover transition duration-300 flex items-center justify-center space-x-2 shadow-lg">
                        <Icon name="plus" className="w-5 h-5" />
                        <span>Add Your First Product</span>
                    </button>
                </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id);
                      return (
                      <div 
                        key={product.id} 
                        onClick={() => handleToggleSelectProduct(product.id)}
                        className={`bg-white rounded-xl shadow-sm border group flex flex-col transition-all duration-300 cursor-pointer ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' : 'border-ui-border hover:shadow-lg hover:-translate-y-1'}`}
                      >
                        <div className="relative">
                            <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                            </div>
                            <div 
                              className={`absolute top-3 right-3 flex flex-col space-y-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
                            >
                                <button 
                                    onClick={() => handleOpenEditModal(product)}
                                    className="bg-white/50 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-gray-700 hover:text-white shadow-md"
                                    aria-label={`Edit ${product.name}`}
                                >
                                    <Icon name="edit" className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteProduct(product)}
                                    className="bg-red-500/80 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-500 shadow-md"
                                    aria-label={`Delete ${product.name}`}
                                >
                                    <Icon name="trash" className="w-5 h-5"/>
                                </button>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 left-3 bg-brand-primary text-white rounded-full p-1.5 shadow-md">
                                <Icon name="check" className="w-4 h-4" />
                              </div>
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-text-main truncate" title={product.name}>{product.name}</h3>
                                <div className="text-sm text-text-secondary mt-2 space-y-1">
                                    {product.color && <p>Color: {product.color}</p>}
                                    {product.finish && <p>Finish: {product.finish}</p>}
                                </div>
                            </div>
                             {(product.height || product.width) && (
                                <div className="flex items-center space-x-2 text-sm text-text-secondary mt-3 pt-3 border-t">
                                    <Icon name="pencil-ruler" className="w-4 h-4 text-gray-400" />
                                    <span>{product.width || 'N/A'}mm x {product.height || 'N/A'}mm</span>
                                </div>
                            )}
                        </div>
                      </div>
                      )
                    })}
                </div>
                )}
            </main>
        </div>
      </div>
      {isModalOpen && (
          <ProductEditorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProduct}
            existingProduct={editingProduct}
          />
      )}
    </>
  );
};

export default CatalogueBuilder;
