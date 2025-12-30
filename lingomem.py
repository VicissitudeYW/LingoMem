"""
LingoMem - Multi-Language Vocabulary Learning System with MCP Integration

A spaced repetition system supporting multiple languages with isolated vocabularies.
Uses the SM-2 algorithm for optimal review scheduling.

Author: LingoMem Project
Version: 1.0.0
License: MIT
"""

import os
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent


# ============================================================================
# Database Configuration
# ============================================================================

def get_db_path() -> str:
    """
    Get the database file path with the following priority:
    1. Environment variable LINGOMEM_DB_PATH
    2. Script directory + vocab.db
    3. Fallback to ./vocab.db
    
    Returns:
        str: Absolute path to the database file
    """
    # Check environment variable first
    env_path = os.getenv("LINGOMEM_DB_PATH")
    if env_path:
        return env_path
    
    # Use script directory
    script_dir = Path(__file__).parent.absolute()
    return str(script_dir / "vocab.db")


def get_db_connection() -> sqlite3.Connection:
    """
    Create and return a database connection with proper configuration.
    
    Returns:
        sqlite3.Connection: Database connection with row_factory set
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Initialize database if needed
    init_db(conn)
    
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """
    Initialize the database schema if it doesn't exist.
    Creates the vocabulary table with multi-language support.
    
    Args:
        conn: Database connection
    """
    cursor = conn.cursor()
    
    # Create vocabulary table with composite primary key (word, lang)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vocabulary (
            word TEXT NOT NULL,
            lang TEXT NOT NULL,
            definition TEXT,
            repetition_count INTEGER DEFAULT 0,
            ease_factor REAL DEFAULT 2.5,
            interval INTEGER DEFAULT 0,
            last_reviewed DATE,
            next_review DATE DEFAULT CURRENT_DATE,
            PRIMARY KEY (word, lang)
        )
    """)
    
    # Create index for efficient review queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_next_review 
        ON vocabulary(lang, next_review)
    """)
    
    # Create index for language-based queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_lang 
        ON vocabulary(lang)
    """)
    
    conn.commit()


# ============================================================================
# Validation Functions
# ============================================================================

def validate_language(lang: str) -> bool:
    """
    Validate language code format (ISO 639-1: 2-letter lowercase).
    
    Args:
        lang: Language code to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return len(lang) == 2 and lang.islower() and lang.isalpha()


def validate_quality(quality: int) -> bool:
    """
    Validate quality score for SM-2 algorithm.
    
    Args:
        quality: Quality score (0-5)
        
    Returns:
        bool: True if valid, False otherwise
    """
    return 0 <= quality <= 5


# ============================================================================
# SM-2 Algorithm Implementation
# ============================================================================

def calculate_sm2(
    quality: int,
    repetition_count: int,
    ease_factor: float,
    interval: int
) -> tuple[int, float, int]:
    """
    Calculate next review parameters using the SM-2 algorithm.
    
    The SM-2 algorithm adjusts the review interval based on:
    - Quality of recall (0-5)
    - Number of successful repetitions
    - Ease factor (difficulty multiplier)
    
    Args:
        quality: Quality of recall (0-5)
        repetition_count: Number of successful repetitions
        ease_factor: Current ease factor
        interval: Current interval in days
        
    Returns:
        tuple: (new_repetition_count, new_ease_factor, new_interval)
    """
    if quality < 3:
        # Poor recall: reset the learning process
        new_repetition = 0
        new_interval = 0
        new_ease_factor = ease_factor  # Keep ease factor unchanged
    else:
        # Good recall: update parameters
        # Update ease factor based on quality
        new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        # Ensure ease factor doesn't go below 1.3
        new_ease_factor = max(1.3, new_ease_factor)
        
        # Update repetition count
        new_repetition = repetition_count + 1
        
        # Calculate new interval
        if new_repetition == 1:
            new_interval = 1
        elif new_repetition == 2:
            new_interval = 6
        else:
            new_interval = round(interval * new_ease_factor)
    
    return new_repetition, new_ease_factor, new_interval


# ============================================================================
# MCP Server Setup
# ============================================================================

app = Server("lingomem")


# ============================================================================
# Tool 1: Filter New Words
# ============================================================================

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools."""
    return [
        Tool(
            name="filter_new_words",
            description="Check which words from a candidate list don't exist in the specified language vocabulary",
            inputSchema={
                "type": "object",
                "properties": {
                    "candidate_words": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of words to check"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["candidate_words", "lang"]
            }
        ),
        Tool(
            name="add_words",
            description="Add new words to the specified language vocabulary",
            inputSchema={
                "type": "object",
                "properties": {
                    "words": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "word": {"type": "string"},
                                "definition": {"type": "string"}
                            },
                            "required": ["word", "definition"]
                        },
                        "description": "List of words with definitions to add"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["words", "lang"]
            }
        ),
        Tool(
            name="delete_word",
            description="Delete a word from the specified language vocabulary",
            inputSchema={
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word to delete"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["word", "lang"]
            }
        ),
        Tool(
            name="delete_all_words",
            description="Delete ALL words from a specific language vocabulary",
            inputSchema={
                "type": "object",
                "properties": {
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["lang"]
            }
        ),
        Tool(
            name="get_due_reviews",
            description="Get words that are due for review in the specified language",
            inputSchema={
                "type": "object",
                "properties": {
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of words to return (optional)",
                        "minimum": 1
                    }
                },
                "required": ["lang"]
            }
        ),
        Tool(
            name="submit_review",
            description="Submit a review result for a word and update its review schedule using SM-2 algorithm",
            inputSchema={
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word being reviewed"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "quality": {
                        "type": "integer",
                        "description": "Quality of recall (0=complete blackout, 5=perfect recall)",
                        "minimum": 0,
                        "maximum": 5
                    }
                },
                "required": ["word", "lang", "quality"]
            }
        ),
        Tool(
            name="get_statistics",
            description="Get learning statistics for a specific language",
            inputSchema={
                "type": "object",
                "properties": {
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["lang"]
            }
        ),
        Tool(
            name="list_all_words",
            description="List all words in a specific language vocabulary with optional sorting",
            inputSchema={
                "type": "object",
                "properties": {
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "sort_by": {
                        "type": "string",
                        "description": "Sort by: 'next_review', 'ease_factor', 'word', 'repetition_count'",
                        "enum": ["next_review", "ease_factor", "word", "repetition_count"]
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of words to return",
                        "minimum": 1
                    }
                },
                "required": ["lang"]
            }
        ),
        Tool(
            name="update_definition",
            description="Update the definition of an existing word",
            inputSchema={
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word to update"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "new_definition": {
                        "type": "string",
                        "description": "The new definition"
                    }
                },
                "required": ["word", "lang", "new_definition"]
            }
        ),
        Tool(
            name="search_words",
            description="Search for words in a specific language vocabulary",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "search_in": {
                        "type": "string",
                        "description": "Where to search: 'word', 'definition', or 'both'",
                        "enum": ["word", "definition", "both"]
                    }
                },
                "required": ["query", "lang"]
            }
        ),
        Tool(
            name="reset_word_progress",
            description="Reset the learning progress of a specific word",
            inputSchema={
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word to reset"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    }
                },
                "required": ["word", "lang"]
            }
        ),
        Tool(
            name="import_from_text",
            description="Batch import words from text with format: word - definition (one per line)",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Text containing words in format: word - definition"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (ISO 639-1, e.g., 'en', 'ja', 'fr')"
                    },
                    "separator": {
                        "type": "string",
                        "description": "Line separator (default: newline)"
                    }
                },
                "required": ["text", "lang"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "filter_new_words":
            result = await filter_new_words(**arguments)
        elif name == "add_words":
            result = await add_words(**arguments)
        elif name == "delete_word":
            result = await delete_word(**arguments)
        elif name == "delete_all_words":
            result = await delete_all_words(**arguments)
        elif name == "get_due_reviews":
            result = await get_due_reviews(**arguments)
        elif name == "submit_review":
            result = await submit_review(**arguments)
        elif name == "get_statistics":
            result = await get_statistics(**arguments)
        elif name == "list_all_words":
            result = await list_all_words(**arguments)
        elif name == "update_definition":
            result = await update_definition(**arguments)
        elif name == "search_words":
            result = await search_words(**arguments)
        elif name == "reset_word_progress":
            result = await reset_word_progress(**arguments)
        elif name == "import_from_text":
            result = await import_from_text(**arguments)
        else:
            raise ValueError(f"Unknown tool: {name}")
        
        return [TextContent(type="text", text=str(result))]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def filter_new_words(candidate_words: list[str], lang: str) -> list[str]:
    """
    Filter out words that already exist in the database for the specified language.
    
    Args:
        candidate_words: List of words to check
        lang: Language code
        
    Returns:
        list: Words that don't exist in the database
        
    Raises:
        ValueError: If language code is invalid or candidate_words is empty
    """
    if not candidate_words:
        raise ValueError("candidate_words cannot be empty")
    
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create placeholders for SQL IN clause
    placeholders = ','.join('?' * len(candidate_words))
    query = f"SELECT word FROM vocabulary WHERE lang = ? AND word IN ({placeholders})"
    
    cursor.execute(query, [lang] + candidate_words)
    existing_words = {row['word'] for row in cursor.fetchall()}
    
    conn.close()
    
    # Return words that are NOT in the database
    new_words = [word for word in candidate_words if word not in existing_words]
    return new_words


async def add_words(words: list[dict], lang: str) -> dict:
    """
    Add new words to the vocabulary database for the specified language.
    
    Args:
        words: List of dictionaries with 'word' and 'definition' keys
        lang: Language code
        
    Returns:
        dict: Result with success status, count, and message
        
    Raises:
        ValueError: If language code is invalid or words list is invalid
    """
    if not words:
        raise ValueError("words list cannot be empty")
    
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    # Validate word format
    for word_dict in words:
        if 'word' not in word_dict or 'definition' not in word_dict:
            raise ValueError("Each word must have 'word' and 'definition' keys")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Prepare data for insertion
    today = date.today().isoformat()
    values = [
        (word_dict['word'], lang, word_dict['definition'], today)
        for word_dict in words
    ]
    
    # Insert with conflict handling (update definition if word exists)
    cursor.executemany("""
        INSERT INTO vocabulary (word, lang, definition, next_review)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(word, lang) DO UPDATE SET
            definition = excluded.definition
    """, values)
    
    conn.commit()
    added_count = cursor.rowcount
    conn.close()
    
    return {
        "success": True,
        "added_count": added_count,
        "message": f"Successfully added {added_count} words to '{lang}' vocabulary"
    }


async def delete_word(word: str, lang: str) -> dict:
    """
    Delete a word from the vocabulary database for the specified language.
    
    Args:
        word: The word to delete
        lang: Language code
        
    Returns:
        dict: Result with success status and message
        
    Raises:
        ValueError: If language code is invalid or word doesn't exist
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if word exists
    cursor.execute("""
        SELECT word FROM vocabulary
        WHERE word = ? AND lang = ?
    """, (word, lang))
    
    if not cursor.fetchone():
        conn.close()
        raise ValueError(f"Word '{word}' not found in '{lang}' vocabulary")
    
    # Delete the word
    cursor.execute("""
        DELETE FROM vocabulary
        WHERE word = ? AND lang = ?
    """, (word, lang))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "word": word,
        "lang": lang,
        "message": f"Successfully deleted '{word}' from '{lang}' vocabulary"
    }


async def delete_all_words(lang: str) -> dict:
    """
    Delete ALL words from a specific language vocabulary.
    
    Args:
        lang: Language code
        
    Returns:
        dict: Result with success status, count, and message
        
    Raises:
        ValueError: If language code is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Count words before deletion
    cursor.execute("""
        SELECT COUNT(*) as count FROM vocabulary
        WHERE lang = ?
    """, (lang,))
    
    count = cursor.fetchone()['count']
    
    if count == 0:
        conn.close()
        return {
            "success": True,
            "deleted_count": 0,
            "lang": lang,
            "message": f"No words found in '{lang}' vocabulary"
        }
    
    # Delete all words
    cursor.execute("""
        DELETE FROM vocabulary
        WHERE lang = ?
    """, (lang,))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "deleted_count": count,
        "lang": lang,
        "message": f"Successfully deleted all {count} words from '{lang}' vocabulary"
    }


async def get_due_reviews(lang: str, limit: int = None) -> dict:
    """
    Get words that are due for review in the specified language.
    
    Args:
        lang: Language code
        limit: Maximum number of words to return (optional)
        
    Returns:
        dict: Dictionary with 'due_words' list and 'total_count'
        
    Raises:
        ValueError: If language code is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    if limit is not None and limit < 1:
        raise ValueError("limit must be a positive integer")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query for due words
    today = date.today().isoformat()
    query = """
        SELECT word, definition, last_reviewed, repetition_count
        FROM vocabulary
        WHERE lang = ? AND next_review <= ?
        ORDER BY next_review ASC
    """
    
    if limit is not None:
        query += f" LIMIT {limit}"
    
    cursor.execute(query, (lang, today))
    rows = cursor.fetchall()
    
    conn.close()
    
    # Format results
    due_words = [
        {
            "word": row['word'],
            "definition": row['definition'],
            "last_reviewed": row['last_reviewed'],
            "repetition_count": row['repetition_count']
        }
        for row in rows
    ]
    
    return {
        "due_words": due_words,
        "total_count": len(due_words)
    }


async def submit_review(word: str, lang: str, quality: int) -> dict:
    """
    Submit a review result and update the word's review schedule using SM-2 algorithm.
    
    Args:
        word: The word being reviewed
        lang: Language code
        quality: Quality of recall (0-5)
        
    Returns:
        dict: Updated word information including next review date
        
    Raises:
        ValueError: If parameters are invalid or word doesn't exist
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    if not validate_quality(quality):
        raise ValueError(f"Quality must be between 0 and 5, got {quality}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current word state
    cursor.execute("""
        SELECT repetition_count, ease_factor, interval
        FROM vocabulary
        WHERE word = ? AND lang = ?
    """, (word, lang))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Word '{word}' not found in '{lang}' vocabulary")
    
    # Calculate new parameters using SM-2 algorithm
    current_repetition = row['repetition_count']
    current_ease = row['ease_factor']
    current_interval = row['interval']
    
    new_repetition, new_ease, new_interval = calculate_sm2(
        quality, current_repetition, current_ease, current_interval
    )
    
    # Calculate next review date
    today = date.today()
    next_review = today + timedelta(days=new_interval)
    
    # Update database
    cursor.execute("""
        UPDATE vocabulary
        SET repetition_count = ?,
            ease_factor = ?,
            interval = ?,
            last_reviewed = ?,
            next_review = ?
        WHERE word = ? AND lang = ?
    """, (
        new_repetition,
        new_ease,
        new_interval,
        today.isoformat(),
        next_review.isoformat(),
        word,
        lang
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "word": word,
        "lang": lang,
        "next_review": next_review.isoformat(),
        "interval": new_interval,
        "ease_factor": round(new_ease, 2),
        "repetition_count": new_repetition
    }


async def get_statistics(lang: str) -> dict:
    """
    Get learning statistics for a specific language.
    
    Args:
        lang: Language code
        
    Returns:
        dict: Statistics including total words, due words, mastered words, etc.
        
    Raises:
        ValueError: If language code is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total words
    cursor.execute("SELECT COUNT(*) as count FROM vocabulary WHERE lang = ?", (lang,))
    total_words = cursor.fetchone()['count']
    
    # Due words today
    today = date.today().isoformat()
    cursor.execute("""
        SELECT COUNT(*) as count FROM vocabulary
        WHERE lang = ? AND next_review <= ?
    """, (lang, today))
    due_today = cursor.fetchone()['count']
    
    # Mastered words (repetition_count >= 3)
    cursor.execute("""
        SELECT COUNT(*) as count FROM vocabulary
        WHERE lang = ? AND repetition_count >= 3
    """, (lang,))
    mastered = cursor.fetchone()['count']
    
    # Average ease factor
    cursor.execute("""
        SELECT AVG(ease_factor) as avg_ease FROM vocabulary
        WHERE lang = ?
    """, (lang,))
    avg_ease = cursor.fetchone()['avg_ease'] or 2.5
    
    # Difficult words (ease_factor < 2.0)
    cursor.execute("""
        SELECT COUNT(*) as count FROM vocabulary
        WHERE lang = ? AND ease_factor < 2.0
    """, (lang,))
    difficult_words = cursor.fetchone()['count']
    
    conn.close()
    
    return {
        "lang": lang,
        "total_words": total_words,
        "due_today": due_today,
        "mastered_words": mastered,
        "difficult_words": difficult_words,
        "average_ease_factor": round(avg_ease, 2),
        "mastery_rate": round((mastered / total_words * 100) if total_words > 0 else 0, 1)
    }


async def list_all_words(lang: str, sort_by: str = "next_review", limit: int = None) -> dict:
    """
    List all words in a specific language vocabulary.
    
    Args:
        lang: Language code
        sort_by: Sort field (next_review, ease_factor, word, repetition_count)
        limit: Maximum number of words to return
        
    Returns:
        dict: List of words with their information
        
    Raises:
        ValueError: If language code is invalid or sort_by is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    valid_sorts = ["next_review", "ease_factor", "word", "repetition_count"]
    if sort_by not in valid_sorts:
        raise ValueError(f"Invalid sort_by: {sort_by}. Must be one of {valid_sorts}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = f"""
        SELECT word, definition, repetition_count, ease_factor,
               interval, last_reviewed, next_review
        FROM vocabulary
        WHERE lang = ?
        ORDER BY {sort_by}
    """
    
    if limit is not None:
        query += f" LIMIT {limit}"
    
    cursor.execute(query, (lang,))
    rows = cursor.fetchall()
    
    conn.close()
    
    words = [
        {
            "word": row['word'],
            "definition": row['definition'],
            "repetition_count": row['repetition_count'],
            "ease_factor": round(row['ease_factor'], 2),
            "interval": row['interval'],
            "last_reviewed": row['last_reviewed'],
            "next_review": row['next_review']
        }
        for row in rows
    ]
    
    return {
        "lang": lang,
        "total_count": len(words),
        "words": words
    }


async def update_definition(word: str, lang: str, new_definition: str) -> dict:
    """
    Update the definition of an existing word.
    
    Args:
        word: The word to update
        lang: Language code
        new_definition: The new definition
        
    Returns:
        dict: Success status and message
        
    Raises:
        ValueError: If language code is invalid or word doesn't exist
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if word exists
    cursor.execute("""
        SELECT word FROM vocabulary
        WHERE word = ? AND lang = ?
    """, (word, lang))
    
    if not cursor.fetchone():
        conn.close()
        raise ValueError(f"Word '{word}' not found in '{lang}' vocabulary")
    
    # Update definition
    cursor.execute("""
        UPDATE vocabulary
        SET definition = ?
        WHERE word = ? AND lang = ?
    """, (new_definition, word, lang))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "word": word,
        "lang": lang,
        "new_definition": new_definition,
        "message": f"Successfully updated definition for '{word}'"
    }


async def search_words(query: str, lang: str, search_in: str = "both") -> dict:
    """
    Search for words in a specific language vocabulary.
    
    Args:
        query: Search query
        lang: Language code
        search_in: Where to search (word, definition, both)
        
    Returns:
        dict: List of matching words
        
    Raises:
        ValueError: If language code is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    valid_search_in = ["word", "definition", "both"]
    if search_in not in valid_search_in:
        raise ValueError(f"Invalid search_in: {search_in}. Must be one of {valid_search_in}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build search query
    if search_in == "word":
        sql_query = """
            SELECT word, definition, repetition_count, next_review
            FROM vocabulary
            WHERE lang = ? AND word LIKE ?
        """
    elif search_in == "definition":
        sql_query = """
            SELECT word, definition, repetition_count, next_review
            FROM vocabulary
            WHERE lang = ? AND definition LIKE ?
        """
    else:  # both
        sql_query = """
            SELECT word, definition, repetition_count, next_review
            FROM vocabulary
            WHERE lang = ? AND (word LIKE ? OR definition LIKE ?)
        """
    
    search_pattern = f"%{query}%"
    if search_in == "both":
        cursor.execute(sql_query, (lang, search_pattern, search_pattern))
    else:
        cursor.execute(sql_query, (lang, search_pattern))
    
    rows = cursor.fetchall()
    conn.close()
    
    results = [
        {
            "word": row['word'],
            "definition": row['definition'],
            "repetition_count": row['repetition_count'],
            "next_review": row['next_review']
        }
        for row in rows
    ]
    
    return {
        "query": query,
        "lang": lang,
        "search_in": search_in,
        "results_count": len(results),
        "results": results
    }


async def reset_word_progress(word: str, lang: str) -> dict:
    """
    Reset the learning progress of a specific word.
    
    Args:
        word: The word to reset
        lang: Language code
        
    Returns:
        dict: Success status and message
        
    Raises:
        ValueError: If language code is invalid or word doesn't exist
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if word exists
    cursor.execute("""
        SELECT word FROM vocabulary
        WHERE word = ? AND lang = ?
    """, (word, lang))
    
    if not cursor.fetchone():
        conn.close()
        raise ValueError(f"Word '{word}' not found in '{lang}' vocabulary")
    
    # Reset progress
    today = date.today().isoformat()
    cursor.execute("""
        UPDATE vocabulary
        SET repetition_count = 0,
            ease_factor = 2.5,
            interval = 0,
            last_reviewed = NULL,
            next_review = ?
        WHERE word = ? AND lang = ?
    """, (today, word, lang))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "word": word,
        "lang": lang,
        "message": f"Successfully reset progress for '{word}'"
    }


async def import_from_text(text: str, lang: str, separator: str = "\n") -> dict:
    """
    Batch import words from text.
    
    Expected format: word - definition (one per line)
    Example:
        apple - 苹果
        banana - 香蕉
    
    Args:
        text: Text containing words
        lang: Language code
        separator: Line separator (default: newline)
        
    Returns:
        dict: Import results with success and failure counts
        
    Raises:
        ValueError: If language code is invalid
    """
    if not validate_language(lang):
        raise ValueError(f"Invalid language code: {lang}. Must be ISO 639-1 format (e.g., 'en', 'ja')")
    
    lines = text.split(separator)
    words_to_add = []
    failed_lines = []
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
        
        # Parse "word - definition" format
        if " - " in line:
            parts = line.split(" - ", 1)
            word = parts[0].strip()
            definition = parts[1].strip()
            
            if word and definition:
                words_to_add.append({"word": word, "definition": definition})
            else:
                failed_lines.append(f"Line {i}: Empty word or definition")
        else:
            failed_lines.append(f"Line {i}: Invalid format (expected 'word - definition')")
    
    # Add words
    if words_to_add:
        result = await add_words(words_to_add, lang)
        success_count = result['added_count']
    else:
        success_count = 0
    
    return {
        "success": True,
        "lang": lang,
        "imported_count": success_count,
        "failed_count": len(failed_lines),
        "failed_lines": failed_lines[:10],  # Show first 10 errors
        "message": f"Successfully imported {success_count} words, {len(failed_lines)} failed"
    }


# ============================================================================
# Main Entry Point
# ============================================================================

async def main():
    """Main entry point for the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())