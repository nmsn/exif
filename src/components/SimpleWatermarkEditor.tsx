'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { Leafer, Image, Rect, Text } from 'leafer-ui';
import { Palette, Download, RotateCcw } from 'lucide-react';

interface SimpleWatermarkEditorProps {
  onImageProcessed: (dataUrl: string) => void;
  exifData: Array<{ label: string; value: string }>
  ref?: React.Ref<SimpleWatermarkEditorRef>;
}

export interface SimpleWatermarkEditorRef {
  loadImageFromUrl: (url: string) => void;
}

function SimpleWatermarkEditor({
  onImageProcessed,
  exifData,
  ref
}: SimpleWatermarkEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const leaferAppRef = useRef<Leafer | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);;
  const [imgUrl, setImageUrl] = useState('');

  // 辅助函数：获取leafer实例
  const getLeafer = useCallback(() => {
    return leaferAppRef.current?.leafer || null;
  }, []);

  // 初始化 Leafer.js 画布的独立函数
  const initializeLeaferApp = useCallback(() => {
    // 确保 DOM 完全加载后再初始化 Leafer.js
    if (canvasRef.current && !leaferAppRef.current) {
      try {
        // 创建 Leafer 应用

        leaferAppRef.current = new Leafer({
          view: canvasRef.current,
          width: 800,
          height: 600,
          fill: '#f3f4f6',
        });

        console.log('Leafer.js 初始化成功');
      } catch (error) {
        console.error('Leafer.js 初始化失败:', error);
        return false;
      }
    }
    return !!leaferAppRef.current && !!getLeafer();
  }, [getLeafer]);

  // 初始化 Leafer.js 画布
  useEffect(() => {
    initializeLeaferApp();

    return () => {
      // 清理画布
      if (leaferAppRef.current) {
        try {
          // leaferAppRef.current.destroy();
          leaferAppRef.current = null;
        } catch (error) {
          console.error('清理 Leafer.js 画布失败:', error);
        }
      }
    };
  }, [initializeLeaferApp]);

  // 辅助函数：计算适应容器的画布尺寸
  const calculateFitDimensions = useCallback((imgWidth: number, imgHeight: number) => {
    const container = canvasRef.current?.parentElement;
    const maxWidth = container ? container.clientWidth - 32 : 800; // 32px 是padding的空间

    let canvasWidth = imgWidth;
    let canvasHeight = imgHeight;

    if (canvasWidth > maxWidth) {
      const ratio = maxWidth / canvasWidth;
      canvasWidth = maxWidth;
      canvasHeight = Math.round(canvasHeight * ratio);
    }

    return { width: canvasWidth, height: canvasHeight };
  }, []);

  // 通过URL加载图片的函数
  const loadImageFromUrl = (url: string) => {
    // 如果 Leafer.js 未初始化，则先初始化
    if (!leaferAppRef.current || !getLeafer()) {
      console.log('Leafer.js 未初始化，正在初始化...');
      const initialized = initializeLeaferApp();
      if (!initialized) {
        console.error('Leafer.js 初始化失败');
        return;
      }
    }
    setImageUrl(url);
    drawOriginalImage(url);
  };

  useImperativeHandle(ref, () => ({
    loadImageFromUrl
  }));

  // 绘制原始图片
  const drawOriginalImage = useCallback(async (imgUrl: string) => {
    const leafer = getLeafer();
    if (!leafer) return;

    try {
      // 清空画布
      leafer.clear();

      // 创建临时Image对象获取图片尺寸
      const tempImg = new window.Image();
      await new Promise((resolve, reject) => {
        tempImg.onload = resolve;
        tempImg.onerror = reject;
        tempImg.src = imgUrl;
      });

      // 计算合适的尺寸
      const { width: canvasWidth, height: canvasHeight } = calculateFitDimensions(tempImg.width, tempImg.height);

      // 设置画布尺寸
      leafer.width = canvasWidth;
      leafer.height = canvasHeight;

      // 使用 Leafer.js 加载并显示图片
      const image = new Image({
        url: imgUrl,
        width: canvasWidth,
        height: canvasHeight,
        // 禁用renderSpread属性
        renderSpread: undefined
      });

      // 等待图片加载完成
      await new Promise((resolve, reject) => {
        image.on('load', resolve);
        image.on('error', reject);
      });

      // 添加图片到画布
      leafer.add(image);
    } catch (error) {
      console.error('绘制原始图片失败:', error);
    }
  }, [getLeafer, calculateFitDimensions]);

  // 添加简约水印
const addMinimalWatermark = async () => {
  const leafer = getLeafer();
  if (!imgUrl || !leafer) return;

  setIsProcessing(true);

  try {
    // 重新绘制原图
    leafer.clear();

    // 使用 Leafer.js 加载并显示图片
    const image = new Image({
      url: imgUrl,
      width: leafer.width,
      height: leafer.height,
      // 禁用renderSpread属性
      renderSpread: undefined
    });

    leafer.add(image);

    // 添加半透明背景渐变
    const watermarkHeight = 100;
    const gradientRect = new Rect({
      x: 0,
      y: leafer.height - watermarkHeight,
      width: leafer.width,
      height: watermarkHeight,
      fill: {
        type: 'linear',
        from: 'top',
        to: 'bottom',
        stops: [
          { offset: 0, color: 'rgba(0, 0, 0, 0)' },
          { offset: 1, color: 'rgba(0, 0, 0, 0.7)' },
        ],
      },
    });

    leafer.add(gradientRect);

    // 添加EXIF信息文字
    const startY = leafer.height - 80;
    exifData.slice(0, 3).forEach((item, index) => {
      const text = new Text({
        text: `${item.label}: ${item.value}`,
        x: 20,
        y: startY + (index * 22),
        fontSize: 14,
        fontFamily: 'Arial',
        fill: 'white',
      });
      leafer.add(text);
    });

    // 强制同步渲染到 canvas
    if (leaferAppRef.current) {
      try {
        // 尝试强制刷新
        leaferAppRef.current.forceRender?.();
        // 等待一小段时间确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (renderError) {
        console.warn('强制渲染失败:', renderError);
      }
    }

    setIsProcessing(false);
    await updateProcessedImage();
  } catch (error) {
    console.error('简约水印处理失败:', error);
    setIsProcessing(false);
  }
};

  // 重置画布
  const resetCanvas = useCallback(() => {
    const leafer = getLeafer();
    if (!leafer) return;

    try {
      leafer.clear();
      if (imgUrl) {
        drawOriginalImage(imgUrl);
      }
    } catch (error) {
      console.error('重置画布失败:', error);
    }
  }, [getLeafer, imgUrl, drawOriginalImage]);

  // 更新处理后的图片
  const updateProcessedImage = async () => {
    const leafer = getLeafer();
    if (!leaferAppRef.current || !leafer) return;

    try {
      // 使用 Leafer.js App 导出功能
      const app = leaferAppRef.current;

      // 等待渲染完成
      // await app.waitRender();

      // 尝试使用 Leafer.js 的导出功能
      let dataURL: string;

      try {
        // 尝试访问内部 canvas 并导出
        const canvas = (app as never).canvas || canvasRef.current;
        if (canvas) {
          dataURL = canvas.toDataURL('image/jpeg', 0.9);
        } else {
          throw new Error('无法访问 canvas');
        }
      } catch (exportError) {
        console.warn('Leafer.js 导出失败，尝试降级方案:', exportError);

        // 降级方案：使用 canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas 元素不存在');
        }

        dataURL = canvas.toDataURL('image/jpeg', 0.9);
      }

      // console.log('导出成功，数据长度:', dataURL.length);
      onImageProcessed(dataURL);
    } catch (error) {
      console.error('导出失败:', error);

      // 最后的降级方案
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        onImageProcessed(dataURL);
      } catch (fallbackError) {
        console.error('所有导出方法都失败:', fallbackError);
      }
    }
  };

  // 下载图片
  const downloadImage = async () => {
    const leafer = getLeafer();
    if (!leaferAppRef.current || !leafer) return;

    try {
      // 使用 Leafer.js App 导出功能
      const app = leaferAppRef.current;

      // 等待渲染完成
      // await app.waitRender();

      // 尝试使用 Leafer.js 的导出功能
      let dataURL: string;

      try {
        // 尝试访问内部 canvas 并导出
        const canvas = (app as unknown).canvas || canvasRef.current;
        if (canvas) {
          dataURL = canvas.toDataURL('image/jpeg', 0.9);
        } else {
          throw new Error('无法访问 canvas');
        }
      } catch (exportError) {
        console.warn('Leafer.js 导出失败，尝试降级方案:', exportError);

        // 降级方案：使用 canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas 元素不存在');
        }

        dataURL = canvas.toDataURL('image/jpeg', 0.9);
      }

      console.log('导出成功，数据长度:', dataURL.length);

      const link = document.createElement('a');
      link.download = `watermarked_${Date.now()}.jpg`;
      link.href = dataURL;

      // 确保链接被添加到 DOM 后再触发点击
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载图片失败:', error);

      // 最后的降级方案
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataURL = canvas.toDataURL('image/jpeg', 0.9);

        const link = document.createElement('a');
        link.download = `watermarked_${Date.now()}.jpg`;
        link.href = dataURL;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('所有导出方法都失败:', fallbackError);
      }
    }
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
          className="max-w-full h-auto mx-auto block border border-slate-300 dark:border-slate-500 rounded"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
}

export default SimpleWatermarkEditor;