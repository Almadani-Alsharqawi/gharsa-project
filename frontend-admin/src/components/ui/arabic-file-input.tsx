import React, { useRef } from 'react';
import { Button } from './button';
import { Upload } from 'lucide-react';

interface ArabicFileInputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  className?: string;
  placeholder?: string;
  buttonText?: string;
  selectedFile?: File | null;
}

export const ArabicFileInput: React.FC<ArabicFileInputProps> = ({
  onChange,
  accept = "image/*",
  className = "",
  placeholder = "لم يتم اختيار اي ملف بعد",
  buttonText = "اختر ملفًا",
  selectedFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <div className="bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm text-muted-foreground min-h-[40px] flex items-center">
          {selectedFile ? selectedFile.name : placeholder}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className="bg-gradient-hero hover:opacity-90 text-primary-foreground border-0"
      >
        <Upload className="w-4 h-4 ml-2" />
        {buttonText}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
