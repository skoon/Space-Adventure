/**
 * @jest-environment jsdom
 */

import {
    calculateRunScore,
    submitScore,
    getLeaderboard,
    clearLeaderboard
} from '../../systems/network.js';

import {
    DAILY_CHALLENGES,
    getTodayDateKey,
    getDailyChallenges,
    ensureDailyChallengesState,
    updateDailyProgress,
    claimDailyReward,
    initAchievements
} from '../../systems/achievements.js';

import {
    initAchievementsUI,
    showAchievementsUI,
    closeAchievementsUI,
    renderAchievementsList,
    renderDailyChallengesTab,
    renderLeaderboardTab,
    switchTab,
    getActiveTab
} from '../../systems/ui/achievements-ui.js';

describe('Network & Leaderboard System', () => {
    beforeEach(() => {
        clearLeaderboard();
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    test('calculateRunScore computes a positive score factoring level, credits, stats, and achievements', () => {
        expect(calculateRunScore(null)).toBe(0);

        const basicState = {
            character: { level: 1, credits: 0 },
            stats: {},
            achievements: []
        };
        const basicScore = calculateRunScore(basicState);
        expect(basicScore).toBeGreaterThan(0);

        const advancedState = {
            character: { level: 5, credits: 1200 },
            stats: {
                enemiesDefeated: 15,
                bossesDefeated: 2,
                itemsCrafted: 4,
                derelictsCompleted: 1
            },
            achievements: ['first_blood', 'galaxy_gladiator']
        };
        const advancedScore = calculateRunScore(advancedState);
        expect(advancedScore).toBeGreaterThan(basicScore);
        // Level: 5*1000 = 5000 + 1200 + 15*50 (750) + 2*250 (500) + 4*30 (120) + 1*100 (100) + 2*200 (400) = 8070
        expect(advancedScore).toBe(8070);
    });

    test('submitScore normalizes entry defaults and stores descending by score', () => {
        const entry1 = { name: 'Vanguard', role: 'Soldier', level: 3, score: 2500, kills: 10 };
        const entry2 = { name: 'Ghost', role: 'Infiltrator', level: 4, score: 4800, kills: 20 };
        const entry3 = { score: 1200 }; // Missing name, role, level, kills

        submitScore(entry1);
        submitScore(entry2);
        const board = submitScore(entry3);

        expect(board.length).toBe(3);
        // Highest score first
        expect(board[0].name).toBe('Ghost');
        expect(board[0].score).toBe(4800);
        expect(board[1].name).toBe('Vanguard');
        expect(board[1].score).toBe(2500);
        expect(board[2].name).toBe('Commander'); // Normalized default
        expect(board[2].role).toBe('Explorer');
        expect(board[2].score).toBe(1200);
        expect(board[2].date).toBeDefined();
    });

    test('getLeaderboard limits the returned slice and clearLeaderboard empties it', () => {
        for (let i = 1; i <= 15; i++) {
            submitScore({ name: `Pilot ${i}`, score: i * 100 });
        }

        const top5 = getLeaderboard(5);
        expect(top5.length).toBe(5);
        expect(top5[0].score).toBe(1500);
        expect(top5[4].score).toBe(1100);

        const defaultTop = getLeaderboard();
        expect(defaultTop.length).toBe(10);

        clearLeaderboard();
        expect(getLeaderboard().length).toBe(0);
    });

    test('submitScore caps entries at top 50', () => {
        for (let i = 1; i <= 60; i++) {
            submitScore({ name: `Player ${i}`, score: i * 10 });
        }
        const fullBoard = getLeaderboard(100);
        expect(fullBoard.length).toBe(50);
        // Lowest score in top 50 is 11 * 10 = 110
        expect(fullBoard[49].score).toBe(110);
    });

    test('in-memory fallback works gracefully if localStorage is unavailable or throws', () => {
        const originalSetItem = window.localStorage.setItem;
        window.localStorage.setItem = () => {
            throw new Error('QuotaExceededError');
        };

        const res = submitScore({ name: 'Survivor', score: 9999 });
        expect(res.length).toBeGreaterThan(0);
        expect(getLeaderboard()[0].score).toBe(9999);

        // Restore
        window.localStorage.setItem = originalSetItem;
    });
});

describe('Daily Challenges System', () => {
    let mockState;
    let mockLog;
    let mockShowDialog;
    let mockUpdateUI;

    beforeEach(() => {
        mockLog = jest.fn();
        mockShowDialog = jest.fn();
        mockUpdateUI = jest.fn();

        mockState = {
            character: { credits: 50, level: 2 },
            inventory: [],
            stats: {},
            achievements: []
        };

        initAchievements({
            state: mockState,
            ui: {
                addLog: mockLog,
                updateUI: mockUpdateUI,
                showDialog: mockShowDialog
            }
        });
    });

    test('DAILY_CHALLENGES contains at least 6 varied challenge definitions', () => {
        expect(DAILY_CHALLENGES.length).toBeGreaterThanOrEqual(6);
        DAILY_CHALLENGES.forEach(ch => {
            expect(ch.id).toBeDefined();
            expect(ch.title).toBeDefined();
            expect(ch.description).toBeDefined();
            expect(ch.stat).toBeDefined();
            expect(ch.target).toBeGreaterThan(0);
            expect(ch.reward.credits).toBeGreaterThan(0);
            expect(ch.reward.text).toBeDefined();
        });
    });

    test('getTodayDateKey returns YYYY-MM-DD formatted string', () => {
        const key = getTodayDateKey();
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        const customDate = new Date(2026, 4, 9); // May 9, 2026
        expect(getTodayDateKey(customDate)).toBe('2026-05-09');
    });

    test('getDailyChallenges deterministically picks 3 distinct challenges for a given date', () => {
        const dayA = getDailyChallenges('2026-11-15');
        const dayA_repeat = getDailyChallenges('2026-11-15');

        expect(dayA.length).toBe(3);
        expect(dayA).toEqual(dayA_repeat);

        // All 3 must be unique IDs
        const ids = dayA.map(c => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);

        // Different date selection is deterministic
        const dayB = getDailyChallenges('2026-11-16');
        expect(dayB.length).toBe(3);
        expect(getDailyChallenges('2026-11-16')).toEqual(dayB);
    });

    test('ensureDailyChallengesState initializes and rolls over when date changes', () => {
        const state1 = ensureDailyChallengesState('2026-11-15');
        expect(mockState.dailyChallenges.date).toBe('2026-11-15');
        expect(mockState.dailyChallenges.progress).toEqual({});
        expect(mockState.dailyChallenges.claimed).toEqual([]);

        // Record progress on 2026-11-15
        mockState.dailyChallenges.progress.enemiesDefeated = 4;
        mockState.dailyChallenges.claimed.push('some_challenge');

        // Same date call does not wipe progress
        ensureDailyChallengesState('2026-11-15');
        expect(mockState.dailyChallenges.progress.enemiesDefeated).toBe(4);
        expect(mockState.dailyChallenges.claimed).toContain('some_challenge');

        // New date rolls over
        ensureDailyChallengesState('2026-11-16');
        expect(mockState.dailyChallenges.date).toBe('2026-11-16');
        expect(mockState.dailyChallenges.progress).toEqual({});
        expect(mockState.dailyChallenges.claimed).toEqual([]);
    });

    test('updateDailyProgress increments progress counters', () => {
        ensureDailyChallengesState(getTodayDateKey());
        updateDailyProgress('enemiesDefeated', 1);
        expect(mockState.dailyChallenges.progress.enemiesDefeated).toBe(1);

        updateDailyProgress('enemiesDefeated', 3);
        expect(mockState.dailyChallenges.progress.enemiesDefeated).toBe(4);

        updateDailyProgress('itemsCrafted', 2);
        expect(mockState.dailyChallenges.progress.itemsCrafted).toBe(2);
    });

    test('claimDailyReward validates requirement, awards credits, records claim, and is idempotent', () => {
        const todayDate = getTodayDateKey();
        ensureDailyChallengesState(todayDate);
        const todaysChallenges = getDailyChallenges(todayDate);
        const testChallenge = todaysChallenges[0];

        // 1. Incomplete rejection: progress is 0 < target
        const failClaim = claimDailyReward(testChallenge.id);
        expect(failClaim).toBe(false);
        expect(mockState.dailyChallenges.claimed).not.toContain(testChallenge.id);
        expect(mockState.character.credits).toBe(50);

        // 2. Meet requirements
        updateDailyProgress(testChallenge.stat, testChallenge.target);
        const successClaim = claimDailyReward(testChallenge.id);
        expect(successClaim).toBe(true);
        expect(mockState.dailyChallenges.claimed).toContain(testChallenge.id);
        expect(mockState.character.credits).toBe(50 + testChallenge.reward.credits);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(testChallenge.title));
        expect(mockShowDialog).toHaveBeenCalled();
        expect(mockUpdateUI).toHaveBeenCalled();

        // 3. Duplicate / already claimed idempotency
        mockLog.mockClear();
        const repeatClaim = claimDailyReward(testChallenge.id);
        expect(repeatClaim).toBe(false);
        expect(mockState.character.credits).toBe(50 + testChallenge.reward.credits);
        expect(mockLog).not.toHaveBeenCalled();

        // 4. Non-existent or invalid challenge id
        expect(claimDailyReward('non_existent_challenge_xyz')).toBe(false);
    });
});

describe('Achievements UI Tab Switching (jsdom)', () => {
    let mockState;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="achievementsModal" class="quest-log-modal hidden" style="display: none">
                <div class="quest-log-content">
                    <div class="terminal-screen">
                        <div class="terminal-header">
                            <h2>SECTOR MILESTONES</h2>
                            <button id="closeModalBtn">[X]</button>
                        </div>
                        <div id="achievementsList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                    </div>
                </div>
            </div>
        `;

        mockState = {
            character: { name: 'Alex', role: 'Soldier', level: 3, credits: 350 },
            inventory: [],
            stats: { enemiesDefeated: 5, itemsCrafted: 2 },
            achievements: ['first_blood'],
            dailyChallenges: {
                date: getTodayDateKey(),
                progress: { enemiesDefeated: 5 },
                claimed: []
            }
        };

        initAchievements({
            state: mockState,
            ui: { addLog: jest.fn(), updateUI: jest.fn(), showDialog: jest.fn() }
        });

        initAchievementsUI({ state: mockState });
        clearLeaderboard();
    });

    test('showAchievementsUI opens modal and injects #achievementsTabs bar', () => {
        showAchievementsUI();
        const modal = document.getElementById('achievementsModal');
        expect(modal.style.display).toBe('flex');
        expect(modal.classList.contains('hidden')).toBe(false);

        const tabsBar = document.getElementById('achievementsTabs');
        expect(tabsBar).not.toBeNull();
        expect(tabsBar.children.length).toBe(3);

        const tabMilestones = document.getElementById('tab_achievements');
        const tabDaily = document.getElementById('tab_daily');
        const tabLeaderboard = document.getElementById('tab_leaderboard');
        expect(tabMilestones).not.toBeNull();
        expect(tabDaily).not.toBeNull();
        expect(tabLeaderboard).not.toBeNull();
    });

    test('closeAchievementsUI closes modal', () => {
        showAchievementsUI();
        closeAchievementsUI();
        const modal = document.getElementById('achievementsModal');
        expect(modal.style.display).toBe('none');
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('switching between tabs updates view and active tab tracking', () => {
        showAchievementsUI();

        // 1. Initially Milestones tab
        expect(getActiveTab()).toBe('achievements');
        let list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('First Blood');

        // 2. Switch to Daily Challenges tab
        switchTab('daily');
        expect(getActiveTab()).toBe('daily');
        list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('DAILY DIRECTIVES');

        // 3. Switch to Leaderboard tab
        switchTab('leaderboard');
        expect(getActiveTab()).toBe('leaderboard');
        list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('CURRENT EXPEDITION SCORE');
        expect(document.getElementById('submitScoreBtn')).not.toBeNull();

        // 4. Switch back to Achievements
        switchTab('achievements');
        expect(getActiveTab()).toBe('achievements');
        list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('First Blood');
    });

    test('leaderboard submit score button works and updates table', () => {
        showAchievementsUI();
        switchTab('leaderboard');

        const submitBtn = document.getElementById('submitScoreBtn');
        expect(submitBtn).not.toBeNull();

        // Click submit button
        submitBtn.click();

        const leaderboardEntries = getLeaderboard();
        expect(leaderboardEntries.length).toBe(1);
        expect(leaderboardEntries[0].name).toBe('Alex');

        // Re-check DOM for updated table
        const list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('Alex');
    });

    test('daily challenges claim button claims reward and re-renders tab', () => {
        // Set up a completed challenge in daily state
        const todayKey = getTodayDateKey();
        const todaysChallenges = getDailyChallenges(todayKey);
        const targetChallenge = todaysChallenges[0];

        mockState.dailyChallenges = {
            date: todayKey,
            progress: {
                [targetChallenge.stat]: targetChallenge.target
            },
            claimed: []
        };

        showAchievementsUI();
        switchTab('daily');

        const claimButtons = document.querySelectorAll('.claim-daily-btn');
        expect(claimButtons.length).toBeGreaterThan(0);

        const initialCredits = mockState.character.credits;
        claimButtons[0].click();

        // Should have claimed and increased credits
        expect(mockState.dailyChallenges.claimed).toContain(targetChallenge.id);
        expect(mockState.character.credits).toBe(initialCredits + targetChallenge.reward.credits);

        // Dom now displays claimed badge
        const list = document.getElementById('achievementsList');
        expect(list.innerHTML).toContain('CLAIMED');
    });
});
