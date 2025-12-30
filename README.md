# LingoMem 🌍📚

[English](README_EN.md) | 中文

> **你的 AI 语言私教**：一个支持多语言、基于艾宾浩斯遗忘曲线的智能记忆系统。

LingoMem 是一个 Model Context Protocol (MCP) 服务，旨在为 LLM 添加长期记忆能力。它利用科学的 **SM-2 间隔重复算法**，配合**主动回忆 (Active Recall)** 和**语境联想记忆法**，将你的 AI 助手变成一个严格但高效的语言老师。

不再需要手动管理单词本，不再依赖 AI 有限的上下文窗口——让 AI 像真正的老师一样，通过提问、测验和情境短文来帮你深度记忆。

---

## ✨ 核心特性

- **🗣️ 主动回忆 (Active Recall)** - AI 像考官一样提问，根据你的回答自动评分，拒绝枯燥的自我打分
- **🕸️ 语境联想记忆** - 不孤立背单词！提供词源、派生词、搭配，并生成情境短文帮助深度记忆
- **🌐 多语言严格隔离** - 通过 `(word, lang)` 联合主键，同时学习多语言互不干扰
- **📉 科学防遗忘** - SuperMemo-2 算法精准计算复习间隔，复习优先于新词学习
- **⚡ 零配置负担** - 单文件运行，本地 SQLite 存储，安全且轻量

## 📦 快速开始

### 1. 安装工具

确保你已安装 [uv](https://github.com/astral-sh/uv)：
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 下载代码

将项目保存到本地（例如 `~/Dev/LingoMem/`）。

```bash
git clone <repository-url> LingoMem
cd LingoMem
# 首次运行测试（会自动创建数据库）
uv run lingomem.py
```

### 3. 配置 MCP 客户端

将 LingoMem 添加到你的 MCP 客户端配置文件中：

```json
{
  "mcpServers": {
    "lingomem": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "mcp",
        "/你的绝对路径/path/to/LingoMem/lingomem.py"
      ]
    }
  }
}
```
> ⚠️ **注意**：
> - 使用**绝对路径**指向 `lingomem.py`
> - Windows 用户请使用双反斜杠，如 `"C:\\Dev\\lingomem.py"`
> - 配置文件位置因客户端而异，请参考客户端文档

---

## 📖 标准工作流

LingoMem 遵循科学的**三阶段学习法**：复习 → 学习 → 测验

### 第一阶段：复习检查
每次开始时，AI 会自动检查今日待复习单词：

> **用户**："我要背法语。"
> **AI**：(调用 `get_due_reviews("fr")`) "今天有 2 个词需要复习。"
> **AI**：(考官模式) "第一个：**'房子'用法语怎么说？**"
> **用户**："Maison"
> **AI**：(后台判断：迅速正确 → 5分，调用 `submit_review`) "完美！下次复习：7天后"

### 第二阶段：新词学习（深度教学）
复习完成后，AI 会提供**详细的单词卡片**：

> **用户**："学 3 个关于'家'的词。"
> **AI**：(调用 `filter_new_words` 确认新词)
>
> **1. Maison (nf.) - 房子**
> - **发音**: /mɛ.zɔ̃/
> - **🕸️ 记忆网**:
>   - 关联: 英语 Mansion (豪宅) 同词源
>   - 短语: à la maison (在家)
> - **例句**: Ma maison est grande.
>
> *(... 类似展示其他 2 个词 ...)*

### 第三阶段：情境短文与测验
学完所有新词后，AI 生成情境短文巩固记忆：

> **📖 今日微型故事**
> Je rentre à la **maison** après le travail. J'ouvre la **porte** avec ma clé. Il fait chaud, alors j'ouvre aussi la **fenêtre**.
>
> *(我下班回家。用钥匙打开**门**。天气很热，所以打开**窗户**透气。)*

然后进行**即时测验**，通过的词才会调用 `add_words` 存入数据库。

---


## 🛠️ 工具 API 参考

### 核心学习工具

| 工具名 | 参数示例 | 描述 |
| :--- | :--- | :--- |
| `filter_new_words` | `words=["a","b"], lang="en"` | 检查新词是否已存在，返回未重复的词。 |
| `add_words` | `words=[{"word":"a","definition":"..."}], lang="en"` | 将新词存入库，初始间隔设为 1 天。 |
| `get_due_reviews` | `lang="ja", limit=10` | 获取所有 `next_review <= 今天` 的单词。 |
| `submit_review` | `word="a", lang="en", quality=5` | 提交复习结果，基于 SM-2 更新下次复习日期。 |

### 词库管理工具

| 工具名 | 参数示例 | 描述 |
| :--- | :--- | :--- |
| `list_all_words` | `lang="fr", sort_by="next_review", limit=50` | 列出所有单词，支持按字段排序和限制数量。 |
| `search_words` | `query="mai", lang="fr", search_in="both"` | 搜索单词或释义，支持模糊匹配。 |
| `update_definition` | `word="maison", lang="fr", new_definition="..."` | 更新单词的释义内容。 |
| `delete_word` | `word="maison", lang="fr"` | 从指定语言库中删除单个单词。 |
| `delete_all_words` | `lang="fr"` | ⚠️ 删除指定语言的所有单词。 |
| `reset_word_progress` | `word="maison", lang="fr"` | 重置单词学习进度，恢复初始状态。 |

### 统计与批量操作

| 工具名 | 参数示例 | 描述 |
| :--- | :--- | :--- |
| `get_statistics` | `lang="en"` | 获取学习统计：总词数、待复习数、掌握率等。 |
| `import_from_text` | `text="apple - 苹果\nbanana - 香蕉", lang="en"` | 从文本批量导入（格式：word - definition）。 |

---

## 📊 数据库结构

LingoMem 使用 SQLite 存储，文件名为 `vocab.db`（位于脚本同级目录）。

**表结构 (`vocabulary`)**:
- `word` (Text): 单词
- `lang` (Text): 语言代码 (en, ja, fr...)
- `definition` (Text): 释义
- `repetition_count`: 复习次数
- `ease_factor`: 记忆难度系数 (默认 2.5)
- `interval`: 间隔天数
- `next_review`: 下次复习日期

**主键**: `(word, lang)` - 联合主键确保多语言隔离

---

## 🌍 语言代码参考

| 语言 | 代码 | 示例 |
|------|------|------|
| 英语 | `en` | apple - 苹果 |
| 日语 | `ja` | 桜 - 樱花 |
| 法语 | `fr` | chat - 猫 |
| 中文 | `zh` | 你好 - Hello |
| 德语 | `de` | Haus - 房子 |
| 西班牙语 | `es` | casa - 房子 |


---

## 📄 License

MIT License. Created by LingoMem Project.