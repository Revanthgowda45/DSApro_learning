import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate?: (avatarUrl: string) => void;
  size?: 'small' | 'medium' | 'large';
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarUpdate,
  size = 'large' 
}: AvatarUploadProps) {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  // Compress and convert image to base64
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create object URL for the image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    });
  };

  // Convert file to base64 (fallback for small files)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Validate image file
  const validateImage = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const error = validateImage(file);
    if (error) {
      alert(error);
      return;
    }

    try {
      setIsUploading(true);
      
      // Check file size and compress if needed
      let base64String: string;
      
      if (file.size > 1024 * 1024) { // If file is larger than 1MB
        console.log(`Compressing image: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        base64String = await compressImage(file, 400, 0.8); // Compress to max 400px width, 80% quality
        console.log(`Compressed image size: ${(base64String.length * 0.75 / 1024).toFixed(2)}KB`);
      } else {
        // Use original file for small images
        base64String = await fileToBase64(file);
      }
      
      setPreview(base64String);

      // Update user profile with base64 data
      if (user) {
        await updateUser({
          avatar_url: base64String
        });
        
        // Call callback if provided
        onAvatarUpdate?.(base64String);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      
      if (user) {
        await updateUser({
          avatar_url: null
        });
        
        setPreview(null);
        onAvatarUpdate?.('');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Failed to remove avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const currentAvatar = preview || currentAvatarUrl || user?.avatar_url;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
        } ${isUploading ? 'opacity-50' : 'hover:border-blue-300'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default avatar on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <svg class="${iconSizes[size]} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
            <Camera className={`${iconSizes[size]} text-white`} />
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        {/* Remove Button */}
        {currentAvatar && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAvatar();
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors duration-200 shadow-lg"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          JPEG, PNG, GIF, WebP up to 5MB
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
          Images over 1MB will be automatically compressed
        </p>
        
        {currentAvatar && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            <span>Profile image saved as base64</span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
