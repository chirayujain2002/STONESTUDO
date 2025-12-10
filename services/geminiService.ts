// FIX: Removed invalid file marker from the top of the file.
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { RoomType, DetectedObject } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ensureBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Failed to convert image to base64:", url, error);
        throw new Error("Failed to load image for processing.");
    }
};

const dataUrlToBlob = (dataUrl: string) => {
    if (!dataUrl) return { blob: new Blob([]), mimeType: '', base64: '' };
    
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(base64);
    let n = bstr.length;
    // FIX: Corrected typo from UintArray to Uint8Array.
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return { blob: new Blob([u8arr], { type: mime }), mimeType: mime, base64: base64 };
};

export const validateImage = async (imageDataUrl: string, validationType: 'room' | 'material'): Promise<{ isValid: boolean; reason: string; }> => {
    try {
        const { base64, mimeType } = dataUrlToBlob(imageDataUrl);

        const prompts = {
            room: "Analyze this image. Is it a photo of an indoor room? This can include rooms that are under construction, which may have unfinished walls, exposed elements, or a bare concrete floor. The key requirement is that a main floor surface is clearly visible and occupies a significant portion of the image, making it suitable for visualizing a new flooring material. The lighting should be sufficient to understand the space. The image must not be a close-up of a single texture, an outdoor scene, or have extreme perspective distortion that makes the floor unusable.",
            material: "Analyze this image. Is it a texture swatch of a single material (like a tile, wood plank, or marble)? The image should be mostly flat and front-facing, suitable for use as a texture in an interior design app. Minor reflections, some blur, or subtle lighting variations are acceptable, especially for glossy materials. The image must not contain strong perspective, multiple objects, or be a photo of an entire room."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: prompts[validationType] },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN, description: 'Whether the image meets the specified criteria.' },
                        reason: { type: Type.STRING, description: 'A brief, user-friendly explanation if the image is not valid (e.g., "No clear floor visible," or "Image is not a flat texture."). If valid, return "OK".' }
                    }
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Image validation failed:", error);
        return { isValid: false, reason: "Could not validate the image. Please try again." };
    }
};

export const cleanMaterialImage = async (imageDataUrl: string): Promise<string> => {
    try {
        const { base64, mimeType } = dataUrlToBlob(imageDataUrl);

        const prompt = "You are an expert texture artist. Your task is to prepare this image for use as a 3D texture map. 1. Remove any uneven lighting, flash glares, or dark shadows to make the texture uniformly lit (albedo map style). 2. Crop out any background if it exists, keeping only the material surface. 3. Sharpen details slightly. 4. CRITICAL: Preserve the original color, pattern, and unique characteristics of the material exactly. Do not generate a generic version. Return ONLY the processed image.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            const newMimeType = imagePart.inlineData.mimeType;
            const newBase64Data = imagePart.inlineData.data;
            return `data:${newMimeType};base64,${newBase64Data}`;
        }

        throw new Error("The AI did not return a cleaned image.");
    } catch (error) {
        console.error("Image cleaning failed:", error);
        // Fallback: return original image if cleaning fails to avoid blocking the user
        return imageDataUrl;
    }
};


export const analyzeRoom = async (imageDataUrl: string, roomType: RoomType): Promise<DetectedObject[]> => {
  const { base64, mimeType } = dataUrlToBlob(imageDataUrl);

  const prompt = `Analyze this image of a ${roomType}. Identify the floor in the image. Provide a one-word lowercase label "floor" and its bounding box coordinates as normalized values from 0 to 1. If no floor is visible, return an empty list of objects.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: base64 } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: 'The label for the object, which should always be "floor".' },
                boundingBox: {
                  type: Type.OBJECT,
                  properties: {
                    x1: { type: Type.NUMBER, description: "Top-left x-coordinate (normalized 0-1)" },
                    y1: { type: Type.NUMBER, description: "Top-left y-coordinate (normalized 0-1)" },
                    x2: { type: Type.NUMBER, description: "Bottom-right x-coordinate (normalized 0-1)" },
                    y2: { type: Type.NUMBER, description: "Bottom-right y-coordinate (normalized 0-1)" },
                  },
                },
              },
            },
          },
        },
      },
    }
  });

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse.objects || [];
};


export const redesignObject = async (
  baseImageDataUrl: string,
  objectLabel: string,
  stylePrompt: string,
  materialImageDataUrls: string[] = [],
  povInstruction: string = ''
): Promise<string> => {
  const { base64: baseImageBase64, mimeType: baseImageMimeType } = dataUrlToBlob(baseImageDataUrl);
  
  const parts: any[] = [
    { inlineData: { mimeType: baseImageMimeType, data: baseImageBase64 } },
  ];

  let prompt: string;
  const roleDefinition = "You are a world-class AI interior designer specializing in photorealistic material visualization.";
  const taskDefinition = `Your task is to redesign the **${objectLabel}** in the first image provided.`;
  const constraints = `
  - **Coverage**: The new material must cover the ${objectLabel} completely and uniformly.
  - **Realism**: Preserve all original lighting, shadows (e.g. from furniture, walls), reflections, and geometric perspective. The new floor must look like it was physically installed in the room.
  - **Perspective**: The texture must align with the room's vanishing points. Tiles or patterns must recede naturally.
  `;

  const finalFraming = povInstruction ? ` Re-render the entire scene ${povInstruction}.` : '';

  if (materialImageDataUrls && materialImageDataUrls.length > 0) {
    for (const url of materialImageDataUrls) {
      if(url) {
        // Ensure we have a base64 string, fetching from URL if necessary
        const base64Url = await ensureBase64(url);
        const { base64: materialImageBase64, mimeType: materialImageMimeType } = dataUrlToBlob(base64Url);
        parts.push({ inlineData: { mimeType: materialImageMimeType, data: materialImageBase64 } });
      }
    }

    if (materialImageDataUrls.length === 1) {
      prompt = `
      ${roleDefinition}
      ${taskDefinition}
      
      **INPUTS**:
      - Image 1: The Room (Target).
      - Image 2: The Material Swatch (Source).

      **INSTRUCTIONS**:
      1. Use **ONLY** the texture from Image 2. Do not invent a new style.
      2. Apply the texture from Image 2 onto the ${objectLabel} of Image 1.
      3. **Texture Fidelity**: Maintain the exact color, grain, and pattern of Image 2.
      4. ${stylePrompt}
      ${constraints}
      ${finalFraming}
      `;
    } else {
      prompt = `
      ${roleDefinition}
      ${taskDefinition}

      **INPUTS**:
      - Image 1: The Room.
      - Images 2-${materialImageDataUrls.length + 1}: Material Swatches.

      **INSTRUCTIONS**:
      1. Create a sophisticated floor pattern using the provided material swatches.
      2. **Pattern Design**: ${stylePrompt} (e.g. checkerboard, borders, geometric mix).
      3. Distribute the materials aesthetically across the ${objectLabel}.
      ${constraints}
      ${finalFraming}
      `;
    }
  } else {
    prompt = `
    ${roleDefinition}
    ${taskDefinition}
    
    **INSTRUCTIONS**:
    1. Redesign the ${objectLabel} to perfectly match this description: "${stylePrompt}".
    ${constraints}
    ${finalFraming}
    `;
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts,
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

  if (imagePart && imagePart.inlineData) {
    const newMimeType = imagePart.inlineData.mimeType;
    const newBase64Data = imagePart.inlineData.data;
    return `data:${newMimeType};base64,${newBase64Data}`;
  }

  throw new Error("The AI did not return a new image.");
};

export const refineDesign = async (currentImageDataUrl: string, instruction: string): Promise<string> => {
  const { base64, mimeType } = dataUrlToBlob(currentImageDataUrl);
  
  const prompt = `
  You are an expert AI Interior Designer. 
  The user has provided an image of a room and a specific instruction to modify it.
  
  **USER INSTRUCTION**: "${instruction}"
  
  **RULES**:
  1. **Structural Integrity**: Keep the room's geometry, furniture placement, and perspective EXACTLY the same unless the user explicitly asks to move furniture.
  2. **Lighting & Ambience**: You can change the lighting (day/night/warm/cool) if requested.
  3. **Materials & Colors**: You can change wall colors, floor textures, or furniture materials if requested.
  4. **Photorealism**: The output must be highly photorealistic.
  
  Apply the user's instruction to the image.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });

  const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

  if (imagePart && imagePart.inlineData) {
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  }
  
  throw new Error("Failed to refine the design.");
}
