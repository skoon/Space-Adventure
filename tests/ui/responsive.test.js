import fs from 'fs';
import path from 'path';
import {
    MOBILE_TABS,
    getActiveMobileTab,
    switchMobileTab,
    initMobileUI
} from '../../systems/ui/mobile-ui.js';

describe('Responsive Single-Screen & Mobile Cockpit UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        switchMobileTab('bridge');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        switchMobileTab('bridge');
    });

    describe('mobile-ui module', () => {
        test('MOBILE_TABS exports the four cockpit tabs in expected order', () => {
            expect(MOBILE_TABS).toEqual(['bridge', 'actions', 'cargo', 'status']);
        });

        test('getActiveMobileTab defaults to bridge and updates on switchMobileTab', () => {
            expect(getActiveMobileTab()).toBe('bridge');
            expect(switchMobileTab('actions')).toBe('actions');
            expect(getActiveMobileTab()).toBe('actions');
            expect(switchMobileTab('cargo')).toBe('cargo');
            expect(getActiveMobileTab()).toBe('cargo');
            expect(switchMobileTab('status')).toBe('status');
            expect(getActiveMobileTab()).toBe('status');
        });

        test('switchMobileTab falls back to bridge on invalid or missing tab names', () => {
            switchMobileTab('cargo');
            expect(getActiveMobileTab()).toBe('cargo');

            expect(switchMobileTab('invalid_tab')).toBe('bridge');
            expect(getActiveMobileTab()).toBe('bridge');

            switchMobileTab('actions');
            expect(switchMobileTab(null)).toBe('bridge');
            expect(getActiveMobileTab()).toBe('bridge');

            switchMobileTab('status');
            expect(switchMobileTab(undefined)).toBe('bridge');
            expect(getActiveMobileTab()).toBe('bridge');
        });

        test('switchMobileTab syncs #exploringScreen data-mobile-tab, .active class, and aria-selected', () => {
            document.body.innerHTML = `
                <div id="exploringScreen" data-mobile-tab="bridge">
                    <nav id="mobileNavBar">
                        <button data-mobile-tab-btn="bridge" aria-selected="true" class="mobile-nav-btn active"></button>
                        <button data-mobile-tab-btn="actions" aria-selected="false" class="mobile-nav-btn"></button>
                        <button data-mobile-tab-btn="cargo" aria-selected="false" class="mobile-nav-btn"></button>
                        <button data-mobile-tab-btn="status" aria-selected="false" class="mobile-nav-btn"></button>
                    </nav>
                </div>
            `;

            switchMobileTab('cargo');

            const screen = document.getElementById('exploringScreen');
            expect(screen.getAttribute('data-mobile-tab')).toBe('cargo');

            const bridgeBtn = document.querySelector('[data-mobile-tab-btn="bridge"]');
            const actionsBtn = document.querySelector('[data-mobile-tab-btn="actions"]');
            const cargoBtn = document.querySelector('[data-mobile-tab-btn="cargo"]');
            const statusBtn = document.querySelector('[data-mobile-tab-btn="status"]');

            expect(bridgeBtn.classList.contains('active')).toBe(false);
            expect(bridgeBtn.getAttribute('aria-selected')).toBe('false');

            expect(actionsBtn.classList.contains('active')).toBe(false);
            expect(actionsBtn.getAttribute('aria-selected')).toBe('false');

            expect(cargoBtn.classList.contains('active')).toBe(true);
            expect(cargoBtn.getAttribute('aria-selected')).toBe('true');

            expect(statusBtn.classList.contains('active')).toBe(false);
            expect(statusBtn.getAttribute('aria-selected')).toBe('false');
        });

        test('initMobileUI applies current active tab to the DOM', () => {
            switchMobileTab('status');
            document.body.innerHTML = `
                <div id="exploringScreen" data-mobile-tab="bridge">
                    <nav id="mobileNavBar">
                        <button data-mobile-tab-btn="bridge" aria-selected="true" class="active"></button>
                        <button data-mobile-tab-btn="status" aria-selected="false"></button>
                    </nav>
                </div>
            `;

            const result = initMobileUI();
            expect(result).toBe('status');
            expect(document.getElementById('exploringScreen').getAttribute('data-mobile-tab')).toBe('status');
            expect(document.querySelector('[data-mobile-tab-btn="status"]').classList.contains('active')).toBe(true);
            expect(document.querySelector('[data-mobile-tab-btn="status"]').getAttribute('aria-selected')).toBe('true');
            expect(document.querySelector('[data-mobile-tab-btn="bridge"]').classList.contains('active')).toBe(false);
        });
    });

    describe('index.html and responsive.css structure', () => {
        const rootDir = path.join(__dirname, '..', '..');
        const indexPath = path.join(rootDir, 'index.html');
        const cssPath = path.join(rootDir, 'assets', 'css', 'responsive.css');

        test('index.html links responsive.css after theme.css', () => {
            const html = fs.readFileSync(indexPath, 'utf8');
            const themeIdx = html.indexOf('assets/css/theme.css');
            const responsiveIdx = html.indexOf('assets/css/responsive.css');

            expect(themeIdx).toBeGreaterThan(-1);
            expect(responsiveIdx).toBeGreaterThan(themeIdx);
        });

        test('index.html contains #exploringScreen[data-mobile-tab="bridge"], #mobileNavBar with all 4 tab buttons, and all critical DOM IDs', () => {
            const html = fs.readFileSync(indexPath, 'utf8');
            document.documentElement.innerHTML = html;

            const exploringScreen = document.getElementById('exploringScreen');
            expect(exploringScreen).not.toBeNull();
            expect(exploringScreen.getAttribute('data-mobile-tab')).toBe('bridge');

            const mobileNavBar = document.getElementById('mobileNavBar');
            expect(mobileNavBar).not.toBeNull();

            MOBILE_TABS.forEach((tab) => {
                const btn = mobileNavBar.querySelector(`[data-mobile-tab-btn="${tab}"]`);
                expect(btn).not.toBeNull();
            });

            const criticalIds = [
                'hud-container',
                'hpBar',
                'xpBar',
                'missionLog',
                'inventory',
                'viewscreenPanel',
                'combatLog',
                'derelictScreen'
            ];

            criticalIds.forEach((id) => {
                expect(document.getElementById(id)).not.toBeNull();
            });
        });

        test('responsive.css defines viewport lock (100dvh) and mobile breakpoint (max-width: 767px)', () => {
            expect(fs.existsSync(cssPath)).toBe(true);
            const css = fs.readFileSync(cssPath, 'utf8');

            expect(css).toContain('100dvh');
            expect(css).toContain('max-width: 767px');
        });
    });
});
