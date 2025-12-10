
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { DetectedObject, MaterialOption, RoomType, DesignHistoryItem } from '../types';
import { MATERIAL_OPTIONS, CATEGORY_STRUCTURE } from '../constants';
import { redesignObject, refineDesign } from '../services/geminiService';
import { getStoredMaterials, saveStoredMaterial } from '../services/storageService';
import Spinner from './Spinner';
import { Icon } from './Icon';
import MaterialUploadModal from './MaterialUploadModal';
import ChatAssistant from './ChatAssistant';

interface DesignStudioProps {
  image: string;
  detectedObjects: DetectedObject[];
  onStartOver: () => void;
  roomType: RoomType;
  isAnalyzing: boolean;
  onClearImage: () => void;
}

const filterCategories = ['Marble', 'Granite', 'Tiles'];

const DesignStudio: React.FC<DesignStudioProps> = ({ image, detectedObjects, onStartOver, roomType, isAnalyzing, onClearImage }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(image);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [isRedesigning, setIsRedesigning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userMaterials, setUserMaterials] = useState<MaterialOption[]>([]);
  const [lastAppliedMaterial, setLastAppliedMaterial] = useState<MaterialOption | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedMaterialForGeneration, setSelectedMaterialForGeneration] = useState<MaterialOption | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Marble');
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);
  const [isCombinationMode, setIsCombinationMode] = useState(false);
  const [combinationMaterials, setCombinationMaterials] = useState<MaterialOption[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // New State for History and Chat
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const materials = await getStoredMaterials();
        // Newest first
        setUserMaterials(materials.reverse());
      } catch (error) {
        console.error("Failed to load user materials from DB", error);
      }
    };
    loadMaterials();
  }, []);

  useEffect(() => {
    setPreviewImage(image);
    // Initialize history with original
    setHistory([{
        id: 'original',
        imageUrl: image,
        thumbnailUrl: image,
        timestamp: Date.now(),
        actionDescription: 'Original Photo'
    }]);

    if (image) {
      const floorObject = detectedObjects.find(obj => obj.label.toLowerCase() === 'floor');
      if (floorObject) {
        setSelectedObject(floorObject);
      }
    } else {
        setSelectedObject(null);
    }
  }, [image, detectedObjects]);

  useEffect(() => {
    if (isCombinationMode) {
      setSelectedMaterialForGeneration(null);
    } else {
      setCombinationMaterials([]);
    }
  }, [isCombinationMode]);

  const addToHistory = (newImageUrl: string, description: string) => {
    const newItem: DesignHistoryItem = {
        id: Date.now().toString(),
        imageUrl: newImageUrl,
        thumbnailUrl: newImageUrl, // In a real app, generate a small thumbnail here
        timestamp: Date.now(),
        actionDescription: description
    };
    setHistory(prev => [...prev, newItem]);
  };

  const handleRestoreHistory = (item: DesignHistoryItem) => {
      setPreviewImage(item.imageUrl);
      // If we go back to original, disable compare mode logic visually or reset it
      if (item.id === 'original') {
        setLastAppliedMaterial(null);
      }
  };

  const handleAddNewMaterial = async (newMaterial: MaterialOption) => {
    const updatedMaterials = [newMaterial, ...userMaterials];
    setUserMaterials(updatedMaterials);
    try {
      await saveStoredMaterial(newMaterial);
    } catch (error) {
      console.error("Failed to save new material to DB", error);
      setError("Could not save the new material.");
    }
    setIsUploadModalOpen(false);
  };

  const applyRedesign = useCallback(async (material: MaterialOption) => {
    if (!selectedObject || !image) return;
    
    const finalPrompt = material.prompt;
    const materialImageUrls = material.imageUrl ? [material.imageUrl] : [];
    if (!finalPrompt && materialImageUrls.length === 0) return;

    setCombinationMaterials([]);
    setIsCombinationMode(false);

    setIsRedesigning(true);
    setError(null);
    try {
      const newImage = await redesignObject(image, selectedObject.label, finalPrompt, materialImageUrls);
      setPreviewImage(newImage);
      setLastAppliedMaterial({ ...material, prompt: finalPrompt });
      handleToggleCompare(true);
      addToHistory(newImage, `Applied ${material.name}`);
    } catch (err) {
      setError(`Failed to apply ${material.name}. Please try again.`);
      console.error(err);
    } finally {
      setIsRedesigning(false);
    }
  }, [selectedObject, image]);

  const applyCombinationRedesign = useCallback(async () => {
    if (!selectedObject || !image || combinationMaterials.length < 2) return;

    setIsRedesigning(true);
    setError(null);
    setSelectedMaterialForGeneration(null);
    
    try {
        const materialUrls = combinationMaterials.map(m => m.imageUrl);
        const newImage = await redesignObject(image, selectedObject.label, "Create a beautiful, harmonious pattern.", materialUrls);
        setPreviewImage(newImage);
        setLastAppliedMaterial(null);
        handleToggleCompare(true);
        addToHistory(newImage, `Pattern with ${combinationMaterials.length} materials`);
    } catch (err) {
        setError(`Failed to apply combination. Please try again.`);
        console.error(err);
    } finally {
        setIsRedesigning(false);
    }
  }, [selectedObject, image, combinationMaterials]);

  const handleChatInstruction = async (message: string) => {
      if (!previewImage) return;
      setIsRedesigning(true);
      setError(null);
      try {
          const newImage = await refineDesign(previewImage, message);
          setPreviewImage(newImage);
          addToHistory(newImage, `AI Edit: ${message}`);
      } catch (err) {
          setError("Failed to refine design. Please try again.");
      } finally {
          setIsRedesigning(false);
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

  const exportPdf = async () => {
    if (!hasRedesigned || !lastAppliedMaterial || !selectedObject || !previewImage) return;
    
    setIsExportingPdf(true);
    setError(null);

    try {
        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const [redesignedImg, materialImg] = await Promise.all([
            loadImage(previewImage),
            loadImage(lastAppliedMaterial.imageUrl),
        ]);
        
        const pageAspectRatio = pageWidth / pageHeight;
        const imgAspectRatio = redesignedImg.naturalWidth / redesignedImg.naturalHeight;
        let imgWidth, imgHeight, imgX, imgY;

        if (imgAspectRatio > pageAspectRatio) {
            imgWidth = pageWidth;
            imgHeight = pageWidth / imgAspectRatio;
        } else {
            imgHeight = pageHeight;
            imgWidth = pageHeight * imgAspectRatio;
        }
        imgX = (pageWidth - imgWidth) / 2;
        imgY = (pageHeight - imgHeight) / 2;
        doc.addImage(redesignedImg, 'PNG', imgX, imgY, imgWidth, imgHeight);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Stone Studio', pageWidth - 15, pageHeight - 15, { align: 'right' });

        const circleRadius = pageWidth * 0.15;
        const circleCX = pageWidth * 0.75;
        const circleCY = pageHeight * 0.25;

        doc.saveGraphicsState();
        doc.circle(circleCX, circleCY, circleRadius);
        doc.clip('evenodd');
        doc.addImage(materialImg, 'PNG', circleCX - circleRadius, circleCY - circleRadius, circleRadius * 2, circleRadius * 2);
        doc.restoreGraphicsState();
        
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.circle(circleCX, circleCY, circleRadius);
        doc.stroke();

        const targetNormX = (selectedObject.boundingBox.x1 + selectedObject.boundingBox.x2) / 2;
        const targetNormY = (selectedObject.boundingBox.y1 + selectedObject.boundingBox.y2) / 2;
        
        const arrowEndX = (targetNormX * imgWidth) + imgX;
        const arrowEndY = (targetNormY * imgHeight) + imgY;
        
        const dx = arrowEndX - circleCX;
        const dy = arrowEndY - circleCY;
        const angle = Math.atan2(dy, dx);
        
        const arrowHeadSize = 10;
        const lineEndX = arrowEndX - Math.cos(angle) * arrowHeadSize;
        const lineEndY = arrowEndY - Math.sin(angle) * arrowHeadSize;

        const angleOffset = Math.PI / 64;
        const startRadius = circleRadius + 5;
        const arrowStartX1 = circleCX + Math.cos(angle - angleOffset) * startRadius;
        const arrowStartY1 = circleCY + Math.sin(angle - angleOffset) * startRadius;
        const arrowStartX2 = circleCX + Math.cos(angle + angleOffset) * startRadius;
        const arrowStartY2 = circleCY + Math.sin(angle + angleOffset) * startRadius;

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.line(arrowStartX1, arrowStartY1, lineEndX, lineEndY);
        doc.line(arrowStartX2, arrowStartY2, lineEndX, lineEndY);
        
        const p1x = arrowEndX, p1y = arrowEndY;
        const p2x = arrowEndX - arrowHeadSize * Math.cos(angle - Math.PI / 10);
        const p2y = arrowEndY - arrowHeadSize * Math.sin(angle - Math.PI / 10);
        const p3x = arrowEndX - arrowHeadSize * Math.cos(angle + Math.PI / 10);
        const p3y = arrowEndY - arrowHeadSize * Math.sin(angle + Math.PI / 10);
        doc.setFillColor(255, 255, 255);
        doc.triangle(p1x, p1y, p2x, p2y, p3x, p3y, 'F');

        const drawTextWithGlow = (text: string, x: number, y: number, options: any) => {
            // Black outline
            doc.setLineWidth(2);
            doc.setDrawColor(0, 0, 0);
            doc.setTextColor(0, 0, 0);
            doc.text(text, x, y, { ...options, stroke: true, fill: false });
            // White fill
            doc.setTextColor(255, 255, 255);
            doc.text(text, x, y, options);
        }
        
        doc.setFontSize(pageWidth * 0.028);
        doc.setFont('helvetica', 'bold');
        const materialName = lastAppliedMaterial.name.toUpperCase();
        drawTextWithGlow(materialName, circleCX, circleCY + circleRadius + 20, { align: 'center' });
        
        doc.setFontSize(pageWidth * 0.022);
        doc.setFont('helvetica', 'normal');
        
        const textX = arrowEndX - (Math.cos(angle) * 120);
        const textY = arrowEndY - (Math.sin(angle) * 120);
        
        const labelLine1 = `This floor has been visualized with`;
        const labelLine2 = `the selected material.`;

        drawTextWithGlow(labelLine1, textX, textY, { align: 'center' });
        drawTextWithGlow(labelLine2, textX, textY + 15, { align: 'center' });

        doc.save('stone_studio_design_presentation.pdf');

    } catch (err) {
        console.error("Failed to export PDF", err);
        setError("Could not generate PDF. An error occurred while loading images.");
    } finally {
        setIsExportingPdf(false);
    }
  };

  const resetChanges = () => {
    setPreviewImage(image);
    setLastAppliedMaterial(null);
    setSelectedMaterialForGeneration(null);
    setCombinationMaterials([]);
    setIsCombinationMode(false);
    setIsComparing(false);
    // Reset history tracking if desired, or keep it
  }

  const handleSliderMove = useCallback((clientX: number) => {
    if (!isDragging || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPosition((x / rect.width) * 100);
  }, [isDragging]);

  const handleToggleCompare = (forceOn?: boolean) => {
    setIsComparing(prev => {
        const nextState = forceOn !== undefined ? forceOn : !prev;
        if (nextState) { 
            setSliderPosition(50);
        }
        return nextState;
    });
  };

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => handleSliderMove(e.clientX);
    const touchMoveHandler = (e: TouchEvent) => handleSliderMove(e.touches[0].clientX);
    const stopDragging = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('touchmove', touchMoveHandler);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchend', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, handleSliderMove]);

  const handlePrimaryAction = () => {
    if (isCombinationMode && combinationMaterials.length >= 2) {
      applyCombinationRedesign();
      setIsMobilePanelOpen(false);
    } else if (!isCombinationMode && selectedMaterialForGeneration) {
      applyRedesign(selectedMaterialForGeneration);
      setIsMobilePanelOpen(false);
    }
  };

  const getPrimaryButtonState = () => {
    if (isRedesigning) {
      return { text: 'Generating...', icon: 'spinner', disabled: true, title: 'Generating your new design...' };
    }
    if (isCombinationMode) {
      if (combinationMaterials.length < 2) {
        return { text: 'Generate Pattern', icon: 'sparkles', disabled: true, title: 'Select at least 2 materials' };
      }
      return { text: `Generate Pattern (${combinationMaterials.length})`, icon: 'sparkles', disabled: false, title: 'Generate design with selected materials' };
    }
    if (!selectedMaterialForGeneration) {
      return { text: 'Visualize', icon: 'sparkles', disabled: true, title: 'Select a material to visualize the design' };
    }
    return { text: 'Visualize', icon: 'sparkles', disabled: false, title: 'Generate the new design' };
  };

  const buttonState = getPrimaryButtonState();

  const hasRedesigned = previewImage !== null && previewImage !== image;
  const roomMaterials = MATERIAL_OPTIONS[roomType] || [];
  
  const handleSelectMaterial = (material: MaterialOption) => {
    if (isCombinationMode) {
      setCombinationMaterials(prev => {
        const isAlreadySelected = prev.some(m => m.id === material.id);
        if (isAlreadySelected) {
          return prev.filter(m => m.id !== material.id);
        } else {
          return [...prev, material];
        }
      });
    } else {
      setSelectedMaterialForGeneration(material.id === selectedMaterialForGeneration?.id ? null : material);
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    setActiveSubFilter(null);
    if (filter !== 'Tiles') {
        setIsCombinationMode(false);
    }
  };
  
  const handleSubFilterClick = (subFilter: string) => {
    if (activeSubFilter === subFilter) {
        setActiveSubFilter(null);
    } else {
        setActiveSubFilter(subFilter);
    }
  };

  const handleSaveDesign = async () => {
    if (!previewImage || !lastAppliedMaterial) return;
    try {
        const materialIndex = userMaterials.findIndex(m => m.id === lastAppliedMaterial.id);

        if (materialIndex > -1) {
            const materialToUpdate = userMaterials[materialIndex];
            const updatedDesigns = [...(materialToUpdate.savedDesigns || []), previewImage];
            const updatedMaterial = { ...materialToUpdate, savedDesigns: updatedDesigns };
            
            // Optimistic update
            const updatedMaterials = [...userMaterials];
            updatedMaterials[materialIndex] = updatedMaterial;
            setUserMaterials(updatedMaterials);

            await saveStoredMaterial(updatedMaterial);
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            setError("This design can't be saved as it uses a default material.");
        }
    } catch (e) {
        setError("Failed to save design.");
        console.error(e);
    }
  };

  const filteredMaterials = useMemo(() => {
    const allMaterials = [...userMaterials, ...roomMaterials];
    
    let materialsToDisplay = allMaterials;

    if (activeFilter) {
        materialsToDisplay = materialsToDisplay.filter(material => material.category === activeFilter);
    }

    if (activeSubFilter) {
        materialsToDisplay = materialsToDisplay.filter(material => material.subCategory === activeSubFilter);
    }

    // De-duplicate based on ID
    const uniqueMaterials = Array.from(new Map(materialsToDisplay.map(m => [m.id, m])).values());
    return uniqueMaterials;
  }, [activeFilter, activeSubFilter, roomMaterials, userMaterials]);
  
  const subCategories = activeFilter in CATEGORY_STRUCTURE ? CATEGORY_STRUCTURE[activeFilter as keyof typeof CATEGORY_STRUCTURE] : null;

  const sharedImageClasses = "absolute top-0 left-0 w-full h-full object-contain";
  
  const canSaveDesign = hasRedesigned && lastAppliedMaterial && userMaterials.some(m => m.id === lastAppliedMaterial.id);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 h-full overflow-hidden">
       {isMobilePanelOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/40 z-30" 
            onClick={() => setIsMobilePanelOpen(false)}
            aria-hidden="true"
          ></div>
      )}
      
      <aside className={`w-full bg-ui-sidebar border-ui-border flex flex-col transition-all duration-300 ease-in-out fixed bottom-0 left-0 right-0 z-40 h-[85vh] rounded-t-2xl shadow-2xl border-t lg:border-t-0 lg:static lg:flex-shrink-0 lg:border-r lg:h-auto lg:shadow-none lg:rounded-none lg:translate-y-0 ${isMobilePanelOpen ? 'translate-y-0' : 'translate-y-full'} ${isPanelCollapsed ? 'lg:w-0 lg:p-0 lg:border-r-0' : 'lg:w-[360px]'}`}>
        <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-300 ${isPanelCollapsed ? 'lg:opacity-0' : 'lg:opacity-100'}`}>
            <div className="lg:hidden p-4 flex-shrink-0 flex items-center justify-center relative border-b border-ui-border">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
                <button onClick={() => setIsMobilePanelOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2" aria-label="Close panel">
                    <Icon name="close" className="w-6 h-6 text-gray-500" />
                </button>
            </div>

            <div className="p-4 border-b border-ui-border flex-shrink-0">
              <h1 className="text-xl font-bold">Visualizer Controls</h1>
              <p className="text-sm text-text-secondary">Select materials to apply to the floor</p>
            </div>
            
            <div className="flex-1 px-4 pt-4 pb-20 lg:pb-4 overflow-y-auto min-h-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Category</h3>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-1">
                    {filterCategories.map(filter => (
                      <button
                        key={filter}
                        onClick={() => handleFilterClick(filter)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                          activeFilter === filter
                            ? 'bg-white text-brand-primary shadow-sm'
                            : 'bg-transparent text-gray-500 hover:text-brand-primary'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {subCategories && (
                  <div>
                      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Sub-Category</h3>
                      <div className="flex flex-wrap gap-2">
                          {subCategories.map(subFilter => (
                              <button
                                  key={subFilter}
                                  onClick={() => handleSubFilterClick(subFilter)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                                      activeSubFilter === subFilter
                                          ? 'bg-brand-primary text-white'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                  }`}
                              >
                                  {subFilter}
                              </button>
                          ))}
                      </div>
                  </div>
                )}
                
                {activeFilter === 'Tiles' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label htmlFor="combination-toggle" className="text-sm font-semibold text-text-main cursor-pointer">Mix & Match Mode</label>
                      <button onClick={() => setIsCombinationMode(!isCombinationMode)} id="combination-toggle" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${isCombinationMode ? 'bg-brand-primary' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCombinationMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                  </div>
                )}

                <div>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md relative mb-4 text-sm" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  {isCombinationMode && combinationMaterials.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-xs font-bold text-text-secondary mb-2 uppercase">Selected for Pattern:</h4>
                        <div className="flex flex-wrap gap-2">
                            {combinationMaterials.map(m => (
                                <div key={m.id} className="flex items-center space-x-1.5 bg-white p-1 pr-2 rounded-full border shadow-sm">
                                    <img src={m.imageUrl} className="w-6 h-6 rounded-full object-cover" alt={m.name} />
                                    <span className="text-xs font-medium truncate max-w-[100px]">{m.name}</span>
                                    <button onClick={() => handleSelectMaterial(m)} className="text-gray-400 hover:text-black" aria-label={`Remove ${m.name}`}>
                                        <Icon name="close" className="w-3.5 h-3.5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Materials for {roomType}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-center group focus:outline-none flex flex-col items-center justify-center aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-gray-100 transition-colors"
                      title="Add your own material"
                    >
                      <Icon name="plus" className="w-8 h-8 text-gray-400 group-hover:text-brand-primary transition-transform" />
                      <p className="text-xs font-semibold text-gray-500 mt-2 group-hover:text-brand-primary">Add New</p>
                    </button>
                    {filteredMaterials.map((material) => {
                      const isSelected = (!isCombinationMode && selectedMaterialForGeneration?.id === material.id) || 
                                         (isCombinationMode && combinationMaterials.some(m => m.id === material.id));
                      return (
                        <button key={material.id} onClick={() => handleSelectMaterial(material)} className="text-left group focus:outline-none">
                          <div className={`relative w-full aspect-square bg-cover bg-center rounded-lg overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-brand-primary ring-offset-2' : 'ring-1 ring-gray-200'}`}>
                            <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            {isSelected && <div className="absolute top-1.5 right-1.5 bg-brand-primary rounded-full p-1 shadow-md"><Icon name="check" className="w-3 h-3 text-white"/></div>}
                          </div>
                          <p className="text-xs font-medium text-text-secondary mt-2 truncate group-hover:text-brand-primary" title={material.name}>{material.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-ui-border flex-shrink-0 absolute bottom-0 left-0 right-0 bg-white/70 backdrop-blur-sm lg:relative lg:bg-transparent lg:backdrop-blur-none">
              <button
                onClick={handlePrimaryAction}
                disabled={buttonState.disabled}
                title={buttonState.title}
                className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-xl text-md hover:bg-brand-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                {buttonState.icon === 'spinner' ? <Spinner className="w-5 h-5" /> : <Icon name={buttonState.icon as any} className="w-5 h-5" />}
                <span>{buttonState.text}</span>
              </button>
            </div>
        </div>
      </aside>
      
      <main className="relative flex-1 bg-gray-50 flex flex-col min-h-0">
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-ui-border z-20">
          <div className="flex items-center justify-between p-3 h-16">
            <button onClick={onStartOver} className="flex items-center space-x-3 group" title="Go back to home screen">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black h-7 w-7 transition-transform group-hover:scale-110">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span className="font-bold text-xl text-gray-800 group-hover:text-brand-primary transition-colors">Stone Studio</span>
            </button>
            <div className="flex items-center space-x-2">
              <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`text-sm font-semibold flex items-center space-x-2 px-4 py-2 rounded-lg shadow-sm border transition-colors ${isChatOpen ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-main border-ui-border hover:bg-gray-50'}`}
              >
                  <Icon name="sparkles" className="w-5 h-5" />
                  <span className="hidden sm:inline">AI Assistant</span>
              </button>
              <button 
                  onClick={exportPdf} 
                  disabled={!lastAppliedMaterial || isExportingPdf} 
                  className="text-sm font-semibold flex items-center space-x-2 bg-white text-text-main px-4 py-2 rounded-lg shadow-sm border border-ui-border disabled:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title={!lastAppliedMaterial ? "Export is available for single material designs." : "Export as PDF"}
              >
                  {isExportingPdf ? <Spinner className="w-5 h-5"/> : <Icon name="document" className="w-5 h-5"/>}
                  <span className="hidden sm:inline">{isExportingPdf ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-y-auto">
            {/* Top Toolbar */}
            <div className="flex-shrink-0 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border shadow-sm">
                  <button onClick={onStartOver} className="text-sm font-medium flex items-center space-x-1.5 text-text-secondary hover:text-text-main px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"><Icon name="refresh" className="w-4 h-4"/><span className="hidden lg:inline">Change Space</span></button>
                  <button onClick={onClearImage} className="text-sm font-medium flex items-center space-x-1.5 text-text-secondary hover:text-text-main px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"><Icon name="upload" className="w-4 h-4"/><span className="hidden lg:inline">Change Photo</span></button>
                  <button onClick={resetChanges} disabled={!hasRedesigned} className="text-sm font-medium flex items-center space-x-1.5 text-text-secondary hover:text-text-main disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"><Icon name="reset" className="w-4 h-4"/><span className="hidden lg:inline">Reset</span></button>
                  <button 
                    onClick={handleSaveDesign} 
                    disabled={!canSaveDesign || saveSuccess}
                    title={canSaveDesign ? "Save this design to your stock library" : "Save is only available for your own materials."}
                    className="text-sm font-medium flex items-center space-x-1.5 text-text-secondary hover:text-text-main disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Icon name={saveSuccess ? "check" : "save"} className={`w-4 h-4 ${saveSuccess ? 'text-green-500' : ''}`}/>
                    <span className="hidden lg:inline">{saveSuccess ? 'Saved!' : 'Save Design'}</span>
                  </button>
                </div>

                {/* Compare Button (Previously Magic Tools) */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                     {hasRedesigned && 
                        <button onClick={() => handleToggleCompare()} className="whitespace-nowrap bg-brand-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-brand-primary-hover transition-colors flex items-center space-x-1">
                            <Icon name="compare" className="w-3 h-3" />
                            <span>{isComparing ? 'Exit Compare' : 'Compare'}</span>
                        </button>
                    }
                </div>
            </div>

            <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Main Canvas */}
                <div className="flex-1 bg-white rounded-t-xl shadow-lg border border-ui-border relative flex items-center justify-center p-2 min-h-0 overflow-hidden">
                    <div ref={sliderContainerRef} className="relative w-full h-full max-w-full max-h-full overflow-hidden select-none" style={{ cursor: isDragging ? 'ew-resize' : 'default' }}>
                    <img src={previewImage} alt="Room design" className={sharedImageClasses} />
                    
                    {hasRedesigned && (
                    <>
                        <div 
                        className="absolute top-0 left-0 h-full w-full" 
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`, transition: isDragging ? 'none' : 'clip-path 0.3s ease-in-out' }}
                        >
                        <img src={image} alt="Original room" className={sharedImageClasses} />
                        </div>
                        
                        {isComparing && (
                        <div
                            className="absolute top-0 bottom-0 z-10 cursor-ew-resize group"
                            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onTouchStart={() => setIsDragging(true)}
                        >
                            <div className="absolute inset-y-0 -inset-x-4"></div>
                            <div className="relative h-full w-1 bg-white/50 backdrop-blur-sm shadow-lg"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl border-2 border-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Icon name="arrows-left-right" className="w-6 h-6 text-brand-primary" />
                            </div>
                        </div>
                        )}
                    </>
                    )}

                    {(isRedesigning || isAnalyzing) && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-20 transition-opacity duration-300">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center w-64 sm:w-72 border border-gray-100">
                            <Spinner className="h-10 w-10 text-brand-primary" />
                            <p className="mt-4 text-lg font-semibold text-text-main">
                                {isAnalyzing ? 'Analyzing your space...' : 'Generating design...'}
                            </p>
                            <p className="mt-2 text-sm text-text-secondary">
                                The AI is working its magic. <br/> Please wait a moment.
                            </p>
                        </div>
                    </div>
                    )}
                </div>
                 
                {/* Chat Assistant Overlay */}
                <ChatAssistant 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)} 
                    onSendMessage={handleChatInstruction}
                    isProcessing={isRedesigning}
                />
            </div>

            {/* Session History Filmstrip */}
            <div className="bg-white border-x border-b border-ui-border rounded-b-xl p-3 flex space-x-3 overflow-x-auto h-24 flex-shrink-0 shadow-sm">
                {history.map((item, index) => (
                    <button 
                        key={item.id} 
                        onClick={() => handleRestoreHistory(item)}
                        className={`relative flex-shrink-0 w-20 h-full rounded-lg overflow-hidden border-2 transition-all ${previewImage === item.imageUrl ? 'border-brand-primary ring-2 ring-brand-primary ring-opacity-50' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                        <img src={item.thumbnailUrl} alt={`Version ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-0.5 text-center truncate px-1">
                            {index === 0 ? 'Original' : item.actionDescription || `Ver ${index}`}
                        </div>
                    </button>
                ))}
            </div>
            </div>

            <div className="lg:hidden absolute top-1/2 -translate-y-1/2 -right-4 z-20">
              <button
                  onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                  className="bg-white hover:bg-gray-100 text-gray-600 rounded-full p-1.5 shadow-md border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                  <Icon name={isPanelCollapsed ? 'chevron-left' : 'chevron-right'} className="w-5 h-5" />
              </button>
            </div>
        </div>

        <div className="lg:hidden fixed bottom-6 right-6 z-20">
            <button
                onClick={() => setIsMobilePanelOpen(true)}
                className="bg-brand-primary text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition duration-300 flex items-center justify-center space-x-2"
                aria-label="Customize design"
            >
                <Icon name="sparkles" className="w-6 h-6" />
                <span className="font-semibold">Customize</span>
            </button>
        </div>
      </main>

      {isUploadModalOpen && (
        <MaterialUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSave={handleAddNewMaterial}
          initialCategory={activeFilter as any}
          initialSubCategory={activeSubFilter || undefined}
        />
      )}
    </div>
  );
};

export default DesignStudio;
