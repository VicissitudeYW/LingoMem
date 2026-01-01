# LingoMem - Intelligent Vocabulary Learning System

English | [简体中文](./README.md)

An AI-powered multilingual vocabulary learning system that supports flashcard generation, intelligent review, and learning progress tracking.

## ✨ Features

- 🤖 **AI-Powered**: Automatically generate high-quality flashcards using AI
- 🌍 **Multilingual Support**: English, German, French, and Japanese
- 📁 **Folder View**: Manage vocabulary collections by language
- 📚 **Smart Classification**: Automatically categorize words into Learning, Reviewing, and Mastered
- 🎴 **Beautiful Cards**: Complete information including phonetics, definitions, examples, and etymology
- 📝 **Markdown Rendering**: Support rich text formatting (bold, lists, etc.)
- 🔄 **Card Regeneration**: Regenerate flashcards if not satisfied
- 👆 **Swipe Interaction**: Swipe left to save, swipe right to delete
- 📊 **Progress Tracking**: Real-time learning statistics
- 💾 **Local Storage**: All data saved in local JSON files
- 🎨 **Elegant Design**: Cream light theme + Deep blue dark theme
- 🌓 **Theme Toggle**: Automatic light/dark mode switching
- 📱 **Responsive Design**: Perfect for desktop and mobile devices

## 🚀 Quick Start

### Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker (optional, for containerized deployment)

### Installation

#### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/VicissitudeYW/LingoMem.git
cd LingoMem
```

2. **Configure environment variables**

Copy the environment template:
```bash
cp .env.example .env
```

Edit the `.env` file with your AI API credentials:
```env
AI_API_ENDPOINT=https://your-api-endpoint.com/v1
AI_API_KEY=your-api-key-here
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
PORT=45000
```

3. **Start the container**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

4. **Access the application**

Open your browser and visit: `http://localhost:45000`

#### Option 2: Local Deployment

1. **Clone the repository**
```bash
git clone https://github.com/VicissitudeYW/LingoMem.git
cd LingoMem
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API**

Copy and edit the `.env` file (same as above)

4. **Start the service**
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

5. **Access the application**

Open your browser and visit: `http://localhost:45000`

## 📖 User Guide

### Creating Flashcards

1. Select target language on the homepage (English/German/French/Japanese)
2. Use the slider to choose the number of words to generate (1-20)
3. Enter words in the text box, one per line or comma-separated
4. Click the "Generate Cards" button
5. Wait for AI to generate complete flashcards
6. Preview card content, regenerate if not satisfied
7. Swipe left to automatically save to collection

### Learning Words

**Learning Area**:
- Displays all words with "Learning" status
- Click card to expand and view full content
- Click "Know" to move word to review area
- Click "Don't Know" to keep in learning area

**Review Area**:
- Displays all words with "Reviewing" status
- Consolidate learned words
- Mark words as "Mastered"

### Managing Collections

#### Folder View (Default)
1. Click "📚 Collections" in the navigation bar
2. View folders organized by language (English🇬🇧, German🇩🇪, French🇫🇷, Japanese🇯🇵)
3. Each folder shows collection count and total cards
4. Click folder to enter that language's collection list
5. Click "Back to Folders" to return to category view

#### List View
1. Click "List View" button to switch
2. View complete list of all collections
3. Each collection shows detailed learning statistics
4. Open collections to continue learning
5. Delete unwanted collections

## 📁 Project Structure

```
LingoMem/
├── .env                      # Environment configuration
├── .env.example             # Environment template
├── .gitignore               # Git ignore file
├── .dockerignore            # Docker ignore file
├── package.json             # Project configuration
├── server.js                # Server entry point
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Docker Compose configuration
├── config/                  # Configuration files
│   ├── languages.js         # Language configuration
│   └── prompts/            # AI prompt templates
│       ├── index.js        # Prompt template entry
│       ├── english.js      # English prompt template
│       ├── german.js       # German prompt template
│       ├── french.js       # French prompt template
│       └── japanese.js     # Japanese prompt template
├── routes/
│   └── api.js              # API routes
├── services/
│   ├── aiService.js        # AI service (card generation)
│   ├── cardService.js      # Card management service
│   └── progressService.js  # Progress tracking service
├── public/
│   ├── index.html          # Main page
│   ├── css/
│   │   ├── style.css       # Main stylesheet
│   │   ├── english.css     # English-specific styles
│   │   ├── german.css      # German-specific styles
│   │   ├── french.css      # French-specific styles
│   │   └── japanese.css    # Japanese-specific styles
│   └── js/
│       ├── app.js          # Frontend application entry
│       ├── modules/        # Feature modules
│       │   ├── CardManager.js       # Card management
│       │   ├── CollectionManager.js # Collection management
│       │   ├── ProgressManager.js   # Progress management
│       │   ├── Router.js            # Route management
│       │   ├── SwipeCards.js        # Swipe interaction
│       │   ├── ThemeManager.js      # Theme management
│       │   └── UIManager.js         # UI management
│       └── utils/
│           └── markdown.js  # Markdown rendering utility
└── cards/                   # Card storage directory (auto-created)
    └── collection_*.json    # Vocabulary collection files
```

## 🔌 API Endpoints

### Generate Flashcards
```http
POST /api/generate-cards
Content-Type: application/json

{
  "words": ["apple", "banana", "computer"],
  "language": "english"
}
```

### Regenerate Flashcard
```http
POST /api/regenerate-card
Content-Type: application/json

{
  "word": "apple",
  "language": "english"
}
```

### Get All Collections
```http
GET /api/collections
```

### Get Specific Collection
```http
GET /api/collections/:id
```

### Update Card Status
```http
PATCH /api/cards/:cardId/status
Content-Type: application/json

{
  "collectionId": "collection_xxx",
  "status": "reviewing"
}
```

### Delete Collection
```http
DELETE /api/collections/:id
```

## 🎨 Card Content

Each flashcard contains:

- **Word**: The target language word
- **Phonetics**: IPA (English, French) or Kana (Japanese)
- **Difficulty Level**: Beginner/Intermediate/Advanced
- **Definitions**: Multiple parts of speech and meanings, each including:
  - Part of speech tag
  - Chinese translation
  - Practical example sentences with translations
- **Learning Tips**: Memory techniques and usage notes (Markdown supported)
- **Etymology**: Word origin and word formation (optional)

### Language-Specific Content

**German**:
- Noun gender markers (der/die/das)
- Plural forms
- Verb conjugation information

**Japanese**:
- Kana notation (Hiragana/Katakana)
- Kanji writing
- Common collocations

**French**:
- Gender markers (m./f.)
- Verb conjugations
- Common phrases

## 🔧 Tech Stack

**Backend**:
- Node.js + Express
- Axios (HTTP client)
- dotenv (Environment variable management)

**Frontend**:
- Vanilla JavaScript (ES6+ modules)
- CSS3 (Animations and transitions)
- Fetch API
- Markdown rendering

**Storage**:
- JSON file storage (no database required)

**Deployment**:
- Docker + Docker Compose

## 📝 Data Format

### Collection File Structure
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
      "level": "Beginner",
      "language": "english",
      "definitions": [
        {
          "pos": "n.",
          "meaning": "apple (fruit)",
          "examples": [
            {
              "sentence": "I eat an apple every day.",
              "translation": "我每天吃一个苹果。"
            }
          ]
        }
      ],
      "tips": "**Memory Tip**: apple is one of the most common fruit words",
      "etymology": "From Old English æppel",
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

## 📄 License

MIT License

## 📮 Contact

For questions or suggestions, please create an Issue.

---

**🌟 If this project helps you, please give it a Star!**