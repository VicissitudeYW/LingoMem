# LingoMem - 智能单词背诵系统

一个基于 AI 的多语言单词学习系统，支持单词卡片生成、智能复习和学习进度追踪。

## ✨ 特性

- 🤖 **AI 驱动**: 使用 AI 自动生成高质量单词卡片
- 🌍 **多语言支持**: 支持英语、德语、法语、日语
- 📁 **文件夹视图**: 按语言分类管理单词集合
- 📚 **智能分类**: 自动分类学习中、复习中、已掌握的单词
- 🎴 **精美卡片**: 包含音标、释义、例句、词源等完整信息
- 📝 **Markdown 渲染**: 支持富文本格式显示（粗体、列表等）
- 🔄 **卡片重新生成**: 不满意可以重新生成单词卡片
- 👆 **滑动交互**: 左滑自动保存，右滑删除
- 📊 **进度追踪**: 实时统计学习进度
- 💾 **本地存储**: 所有数据保存在本地 JSON 文件中
- 🎨 **优雅设计**: 米黄色浅色主题 + 深蓝色深色主题
- 🌓 **主题切换**: 支持浅色/深色模式自动切换
- 📱 **响应式设计**: 完美适配桌面和移动设备

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker (可选，用于容器化部署)

### 安装步骤

#### 方式一：Docker 部署（推荐）

1. **克隆项目**
```bash
git clone https://github.com/yourusername/LingoMem.git
cd LingoMem
```

2. **配置环境变量**

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 AI API 信息：
```env
AI_API_ENDPOINT=https://your-api-endpoint.com/v1
AI_API_KEY=your-api-key-here
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
PORT=45000
```

3. **启动容器**
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

4. **访问应用**

打开浏览器访问: `http://localhost:45000`

#### 方式二：本地部署

1. **克隆项目**
```bash
git clone https://github.com/yourusername/LingoMem.git
cd LingoMem
```

2. **安装依赖**
```bash
npm install
```

3. **配置 API**

复制并编辑 `.env` 文件（同上）

4. **启动服务**
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

5. **访问应用**

打开浏览器访问: `http://localhost:45000`

## 📖 使用指南

### 创建单词卡片

1. 在首页选择目标语言（英语/德语/法语/日语）
2. 使用滑块选择要生成的单词数量（1-20个）
3. 在文本框中输入单词，每行一个或用逗号分隔
4. 点击"生成卡片"按钮
5. 等待 AI 生成完整的单词卡片
6. 预览卡片内容，可以重新生成不满意的卡片
7. 左滑卡片自动保存到集合

### 学习单词

**背诵区**：
- 显示所有"学习中"状态的单词
- 点击卡片展开查看完整内容
- 点击"认识"将单词移至复习区
- 点击"不认识"保持在学习区
- 支持滑动操作：左滑保存，右滑删除

**复习区**：
- 显示所有"复习中"状态的单词
- 巩固已学习的单词
- 可以将单词标记为"已掌握"

### 管理集合

#### 文件夹视图（默认）
1. 点击导航栏的"📚 集合"按钮
2. 查看按语言分类的文件夹（英语🇬🇧、德语🇩🇪、法语🇫🇷、日语🇯🇵）
3. 每个文件夹显示该语言的集合数和总卡片数
4. 点击文件夹进入该语言的集合列表
5. 点击"返回文件夹"回到分类视图

#### 列表视图
1. 点击"列表视图"按钮切换
2. 查看所有集合的完整列表
3. 每个集合显示详细的学习统计信息
4. 可以打开集合继续学习
5. 可以删除不需要的集合

## 📁 项目结构

```
LingoMem/
├── .env                      # 环境变量配置
├── .env.example             # 环境变量模板
├── .gitignore               # Git 忽略文件
├── .dockerignore            # Docker 忽略文件
├── package.json             # 项目配置
├── server.js                # 服务器入口
├── Dockerfile               # Docker 镜像配置
├── docker-compose.yml       # Docker Compose 配置
├── config/                  # 配置文件
│   ├── languages.js         # 语言配置
│   └── prompts/            # AI 提示模板
│       ├── index.js        # 提示模板入口
│       ├── english.js      # 英语提示模板
│       ├── german.js       # 德语提示模板
│       ├── french.js       # 法语提示模板
│       └── japanese.js     # 日语提示模板
├── routes/
│   └── api.js              # API 路由
├── services/
│   ├── aiService.js        # AI 服务（卡片生成）
│   ├── cardService.js      # 卡片管理服务
│   └── progressService.js  # 进度追踪服务
├── public/
│   ├── index.html          # 主页面
│   ├── css/
│   │   ├── style.css       # 主样式文件
│   │   ├── english.css     # 英语特定样式
│   │   ├── german.css      # 德语特定样式
│   │   ├── french.css      # 法语特定样式
│   │   └── japanese.css    # 日语特定样式
│   └── js/
│       ├── app.js          # 前端应用入口
│       ├── modules/        # 功能模块
│       │   ├── CardManager.js       # 卡片管理
│       │   ├── CollectionManager.js # 集合管理
│       │   ├── ProgressManager.js   # 进度管理
│       │   ├── Router.js            # 路由管理
│       │   ├── SwipeCards.js        # 滑动交互
│       │   ├── ThemeManager.js      # 主题管理
│       │   └── UIManager.js         # UI 管理
│       └── utils/
│           └── markdown.js  # Markdown 渲染工具
└── cards/                   # 卡片存储目录（自动创建）
    └── collection_*.json    # 单词集合文件
```

## 🔌 API 接口

### 生成单词卡片
```http
POST /api/generate-cards
Content-Type: application/json

{
  "words": ["apple", "banana", "computer"],
  "language": "english"
}
```

### 重新生成单词卡片
```http
POST /api/regenerate-card
Content-Type: application/json

{
  "word": "apple",
  "language": "english"
}
```

### 获取所有集合
```http
GET /api/collections
```

### 获取特定集合
```http
GET /api/collections/:id
```

### 更新卡片状态
```http
PATCH /api/cards/:cardId/status
Content-Type: application/json

{
  "collectionId": "collection_xxx",
  "status": "reviewing"
}
```

### 删除集合
```http
DELETE /api/collections/:id
```

## 🎨 卡片内容

每张单词卡片包含：

- **单词**: 目标语言的单词
- **音标**: 国际音标（英语、法语）或假名（日语）
- **难度等级**: 初级/中级/高级
- **释义**: 多个词性和含义，每个释义包含：
  - 词性标注
  - 中文释义
  - 实用例句及翻译
- **学习提示**: 记忆技巧和用法说明（支持 Markdown 格式）
- **词源**: 单词来源和构词法（可选）

### 语言特定内容

**德语**:
- 名词性别标注（der/die/das）
- 复数形式
- 动词变位信息

**日语**:
- 假名标注（平假名/片假名）
- 汉字写法
- 常用搭配

**法语**:
- 性别标注（m./f.）
- 动词变位
- 常用短语

## 🔧 技术栈

**后端**:
- Node.js + Express
- Axios (HTTP 客户端)
- dotenv (环境变量管理)

**前端**:
- 原生 JavaScript (ES6+ 模块化)
- CSS3 (动画和过渡效果)
- Fetch API
- Markdown 渲染

**存储**:
- JSON 文件存储（无需数据库）

**部署**:
- Docker + Docker Compose

## 📝 数据格式

### 集合文件结构
```json
{
  "id": "collection_1234567890_abc",
  "language": "english",
  "createdAt": "2026-01-01T05:00:00.000Z",
  "cards": [
    {
      "id": "card_1234567890_xyz",
      "word": "apple",
      "phonetic": "/ˈæpl/",
      "level": "初级",
      "language": "english",
      "definitions": [
        {
          "pos": "n.",
          "meaning": "苹果",
          "examples": [
            {
              "sentence": "I eat an apple every day.",
              "translation": "我每天吃一个苹果。"
            }
          ]
        }
      ],
      "tips": "**记忆技巧**: apple 是最常见的水果单词之一\n\n**用法说明**:\n- 可数名词\n- 常用短语: an apple a day",
      "etymology": "来自古英语 æppel",
      "status": "learning"
    }
  ],
  "stats": {
    "total": 10,
    "learning": 5,
    "reviewing": 3,
    "mastered": 2
  }
}
```

## 🎯 学习状态

- **learning**: 学习中 - 新单词或需要加强记忆的单词
- **reviewing**: 复习中 - 已经认识但需要巩固的单词
- **mastered**: 已掌握 - 完全掌握的单词

## 🌟 特色功能

### 1. 智能卡片生成
- AI 自动生成完整的单词信息
- 包含音标、释义、例句、提示等
- 支持多语言特定内容
- 可重新生成不满意的卡片

### 2. 文件夹视图
- 按语言分类管理集合
- 快速查看每种语言的学习统计
- 直观的文件夹图标和颜色区分
- 支持文件夹视图和列表视图切换

### 3. 流畅动画
- 卡片滑入/滑出动画
- 状态切换过渡效果
- 响应式交互反馈
- 滑动手势支持

### 4. Markdown 支持
- 学习提示支持富文本格式
- 粗体、列表、代码块等
- 自动渲染为 HTML

### 5. 进度追踪
- 实时统计学习进度
- 分类显示不同状态的单词
- 集合级别的统计信息
- 语言级别的统计汇总

### 6. 双主题设计
- **浅色模式**: 温暖的米黄色渐变背景（#F9E8D0）
- **深色模式**: 优雅的深蓝灰色背景（#3C465C）
- 自动保存用户偏好
- 平滑过渡动画

## 🔒 安全性

- API 密钥通过环境变量管理
- 本地文件存储，数据隐私有保障
- 输入验证和错误处理
- Docker 容器隔离

## 🐛 故障排除

### 卡片生成失败
- 检查 `.env` 文件中的 API 配置是否正确
- 确认 API 密钥有效且有足够的配额
- 查看服务器日志获取详细错误信息

### Docker 容器无法启动
- 确保 Docker 和 Docker Compose 已正确安装
- 检查端口 45000 是否被占用
- 查看容器日志：`docker-compose logs`

### 卡片无法保存
- 确保 `cards` 目录有写入权限
- 检查磁盘空间是否充足
- 查看服务器日志获取错误信息

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📮 联系方式

如有问题或建议，请创建 Issue。

## 🙏 致谢

- 感谢 AI 技术让语言学习变得更加智能
- 感谢所有贡献者的支持

---

**🌟 如果这个项目对你有帮助，请给个 Star 支持一下！**