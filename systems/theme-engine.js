/**
 * Generic Game Engine - Theme & Skinning Module
 * Manages game aesthetics, localized terminology, and dynamic string translations.
 */

import { theme } from '../data/theme.js';
import { locales, SUPPORTED_LOCALES } from '../data/locales.js';

let currentLocale = 'en';

/**
 * Get active locale
 */
export function getLocale() {
    return currentLocale;
}

/**
 * Set active locale (validates against SUPPORTED_LOCALES, falls back to 'en')
 */
export function setLocale(lang) {
    if (typeof lang === 'string' && SUPPORTED_LOCALES.includes(lang.toLowerCase())) {
        currentLocale = lang.toLowerCase();
    } else {
        currentLocale = 'en';
    }
    return currentLocale;
}

/**
 * Translate a UI key using active locale dictionary, falling back to English, then key itself
 */
export function localize(key) {
    return locales[currentLocale]?.[key] ?? locales.en?.[key] ?? key;
}

const EMOJI_PREFIX_RE = /^((?:[\u2300-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\uFE0F?)\s+/;

/**
 * Rewrite all [data-i18n] DOM elements using active locale, preserving leading emojis and data-term tokens
 */
export function applyLocaleToDOM() {
    if (typeof document === 'undefined') return;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;

        const trimmed = (el.textContent || '').trim();
        const emojiMatch = trimmed.match(EMOJI_PREFIX_RE);
        const leadingEmoji = emojiMatch ? emojiMatch[1] : null;

        if (currentLocale === 'en' && el.hasAttribute('data-term')) {
            const termText = tToken(el.getAttribute('data-term'));
            if (leadingEmoji && !EMOJI_PREFIX_RE.test(termText)) {
                el.textContent = `${leadingEmoji} ${termText}`;
            } else {
                el.textContent = termText;
            }
            return;
        }

        const localized = localize(key);
        if (leadingEmoji && !EMOJI_PREFIX_RE.test(localized)) {
            el.textContent = `${leadingEmoji} ${localized}`;
        } else {
            el.textContent = localized;
        }
    });
}

/**
 * Get active theme ID (default to space)
 */
export function getActiveTheme() {
    return 'space';
}

/**
 * Set active theme ID (no-op since theme is driven statically by data files)
 */
export function setTheme(themeId) {
    // No-op in generic engine
}

/**
 * Translate a terminology token using the loaded theme config
 */
export function tToken(token) {
    return theme[token] || token;
}

/**
 * Dynamic string translation
 * Performs dictionary lookups on theme.vocab with word boundary and case preservation checks.
 */
export function t(text) {
    if (typeof text !== 'string' || !text) return text;
    let translated = text;
    
    // Sort vocabulary keys by length descending to prevent partial matching bugs
    const vocabKeys = Object.keys(theme.vocab || {}).sort((a, b) => b.length - a.length);
    
    vocabKeys.forEach(key => {
        // Escapes special regex characters in the vocabulary key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Apply word boundary checks only if the key starts/ends with a word character
        const startBound = /^\w/.test(key) ? '\\b' : '';
        const endBound = /\w$/.test(key) ? '\\b' : '';
        const regex = new RegExp(`${startBound}${escapedKey}${endBound}`, 'gi');
        
        translated = translated.replace(regex, (match) => {
            const replacement = theme.vocab[key];
            
            // 1. Preserve ALL CAPS
            if (match === match.toUpperCase()) return replacement.toUpperCase();
            
            // 2. Preserve Title Case for multi-word strings (e.g. "Deflector Shields")
            const isTitle = match.split(' ').every(word => !word || word[0] === word[0].toUpperCase());
            if (isTitle) {
                return replacement.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            
            // 3. Preserve Capitalized (first word capitalized)
            if (match[0] === match[0].toUpperCase()) {
                return replacement.charAt(0).toUpperCase() + replacement.slice(1);
            }
            
            // 4. Default to lowercase
            return replacement.toLowerCase();
        });
    });
    
    return translated;
}

/**
 * Apply the terminology of the active theme to the DOM
 */
export function applyThemeToDOM() {
    // 1. Find all elements with data-term and translate them
    const elements = document.querySelectorAll('[data-term]');
    elements.forEach(el => {
        const token = el.getAttribute('data-term');
        const termText = tToken(token);
        
        // Preserve emoji if any
        const match = el.innerHTML.trim().match(/^((?:[\u2300-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\uFE0F?)/);
        if (match) {
            // Keep the emoji, replace the text
            const emoji = match[0];
            const cleanTerm = termText.replace(/^((?:[\u2300-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\uFE0F?)\s*/, "");
            el.innerHTML = `${emoji} ${cleanTerm}`;
        } else {
            el.textContent = termText;
        }
    });

    // 2. Set document title
    document.title = theme.gameTitle || "Galactic Odyssey - Sci-Fi Adventure Game";
    
    // Ensure body doesn't have fantasy class
    document.body.classList.remove('theme-fantasy');
    const styleSheet = document.getElementById('fantasyThemeStyles');
    if (styleSheet) {
        styleSheet.remove();
    }

    applyLocaleToDOM();
}
