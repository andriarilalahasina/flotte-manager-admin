import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X, Upload } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // We'll resize the image to save space in localStorage
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress to save space
          onChange(dataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#9A9388] uppercase tracking-widest">{label}</label>
      <div className="relative">
        {value ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#E2DDD1]">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-[#F9F7F2] border-2 border-dashed border-[#D9D4C7] rounded-xl hover:bg-[#F0EDE4] transition-all group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#829379] shadow-sm group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-[#70695E] uppercase tracking-widest">Prendre Photo / Charger</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
