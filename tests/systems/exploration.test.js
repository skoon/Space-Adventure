import { initExploration, simulateExploration, travelDeeper } from '../../systems/exploration.js';

// Mock dependencies
const mockState = {
    gameState: 'exploring',
    currentLocation: 'terra_prime'
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn()
};

const mockEvents = {
    generateRandomEvent: jest.fn(() => ({ type: 'loot', text: 'Found scrap' })),
    handleEvent: jest.fn()
};

const deps = {
    state: mockState,
    ui: mockUi,
    events: mockEvents
};

describe('Exploration System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        
        mockState.gameState = 'exploring';
        mockState.currentLocation = 'terra_prime';
        
        initExploration(deps);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('simulateExploration triggers random event and updates UI after 2 seconds', () => {
        simulateExploration();

        // Ensure nothing happened immediately
        expect(mockEvents.generateRandomEvent).not.toHaveBeenCalled();
        expect(mockEvents.handleEvent).not.toHaveBeenCalled();
        expect(mockUi.updateUI).not.toHaveBeenCalled();

        // Fast-forward time by 2 seconds
        jest.advanceTimersByTime(2000);

        // Verification
        expect(mockEvents.generateRandomEvent).toHaveBeenCalledWith('terra_prime');
        expect(mockEvents.handleEvent).toHaveBeenCalledWith({ type: 'loot', text: 'Found scrap' });
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('simulateExploration does not execute if gameState is not exploring at start', () => {
        mockState.gameState = 'combat'; // Not exploring

        simulateExploration();

        jest.advanceTimersByTime(2000);

        expect(mockEvents.generateRandomEvent).not.toHaveBeenCalled();
        expect(mockEvents.handleEvent).not.toHaveBeenCalled();
        expect(mockUi.updateUI).not.toHaveBeenCalled();
    });

    test('simulateExploration does not execute event if gameState changes during the 2 seconds', () => {
        simulateExploration();

        // Change state midway
        jest.advanceTimersByTime(1000);
        mockState.gameState = 'combat';

        // Finish the 2 seconds
        jest.advanceTimersByTime(1000);

        expect(mockEvents.generateRandomEvent).not.toHaveBeenCalled();
        expect(mockEvents.handleEvent).not.toHaveBeenCalled();
        expect(mockUi.updateUI).not.toHaveBeenCalled();
    });

    test('travelDeeper logs a message and starts exploration simulation', () => {
        travelDeeper();

        expect(mockUi.addLog).toHaveBeenCalledWith('Venturing deeper into the unknown...');
        
        // Fast-forward fake timer to check simulation trigger
        jest.advanceTimersByTime(2000);
        expect(mockEvents.generateRandomEvent).toHaveBeenCalled();
        expect(mockUi.updateUI).toHaveBeenCalled();
    });
});
