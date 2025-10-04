'use client';

import { useState, useRef } from 'react';
import { Upload, Info, Camera } from 'lucide-react';
import ExifReader from 'exifreader';
import SimpleWatermarkEditor, { SimpleWatermarkEditorRef } from '@/components/SimpleWatermarkEditor';

interface ExifData {
  [key: string]: { description: string };
}

const formatExifValue = (value: ExifData[keyof ExifData]): string => {
  if (value && typeof value === 'object' && 'description' in value) {
    return value.description;
  }
  return String(value || '未知');
};

const getImportantExifData = (exifData?: ExifData | null) => {
  if (!exifData) return [];

  const importantKeys = [
    { key: 'Make', label: '相机品牌' },
    { key: 'Model', label: '相机型号' },
    { key: 'DateTime', label: '拍摄时间' },
    { key: 'ExposureTime', label: '快门速度' },
    { key: 'FNumber', label: '光圈值' },
    { key: 'ISO', label: 'ISO感光度' },
    { key: 'FocalLength', label: '焦距' },
    { key: 'Flash', label: '闪光灯' },
    { key: 'WhiteBalance', label: '白平衡' },
    { key: 'GPS latitude', label: 'GPS纬度' },
    { key: 'GPS longitude', label: 'GPS经度' },
    { key: 'PixelXDimension', label: '图片宽度' },
    { key: 'PixelYDimension', label: '图片高度' },
  ];

  return importantKeys
    .map(({ key, label }) => ({
      key,
      label,
      value: formatExifValue(exifData[key])
    }))
    .filter(item => item.value !== '未知');
};

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [exifData, setExifData] = useState<{ key:string, label: string; value: string; }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkEditorRef = useRef<SimpleWatermarkEditorRef>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // 读取图片并显示
      const imageUrl = URL.createObjectURL(file);
       // 提取EXIF信息
      const arrayBuffer = await file.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);
      setExifData(getImportantExifData(tags));
      const _exifData = getImportantExifData(tags);
      setSelectedImage(imageUrl);
      watermarkEditorRef.current?.loadImageFromUrl(imageUrl, _exifData)

      setExifData(_exifData);
    } catch (error) {
      console.error('处理图片时出错:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              EXIF Photo Editor
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            上传照片，提取EXIF信息，使用Canvas API生成精美水印
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：上传和预览区域 */}
          <div className="space-y-6">
            {/* 上传区域 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                上传照片
              </h2>

              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedImage ? (
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt="上传的照片"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      点击重新选择照片
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-slate-400" />
                    <div>
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        点击上传照片
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        支持 JPG、PNG 格式
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <SimpleWatermarkEditor
              ref={watermarkEditorRef}
            />
          </div>

          {/* 右侧：EXIF信息显示 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              EXIF 信息
            </h2>

            {isProcessing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600 dark:text-slate-400">处理中...</span>
              </div>
            ) : exifData ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exifData.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                      {item.label}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-4 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}

                {exifData.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    未找到EXIF信息
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  上传照片后将显示EXIF信息
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}