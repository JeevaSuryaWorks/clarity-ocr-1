/**
 * Compress an image file using HTML5 Canvas
 * Resizes larger images to fit within maxDimensions while maintaining aspect ratio
 * Converts to JPEG with specified quality
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
): Promise<File> => {
    // If it's not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Better quality scaling
                ctx.fillStyle = 'white'; // Prevent transparent backgrounds turning black in JPEG
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Image compression failed"));
                            return;
                        }

                        // Create new File object with compressed data
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        console.log(`[Image Compression] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB -> Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
