/**
 * Mobile Cockpit Tab Controller
 * Manages responsive tab state on mobile viewports (< 768px).
 */

export const MOBILE_TABS = ['bridge', 'actions', 'cargo', 'status'];

let activeMobileTab = 'bridge';

/**
 * Returns the currently selected mobile cockpit tab.
 * @returns {string}
 */
export function getActiveMobileTab() {
    return activeMobileTab;
}

/**
 * Switches the active mobile cockpit tab and syncs DOM attributes/state.
 * Falls back to 'bridge' if an invalid or missing tab name is supplied.
 * @param {string} tabName
 * @returns {string}
 */
export function switchMobileTab(tabName) {
    const targetTab = MOBILE_TABS.includes(tabName) ? tabName : 'bridge';
    activeMobileTab = targetTab;

    if (typeof document !== 'undefined') {
        const exploringScreen = document.getElementById('exploringScreen');
        if (exploringScreen) {
            exploringScreen.setAttribute('data-mobile-tab', targetTab);
        }

        const buttons = document.querySelectorAll('[data-mobile-tab-btn]');
        buttons.forEach((btn) => {
            const btnTab = btn.getAttribute('data-mobile-tab-btn');
            const isActive = btnTab === targetTab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    return targetTab;
}

/**
 * Initializes mobile cockpit navigation state.
 */
export function initMobileUI() {
    return switchMobileTab(getActiveMobileTab());
}
