# EXIF Photo Editor

一个基于 Next.js 15 的照片 EXIF 信息提取和水印生成应用。

## 功能特性

- 📸 **照片上传**: 支持拖拽和点击上传 JPG、PNG 格式的照片
- 📊 **EXIF 信息提取**: 自动提取并显示照片的拍摄参数信息
- 🎨 **水印生成**: 提供简约和装饰两种水印样式
- 💾 **图片下载**: 处理后的照片可直接下载
- 🌙 **深色模式**: 支持明暗主题切换
- 📱 **响应式设计**: 适配桌面和移动设备

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 4
- **语言**: TypeScript
- **图标**: Lucide React
- **EXIF 处理**: exifreader
- **Canvas 绘制**: 原生 Canvas API
- **开发工具**: ESLint, Turbopack

## 安装和运行

1. 克隆项目
```bash
git clone <repository-url>
cd exif
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 使用方法

1. **上传照片**: 点击上传区域或拖拽照片到指定区域
2. **查看 EXIF**: 上传后右侧会显示照片的详细拍摄信息
3. **添加水印**: 选择简约或装饰水印样式
4. **下载图片**: 点击下载按钮保存处理后的照片

## 水印样式

### 简约水印
- 半透明黑色背景
- 显示前3个重要的EXIF信息
- 简洁的文字布局

### 装饰水印
- 深色半透明背景
- 装饰性圆圈和相机图标
- 分隔线和更丰富的视觉效果
- 显示前4个重要的EXIF信息

## 支持的 EXIF 信息

- 相机品牌 (Make)
- 相机型号 (Model)
- 拍摄时间 (DateTime)
- 快门速度 (ExposureTime)
- 光圈值 (FNumber)
- ISO感光度 (ISO)
- 焦距 (FocalLength)
- 闪光灯 (Flash)
- 白平衡 (WhiteBalance)
- GPS位置信息 (GPS latitude/longitude)

## 项目结构

```
src/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页面
├── components/
│   └── SimpleWatermarkEditor.tsx  # 水印编辑器组件
└── types/
    └── fabric.d.ts          # 类型声明文件
```

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！