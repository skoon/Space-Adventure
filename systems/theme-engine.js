/**
 * Generic Game Engine - Theme & Skinning Module
 * Manages game aesthetics, localized terminology, and dynamic string translations.
 */

import { theme } from '../data/theme.js';

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
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
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
        const match = el.innerHTML.trim().match(/^([\u2300-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/);
        if (match) {
            // Keep the emoji, replace the text
            const emoji = match[0];
            const cleanTerm = termText.replace(/^([\u2300-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*/, "");
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
}
