/**
 * Behavior Tree System for Advanced AI Opponents
 * Pure logic module implementing declarative behavior tree nodes and compiler.
 */

export const NODE_STATUS = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    RUNNING: 'RUNNING'
};

function createNode(tickFn, properties = {}) {
    const node = function(context) {
        return tickFn(context);
    };
    node.tick = tickFn;
    Object.assign(node, properties);
    return node;
}

/**
 * Selector Node
 * Evaluates children in order; returns 'SUCCESS' on the first child that returns 'SUCCESS', else 'FAILURE'.
 */
export function selector(...children) {
    const flatChildren = (children.length === 1 && Array.isArray(children[0])) ? children[0] : children;
    const tick = (context) => {
        for (const child of flatChildren) {
            const status = typeof child.tick === 'function' ? child.tick(context) : (typeof child === 'function' ? child(context) : NODE_STATUS.FAILURE);
            if (status === NODE_STATUS.SUCCESS) {
                return NODE_STATUS.SUCCESS;
            }
        }
        return NODE_STATUS.FAILURE;
    };
    return createNode(tick, { type: 'selector', children: flatChildren });
}

/**
 * Sequence Node
 * Evaluates children in order; returns 'FAILURE' on the first child that returns 'FAILURE', else 'SUCCESS'.
 */
export function sequence(...children) {
    const flatChildren = (children.length === 1 && Array.isArray(children[0])) ? children[0] : children;
    const tick = (context) => {
        for (const child of flatChildren) {
            const status = typeof child.tick === 'function' ? child.tick(context) : (typeof child === 'function' ? child(context) : NODE_STATUS.FAILURE);
            if (status === NODE_STATUS.FAILURE) {
                return NODE_STATUS.FAILURE;
            }
        }
        return NODE_STATUS.SUCCESS;
    };
    return createNode(tick, { type: 'sequence', children: flatChildren });
}

/**
 * Condition Node
 * Calls predicate(context); returns 'SUCCESS' if truthy, else 'FAILURE'.
 */
export function condition(predicate) {
    const tick = (context) => {
        const result = predicate(context);
        return result ? NODE_STATUS.SUCCESS : NODE_STATUS.FAILURE;
    };
    return createNode(tick, { type: 'condition', predicate });
}

/**
 * Action Node
 * Calls fn(context); if fn returns 'SUCCESS' or 'FAILURE' use that, otherwise treat truthy/undefined as 'SUCCESS'.
 */
export function action(fn) {
    const tick = (context) => {
        const result = fn(context);
        if (result === NODE_STATUS.SUCCESS || result === NODE_STATUS.FAILURE) {
            return result;
        }
        if (result === undefined || Boolean(result)) {
            return NODE_STATUS.SUCCESS;
        }
        return NODE_STATUS.FAILURE;
    };
    return createNode(tick, { type: 'action', fn });
}

/**
 * Evaluate Behavior Tree
 * Runs tree.tick(context) or tree(context), returns the status.
 */
export function evaluateBehaviorTree(tree, context) {
    if (!tree) return NODE_STATUS.FAILURE;
    if (typeof tree.tick === 'function') {
        return tree.tick(context);
    }
    if (typeof tree === 'function') {
        return tree(context);
    }
    return NODE_STATUS.FAILURE;
}

/**
 * Build behavior tree from pure data descriptor object.
 */
export function buildTreeFromDescriptor(descriptor, actionMap = {}, conditionMap = {}) {
    if (!descriptor) return null;
    if (typeof descriptor.tick === 'function' || typeof descriptor === 'function') {
        return descriptor;
    }

    const nodeData = descriptor.tree || descriptor;

    switch (nodeData.type) {
        case 'selector': {
            const children = (nodeData.children || []).map(child =>
                buildTreeFromDescriptor(child, actionMap, conditionMap)
            ).filter(Boolean);
            return selector(...children);
        }
        case 'sequence': {
            const children = (nodeData.children || []).map(child =>
                buildTreeFromDescriptor(child, actionMap, conditionMap)
            ).filter(Boolean);
            return sequence(...children);
        }
        case 'condition': {
            const checkName = nodeData.check || nodeData.name;
            const predicate = conditionMap[checkName];
            if (typeof predicate === 'function') {
                return condition((context) => predicate(context, nodeData));
            }
            return condition(() => false);
        }
        case 'action': {
            const actName = nodeData.act || nodeData.name;
            const actFn = actionMap[actName];
            if (typeof actFn === 'function') {
                return action((context) => actFn(context, nodeData));
            }
            return action(() => NODE_STATUS.FAILURE);
        }
        default:
            return null;
    }
}

/**
 * Default AI Profile Descriptors for Advanced AI Enemies and Bosses
 */
export const DEFAULT_AI_PROFILES = {
    'Security Sentinel': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'playerHasEnergyOrShield' },
                    { type: 'action', act: 'drainShieldAndEnergy', amount: 10 }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Cryo Drake': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'isPlayerFrozen' },
                    { type: 'action', act: 'shatterStrike', multiplier: 2.0 }
                ]
            },
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'randomChance', chance: 0.20 },
                    { type: 'action', act: 'freezeAttack', multiplier: 1.5, duration: 2 }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Ashen Hulk': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'notEnraged' },
                    { type: 'action', act: 'enrage', attackBuff: 6, slamMultiplier: 1.4 }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Void Stalker': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'notVoidCharged' },
                    { type: 'action', act: 'voidCharge', attackBuff: 8, strikeMultiplier: 1.5 }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Overlord Xylar': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'randomChance', chance: 0.35 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Annihilation Beam (Overcharged)', damageMultiplier: 2.5, msg: 'Xylar unleashes an overcharged Annihilation Beam!' }
                ]
            },
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'randomChance', chance: 0.25 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Annihilation Beam', damageMultiplier: 2.0, msg: 'Xylar fires a massive Annihilation Beam!' }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'The Great Sandworm': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'randomChance', chance: 0.40 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Frenzied Devour', damageMultiplier: 2.0, msg: 'The wounded Sandworm thrashes violently, attempting a Frenzied Devour!' }
                ]
            },
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'randomChance', chance: 0.30 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Devour', damageMultiplier: 1.5, msg: 'The Sandworm attempts to devour you whole!' }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Void Stalker Alpha': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'randomChance', chance: 0.40 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Shadow Rift', damageMultiplier: 2.2, msg: 'The Alpha tears open a Shadow Rift from the void!' }
                ]
            },
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'randomChance', chance: 0.30 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Void Strike', damageMultiplier: 1.8, msg: 'The Alpha strikes you from the void!' }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    },
    'Void Sentinel Alpha': {
        type: 'selector',
        children: [
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'enemyHpBelow', threshold: 0.5 },
                    { type: 'condition', check: 'randomChance', chance: 0.40 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Singularity Burst', damageMultiplier: 2.2, msg: 'The anomaly compresses space, unleashing an unstable Singularity Burst!' }
                ]
            },
            {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'randomChance', chance: 0.30 },
                    { type: 'action', act: 'bossSpecialAttack', name: 'Gravitational Collapse', damageMultiplier: 1.8, msg: 'The anomaly compresses gravitational fields, causing a localized collapse!' }
                ]
            },
            {
                type: 'action',
                act: 'standardAttack'
            }
        ]
    }
};
