'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { Leafer, Image, Rect, Text } from 'leafer-ui';
import { Palette, Download, RotateCcw } from 'lucide-react';

import '@leafer-in/export';

interface SimpleWatermarkEditorProps {
  ref?: React.Ref<SimpleWatermarkEditorRef>;
}

export interface SimpleWatermarkEditorRef {
  loadImageFromUrl: (url: string, exifData: Array<{ key: string, label: string; value: string }>) => void;
}

const getImageDimensions = (exifDataArray: { label: string; value: string; }[]) => {
  if (!exifDataArray || exifDataArray.length === 0) return { width: 0, height: 0 };

  const widthItem = exifDataArray.find(item => item.label === '图片宽度');
  const heightItem = exifDataArray.find(item => item.label === '图片高度');

  return {
    width: widthItem && widthItem.value !== '未知' ? parseInt(widthItem.value, 10) : 0,
    height: heightItem && heightItem.value !== '未知' ? parseInt(heightItem.value, 10) : 0
  };
};

function SimpleWatermarkEditor({
  ref
}: SimpleWatermarkEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const leaferAppRef = useRef<Leafer | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);;
  const [imgUrl, setImageUrl] = useState('');
  const [exifData, setExifData] = useState<Array<{ key: string, label: string; value: string }>>([]);

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
  const loadImageFromUrl = (url: string, exifData: Array<{ key: string, label: string; value: string }>) => {
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
    setExifData(exifData);
    drawOriginalImage(url, exifData);
  };

  useImperativeHandle(ref, () => ({
    loadImageFromUrl
  }));

  // 绘制原始图片
  const drawOriginalImage = useCallback(async (imgUrl: string, exifData: Array<{ key: string, label: string; value: string }>) => {
    const leafer = getLeafer();
    if (!leafer) return;

    try {
      // 清空画布
      leafer.clear();

      const { width, height } = getImageDimensions(exifData);

      // 计算合适的尺寸
      const { width: canvasWidth, height: canvasHeight } = calculateFitDimensions(width, height);
      debugger;
      // 设置画布尺寸
      leafer.width = canvasWidth;
      leafer.height = canvasHeight;

      // 使用 Leafer.js 加载并显示图片
      const image = new Image({
        url: imgUrl,
        width: canvasWidth,
        height: canvasHeight,
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
      });

      leafer.add(image);

      const _height = leafer.height || 0;

      // 添加半透明背景渐变
      const watermarkHeight = 100;
      const gradientRect = new Rect({
        x: 0,
        y: _height - watermarkHeight,
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
      const startY = _height - 80;
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
        drawOriginalImage(imgUrl, exifData);
      }
    } catch (error) {
      console.error('重置画布失败:', error);
    }
  }, [getLeafer, imgUrl, drawOriginalImage, exifData]);

  // 下载图片
  const onDownloadImage = async () => {
    leaferAppRef.current?.export('screenshot.png', { screenshot: true })
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
          onClick={onDownloadImage}
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