import { t } from '../../systems/theme-engine.js';
import { theme } from '../../data/theme.js';

describe('Theme Engine Translation', () => {
    test('Translates standard vocabulary words', () => {
        expect(t('This is a Xenobot in the corridor.')).toContain('Xenobot');
        expect(t('Retrieving scrap metal.')).toContain('scrap metal');
    });

    test('Preserves ALL CAPS capitalization', () => {
        expect(t('XENOBOT')).toBe('XENOBOT');
        expect(t('SCRAP METAL')).toBe('SCRAP METAL');
    });

    test('Preserves Title Case for multi-word phrases', () => {
        expect(t('Deflector Shields')).toBe('Deflector Shields');
        expect(t('Scrap Metal')).toBe('Scrap Metal');
    });

    test('Preserves Capitalization on first letter of sentences', () => {
        expect(t('Xenobots are hostile.')).toBe('Xenobots are hostile.');
    });

    test('Respects word boundaries and avoids partial matching', () => {
        // "Xenobotic" does not match "Xenobot" because of word boundary
        expect(t('This is a Xenobotic entity.')).toBe('This is a Xenobotic entity.');
    });

    test('Translates custom theme definitions dynamically', () => {
        // Temporarily inject custom vocab to test theme swapping capabilities
        const originalVocab = { ...theme.vocab };
        theme.vocab['Xenobot'] = 'Gargoyle';
        theme.vocab['scrap metal'] = 'ancient bones';
        theme.vocab['comms array'] = 'beacon tower';
        theme.vocab["Ready to scrap some metal."] = "Ready to harvest some bones.";
        theme.vocab["Medbay healed you for"] = "Sanctum healed you for";
        theme.vocab["HP during travel."] = "HP during journey.";

        expect(t('A Xenobot approaches.')).toBe('A Gargoyle approaches.');
        expect(t('Gathering scrap metal.')).toBe('Gathering ancient bones.');
        expect(t('Defend the comms array!')).toBe('Defend the beacon tower!');
        expect(t('Ready to scrap some metal.')).toBe('Ready to harvest some bones.');
        expect(t('Medbay healed you for 20 HP during travel.')).toBe('Sanctum healed you for 20 HP during journey.');

        // Restore original vocab
        theme.vocab = originalVocab;
    });
});
