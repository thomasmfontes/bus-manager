import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                resolve(file);
            }, 'image/jpeg', 0.9);
        });
    };

    const handleConfirm = async () => {
        if (croppedAreaPixels) {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
            if (croppedBlob) {
                onCropComplete(croppedBlob);
            }
        }
    };

    const content = (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Header - No longer absolute */}
            <div className="w-full h-20 sm:h-24 flex items-center justify-between px-6 sm:px-10 shrink-0">
                <button
                    onClick={onCancel}
                    className="p-3 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-2xl border border-white/5 active:scale-95 touch-manipulation"
                >
                    <X size={24} />
                </button>
                <div className="text-center">
                    <h3 className="text-white font-extrabold text-xl sm:text-2xl tracking-tight leading-none">Editar Foto</h3>
                    <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-bold mt-2">Ajuste o enquadramento</p>
                </div>
                <div className="w-[52px]" />
            </div>

            {/* Cropper Container - Back to rectangular with rounded corners */}
            <div className="relative w-full flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        classes={{
                            containerClassName: "bg-black",
                            cropAreaClassName: "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                        }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-[550px] mx-auto px-6 pb-8 sm:pb-12 flex flex-col gap-6 sm:gap-8 shrink-0">
                {/* Custom Styled Slider */}
                <div className="flex items-center gap-5 bg-white/5 p-4 sm:p-5 rounded-[2rem] border border-white/10">
                    <button onClick={() => setZoom(Math.max(1, zoom - 0.2))} className="text-white/40 hover:text-white transition-colors">
                        <ZoomOut size={22} />
                    </button>
                    <div className="flex-1 relative h-1.5 sm:h-2 group">
                        <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                style={{ width: `${((zoom - 1) / 2) * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.01}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-transparent z-10"
                        />
                    </div>
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="text-white/40 hover:text-white transition-colors">
                        <ZoomIn size={22} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={handleConfirm}
                        className={cn(
                            "w-full py-4 sm:py-5 text-lg font-bold rounded-2xl shadow-2xl transition-all border-none",
                            "bg-blue-600 hover:bg-blue-500 text-white",
                            "shadow-blue-900/30 hover:shadow-blue-600/40"
                        )}
                    >
                        <Check size={24} className="mr-2" />
                        Finalizar Ajuste
                    </Button>

                    <p className="text-center text-white/20 text-[10px] sm:text-[11px] font-medium tracking-wide">
                        ARRASTE PARA POSICIONAR • USE O ZOOM PARA ENQUADRAR
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
