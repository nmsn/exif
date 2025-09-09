'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, Download, RotateCcw, Sparkles } from 'lucide-react';

interface SimpleWatermarkEditorProps {
  imageUrl: string;
  exifData: Array<{ label: string; value: string }>;
  onImageProcessed: (dataUrl: string) => void;
}

export default function SimpleWatermarkEditor({ imageUrl, exifData, onImageProcessed }: SimpleWatermarkEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // 加载原始图片
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        drawOriginalImage(img);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  // 绘制原始图片
  const drawOriginalImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = img.width;
    canvas.height = img.height;

    // 绘制图片
    ctx.drawImage(img, 0, 0);
  };

  // 添加简约水印
  const addMinimalWatermark = () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重新绘制原图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);

    // 添加半透明背景
    const watermarkHeight = 100;
    const gradient = ctx.createLinearGradient(0, canvas.height - watermarkHeight, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - watermarkHeight, canvas.width, watermarkHeight);

    // 添加EXIF信息文字
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';

    const startY = canvas.height - 80;
    exifData.slice(0, 3).forEach((item, index) => {
      const text = `${item.label}: ${item.value}`;
      ctx.fillText(text, 20, startY + (index * 22));
    });

    setIsProcessing(false);
    updateProcessedImage();
  };

  // 添加装饰性水印
  const addDecorativeWatermark = () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重新绘制原图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);

    // 添加装饰性背景
    const watermarkHeight = 120;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(0, canvas.height - watermarkHeight, canvas.width, watermarkHeight);

    // 添加装饰圆圈
    ctx.beginPath();
    ctx.arc(canvas.width - 60, canvas.height - 60, 25, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 添加相机图标
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', canvas.width - 60, canvas.height - 52);

    // 添加分隔线
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(15, canvas.height - 110, canvas.width - 120, 1);

    // 添加EXIF信息文字
    ctx.fillStyle = 'white';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';

    const startY = canvas.height - 100;
    exifData.slice(0, 4).forEach((item, index) => {
      const text = `${item.label}: ${item.value}`;
      ctx.fillText(text, 20, startY + (index * 20));
    });

    setIsProcessing(false);
    updateProcessedImage();
  };

  // 重置画布
  const resetCanvas = () => {
    if (originalImage) {
      drawOriginalImage(originalImage);
    }
  };

  // 更新处理后的图片
  const updateProcessedImage = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onImageProcessed(dataURL);
  };

  // 下载图片
  const downloadImage = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'photo-with-watermark.jpg';
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5" />
        水印编辑器
      </h2>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={addMinimalWatermark}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <Palette className="w-4 h-4" />
          简约水印
        </button>

        <button
          onClick={addDecorativeWatermark}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          装饰水印
        </button>

        <button
          onClick={resetCanvas}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>

        <button
          onClick={downloadImage}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          下载
        </button>
      </div>

      {/* 画布区域 */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">处理中...</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="max-w-full mx-auto block border border-slate-300 dark:border-slate-500 rounded"
          style={{ display: isProcessing ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}