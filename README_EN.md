# LingoMem 🌍📚

> **Your AI Language Tutor**: A multi-language intelligent memory system based on the Ebbinghaus forgetting curve.

[中文文档](README.md) | English

LingoMem is a Model Context Protocol (MCP) service designed to add long-term memory capabilities to LLMs. It uses the scientific **SM-2 spaced repetition algorithm**, combined with **Active Recall** and **contextual association memory**, to transform your AI assistant into a strict yet efficient language teacher.

No more manual vocabulary management, no more reliance on AI's limited context window—let AI act like a real teacher through questioning, testing, and contextual stories to help you deeply memorize.

---

## ✨ Core Features

- **🗣️ Active Recall** - AI questions like an examiner, automatically scores based on your answers, no boring self-grading
- **🕸️ Contextual Association Memory** - No isolated word memorization! Provides etymology, derivatives, collocations, and contextual stories
- **🌐 Multi-Language Strict Isolation** - Through `(word, lang)` composite primary key, learn multiple languages simultaneously without interference
- **📉 Scientific Anti-Forgetting** - SuperMemo-2 algorithm precisely calculates review intervals, prioritizing review over new word learning
- **⚡ Zero Configuration Burden** - Single file execution, local SQLite storage, secure and lightweight

## 📦 Quick Start

### 1. Install Tools

Make sure you have [uv](https://github.com/astral-sh/uv) installed:
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Download Code

Save the project locally (e.g., `~/Dev/LingoMem/`).

```bash
git clone <repository-url> LingoMem
cd LingoMem
# First run test (will automatically create database)
uv run lingomem.py
```

### 3. Configure MCP Client

Add LingoMem to your MCP client configuration file:

```json
{
  "mcpServers": {
    "lingomem": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "mcp",
        "/absolute/path/to/LingoMem/lingomem.py"
      ]
    }
  }
}
```
> ⚠️ **Note**:
> - Use **absolute path** to point to `lingomem.py`
> - Windows users should use double backslashes, like `"C:\\Dev\\lingomem.py"`
> - Configuration file location varies by client, please refer to client documentation

---

## 📖 Standard Workflow

LingoMem follows the scientific **Three-Phase Learning Method**: Review → Learn → Test

### Phase 1: Review Check
At the start of each session, AI automatically checks words due for review today:

> **User**: "I want to learn French."
> **AI**: "You have 2 words to review today."
> **AI**: (Examiner mode) "First: **What's the French word for 'house'?**"
> **User**: "Maison"
> **AI**: (Backend judgment: Quick and correct → 5 points) "Perfect! Next review: in 7 days"

### Phase 2: New Word Learning (Deep Teaching)
After reviews, AI provides **detailed word cards**:

> **User**: "Learn 3 words about 'home'."
> **AI**: 
>
> **1. Maison (nf.) - House**
> - **Pronunciation**: /mɛ.zɔ̃/
> - **🕸️ Memory Network**:
>   - Connection: English "Mansion" (manor) same etymology
>   - Phrase: à la maison (at home)
> - **Example**: Ma maison est grande.
>
> *(... Similar display for other 2 words ...)*

### Phase 3: Contextual Story & Test
After learning all new words, AI generates a contextual story to consolidate memory:

> **📖 Today's Micro Story**
> Je rentre à la **maison** après le travail. J'ouvre la **porte** avec ma clé. Il fait chaud, alors j'ouvre aussi la **fenêtre**.
>
> *(I return home after work. I open the door with my key. It's hot, so I also open the window.)*

Then an **immediate test** is conducted, and only words that pass are stored in the database.

---

## 🛠️ Tool API Reference

### Core Learning Tools

| Tool Name | Parameter Example | Description |
| :--- | :--- | :--- |
| `filter_new_words` | `words=["a","b"], lang="en"` | Check if words exist, return non-duplicate words. |
| `add_words` | `words=[{"word":"a","definition":"..."}], lang="en"` | Store new words with initial 1-day interval. |
| `get_due_reviews` | `lang="ja", limit=10` | Get all words with `next_review <= today`. |
| `submit_review` | `word="a", lang="en", quality=5` | Submit review result, update next review date using SM-2. |

### Vocabulary Management Tools

| Tool Name | Parameter Example | Description |
| :--- | :--- | :--- |
| `list_all_words` | `lang="fr", sort_by="next_review", limit=50` | List all words with sorting and limit support. |
| `search_words` | `query="mai", lang="fr", search_in="both"` | Search words or definitions with fuzzy matching. |
| `update_definition` | `word="maison", lang="fr", new_definition="..."` | Update word definition. |
| `delete_word` | `word="maison", lang="fr"` | Delete a single word from language vocabulary. |
| `delete_all_words` | `lang="fr"` | ⚠️ Delete ALL words from a specific language. |
| `reset_word_progress` | `word="maison", lang="fr"` | Reset word learning progress to initial state. |

### Statistics & Batch Operations

| Tool Name | Parameter Example | Description |
| :--- | :--- | :--- |
| `get_statistics` | `lang="en"` | Get learning statistics: total words, due words, mastery rate, etc. |
| `import_from_text` | `text="apple - 苹果\nbanana - 香蕉", lang="en"` | Batch import from text (format: word - definition). |

---

## 📊 Database Structure

LingoMem uses SQLite storage, with filename `vocab.db` (located in same directory as script).

**Table Structure (`vocabulary`)**:
- `word` (Text): Word
- `lang` (Text): Language code (en, ja, fr...)
- `definition` (Text): Definition
- `repetition_count`: Review count
- `ease_factor`: Memory difficulty coefficient (default 2.5)
- `interval`: Interval in days
- `next_review`: Next review date

**Primary Key**: `(word, lang)` - Composite key ensures multi-language isolation

---

## 🌍 Language Code Reference

| Language | Code | Example |
|------|------|------|
| English | `en` | apple - 苹果 |
| Japanese | `ja` | 桜 - cherry blossom |
| French | `fr` | chat - cat |
| Chinese | `zh` | 你好 - Hello |
| German | `de` | Haus - house |
| Spanish | `es` | casa - house |

---

## 🎯 Advanced Feature Examples

### View Learning Statistics

```
User: "How is my French learning progress?"
AI: 

📊 Learning Statistics (French)
- Total vocabulary: 156 words
- Due today: 8 words
- Mastered words: 72 (46.2%)
- Difficult words: 12 (ease_factor < 2.0)
- Average ease factor: 2.34
```

### Batch Import Words

```
User: "Import these French words:
chat - cat
chien - dog
oiseau - bird"

AI: ✅ Successfully imported 3 words into French vocabulary.
```

### Search Words

```
User: "Search all French words containing 'mai'"
AI: 

Found 3 matching words:
1. maison (house) - Next review: 2025-01-05
2. maintenant (now) - Next review: 2025-01-02
3. maître (master) - Next review: 2025-01-10
```

---

## 🔧 Troubleshooting

### AI Assistant Can't See LingoMem Tools

1. Check if MCP configuration file path is correct
2. Confirm using **absolute path** instead of relative path
3. Restart MCP client
4. Check client log files for errors

### Database File Not Found

```bash
# View database path
python -c "from lingomem import get_db_path; print(get_db_path())"

# Manually specify path (in mcp_config.json)
"env": {
  "LINGOMEM_DB_PATH": "/custom/path/vocab.db"
}
```

---

## 📄 License

MIT License. Created by LingoMem Project.

---

**Version**: 1.2.0  
**Updated**: 2025-12-30