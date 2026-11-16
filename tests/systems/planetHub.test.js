/**
 * @jest-environment jsdom
 */

import {
    BIOME_PALETTES,
    getBiomePalette,
    projectOrbitalPoint,
    initPlanetHub,
    disposePlanetHub
} from '../../systems/ui/planet-hub.js';
import { initDistrictsUI, renderDistricts, closeDistricts } from '../../systems/ui/districts-ui.js';

describe('Planet Hub UI System', () => {
    afterEach(() => {
        disposePlanetHub();
        jest.clearAllMocks();
    });

    describe('BIOME_PALETTES and getBiomePalette', () => {
        const requiredBiomes = [
            'terra_prime',
            'xylo_delta',
            'nebula_outpost',
            'norkon_outpost',
            'derelict',
            'inferno_ix',
            'crio_prime',
            'default'
        ];

        test('contains all required planetary biomes', () => {
            requiredBiomes.forEach(biome => {
                expect(BIOME_PALETTES[biome]).toBeDefined();
                expect(BIOME_PALETTES[biome].primary).toBeDefined();
                expect(BIOME_PALETTES[biome].secondary).toBeDefined();
                expect(BIOME_PALETTES[biome].atmosphere).toBeDefined();
                expect(BIOME_PALETTES[biome].beacon).toBeDefined();
            });
        });

        test('getBiomePalette returns correct palette for known locations', () => {
            expect(getBiomePalette('terra_prime')).toBe(BIOME_PALETTES.terra_prime);
            expect(getBiomePalette('xylo_delta')).toBe(BIOME_PALETTES.xylo_delta);
            expect(getBiomePalette('inferno_ix')).toBe(BIOME_PALETTES.inferno_ix);
            expect(getBiomePalette('crio_prime')).toBe(BIOME_PALETTES.crio_prime);
            expect(getBiomePalette('nebula_outpost')).toBe(BIOME_PALETTES.nebula_outpost);
            expect(getBiomePalette('norkon_outpost')).toBe(BIOME_PALETTES.norkon_outpost);
            expect(getBiomePalette('derelict')).toBe(BIOME_PALETTES.derelict);
        });

        test('getBiomePalette supports passing location object with id', () => {
            expect(getBiomePalette({ id: 'terra_prime' })).toBe(BIOME_PALETTES.terra_prime);
        });

        test('getBiomePalette returns default palette for unknown or null location', () => {
            expect(getBiomePalette('unknown_sector_99')).toBe(BIOME_PALETTES.default);
            expect(getBiomePalette(null)).toBe(BIOME_PALETTES.default);
            expect(getBiomePalette(undefined)).toBe(BIOME_PALETTES.default);
            expect(getBiomePalette({})).toBe(BIOME_PALETTES.default);
        });
    });

    describe('projectOrbitalPoint', () => {
        test('returns valid 2D coordinates, depth z, scale, and visible flag', () => {
            const res = projectOrbitalPoint(0, 100, 0.4, 200, 100);
            expect(typeof res.x).toBe('number');
            expect(typeof res.y).toBe('number');
            expect(typeof res.z).toBe('number');
            expect(typeof res.scale).toBe('number');
            expect(typeof res.visible).toBe('boolean');
        });

        test('calculates correct values at angle = 0', () => {
            const res = projectOrbitalPoint(0, 100, 0.4, 200, 100);
            // cos(0) = 1, sin(0) = 0
            expect(res.x).toBeCloseTo(300);
            expect(res.y).toBeCloseTo(100);
            expect(res.z).toBeCloseTo(0);
            expect(res.scale).toBeCloseTo(1);
            expect(res.visible).toBe(true);
        });

        test('projects front hemisphere (z > 0) with scale > 1 and visible = true', () => {
            const angle = Math.PI / 2; // pointing toward camera
            const res = projectOrbitalPoint(angle, 100, 0.38, 200, 100);
            expect(res.x).toBeCloseTo(200);
            expect(res.y).toBeGreaterThan(100);
            expect(res.z).toBeGreaterThan(0);
            expect(res.scale).toBeGreaterThan(1);
            expect(res.visible).toBe(true);
        });

        test('projects back hemisphere (z < 0) with scale < 1 and visible = false', () => {
            const angle = 3 * Math.PI / 2; // pointing away from camera
            const res = projectOrbitalPoint(angle, 100, 0.38, 200, 100);
            expect(res.x).toBeCloseTo(200);
            expect(res.y).toBeLessThan(100);
            expect(res.z).toBeLessThan(0);
            expect(res.scale).toBeLessThan(1);
            expect(res.visible).toBe(false);
        });

        test('handles zero radius safely', () => {
            const res = projectOrbitalPoint(Math.PI / 4, 0, 0.38, 150, 75);
            expect(res.x).toBe(150);
            expect(res.y).toBe(75);
            expect(res.z).toBe(0);
            expect(res.scale).toBe(1);
            expect(res.visible).toBe(true);
        });
    });

    describe('initPlanetHub', () => {
        test('returns null gracefully when canvas is null or undefined', () => {
            expect(initPlanetHub(null, 'terra_prime', [])).toBeNull();
            expect(initPlanetHub(undefined, 'terra_prime', [])).toBeNull();
        });

        test('returns null gracefully when canvas.getContext is missing or not a function', () => {
            const fakeCanvas = {};
            expect(initPlanetHub(fakeCanvas, 'terra_prime', [])).toBeNull();
        });

        test('returns null gracefully when canvas.getContext("2d") returns null (default in jsdom)', () => {
            const canvas = document.createElement('canvas');
            // jsdom getContext('2d') returns null by default without jest-canvas-mock
            expect(canvas.getContext('2d')).toBeNull();
            const result = initPlanetHub(canvas, 'terra_prime', []);
            expect(result).toBeNull();
        });

        test('renders a frame and dispatches onSelectDistrict when getContext("2d") is mocked and canvas is clicked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 420;
            canvas.height = 180;

            const mockCtx = {
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                arc: jest.fn(),
                rect: jest.fn(),
                fillRect: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                save: jest.fn(),
                restore: jest.fn(),
                clip: jest.fn(),
                ellipse: jest.fn(),
                setLineDash: jest.fn(),
                fillText: jest.fn(),
                measureText: jest.fn().mockReturnValue({ width: 50 }),
                createRadialGradient: jest.fn().mockReturnValue({
                    addColorStop: jest.fn()
                })
            };

            canvas.getContext = jest.fn((type) => {
                if (type === '2d') return mockCtx;
                return null;
            });

            // Mock getBoundingClientRect for consistent click coordinate math
            canvas.getBoundingClientRect = jest.fn(() => ({
                left: 0,
                top: 0,
                width: 420,
                height: 180,
                right: 420,
                bottom: 180
            }));

            const testDistricts = [
                { id: 'fed_hq', name: 'Federation HQ', icon: '🏢' },
                { id: 'bazaar', name: 'Bazaar', icon: '🛍️' }
            ];

            const onSelectDistrict = jest.fn();

            const controller = initPlanetHub(canvas, 'terra_prime', testDistricts, onSelectDistrict);
            expect(controller).not.toBeNull();
            expect(typeof controller.renderFrame).toBe('function');
            expect(typeof controller.destroy).toBe('function');

            // Verify initial frame rendered
            expect(mockCtx.clearRect).toHaveBeenCalled();
            expect(mockCtx.beginPath).toHaveBeenCalled();

            // Calculate expected coordinate of first district beacon (at angle 0)
            // W = 420, H = 180, centerX = 210, centerY = 90
            // globeRadius = 90 * 0.52 = 46.8, orbitalRadius = 46.8 * 1.75 = 81.9
            // At angle 0: x = 210 + 81.9 = 291.9, y = 90
            const clickEvent = new MouseEvent('click', {
                clientX: 292,
                clientY: 90
            });
            canvas.dispatchEvent(clickEvent);

            expect(onSelectDistrict).toHaveBeenCalledTimes(1);
            expect(onSelectDistrict).toHaveBeenCalledWith(testDistricts[0]);

            // Test mousemove hovering updates cursor
            const moveEvent = new MouseEvent('mousemove', {
                clientX: 292,
                clientY: 90
            });
            canvas.dispatchEvent(moveEvent);
            expect(canvas.style.cursor).toBe('pointer');

            // Test moving away resets cursor
            const moveAwayEvent = new MouseEvent('mousemove', {
                clientX: 10,
                clientY: 10
            });
            canvas.dispatchEvent(moveAwayEvent);
            expect(canvas.style.cursor).toBe('default');

            // Test mouseleave resets cursor
            canvas.dispatchEvent(new Event('mouseleave'));
            expect(canvas.style.cursor).toBe('default');

            // Test controller destroy removes listeners
            controller.destroy();
            canvas.dispatchEvent(clickEvent);
            expect(onSelectDistrict).toHaveBeenCalledTimes(1); // not called again
        });

        test('disposePlanetHub cleanly destroys active hub instance', () => {
            const canvas = document.createElement('canvas');
            const mockCtx = {
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                save: jest.fn(),
                restore: jest.fn()
            };
            canvas.getContext = jest.fn(() => mockCtx);

            const controller = initPlanetHub(canvas, 'xylo_delta', []);
            expect(controller).not.toBeNull();

            // Calling disposePlanetHub stops and clears active hub
            expect(() => disposePlanetHub()).not.toThrow();
            expect(() => disposePlanetHub()).not.toThrow(); // Idempotent
        });
    });

    describe('districts-ui integration with Planet Hub', () => {
        let mockState;
        let mockData;
        let mockUi;

        beforeEach(() => {
            document.body.innerHTML = `
                <div id="districtsModal" class="hidden">
                    <h2 id="districtsModalTitle"></h2>
                    <p id="districtsModalSubtitle"></p>
                    <div id="districtsContainer"></div>
                    <button id="closeModalBtn">&times;</button>
                </div>
            `;

            mockState = {
                currentLocation: 'terra_prime',
                character: {
                    activeQuests: {},
                    completedQuests: [],
                    storyline: { alignment: 'neutral' }
                },
                worldFlags: {}
            };

            mockData = {
                locations: {
                    terra_prime: {
                        id: 'terra_prime',
                        name: 'Terra Prime',
                        districts: [
                            { id: 'fed_hq', name: 'Federation HQ', icon: '🏢' },
                            { id: 'bazaar', name: 'Bazaar', icon: '🛍️' }
                        ]
                    }
                },
                quests: {}
            };

            mockUi = {
                updateUI: jest.fn(),
                setScene: jest.fn(),
                addLog: jest.fn()
            };

            initDistrictsUI({
                state: mockState,
                data: mockData,
                ui: mockUi
            });
        });

        test('renderDistricts dynamically creates planetHubCanvas container above districtsContainer', () => {
            expect(document.getElementById('planetHubCanvas')).toBeNull();

            renderDistricts();

            const canvas = document.getElementById('planetHubCanvas');
            expect(canvas).not.toBeNull();
            expect(canvas.width).toBe(420);
            expect(canvas.height).toBe(180);

            const container = document.getElementById('districtsContainer');
            const wrapper = document.getElementById('planetHubWrapper');
            expect(wrapper).not.toBeNull();
            expect(wrapper.nextElementSibling).toBe(container);
        });

        test('renderDistricts assigns district-card-{id} to district cards', () => {
            renderDistricts();
            expect(document.getElementById('district-card-fed_hq')).not.toBeNull();
            expect(document.getElementById('district-card-bazaar')).not.toBeNull();
        });

        test('closeDistricts hides modal and disposes planet hub', () => {
            const modal = document.getElementById('districtsModal');
            modal.classList.remove('hidden');
            modal.style.display = 'flex';

            renderDistricts();
            closeDistricts();

            expect(modal.classList.contains('hidden')).toBe(true);
            expect(modal.style.display).toBe('none');
        });
    });
});
