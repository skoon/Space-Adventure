/**
 * Planet Hub UI Module
 * Procedural Planetary Hub featuring zero-dependency 3D-projected canvas globe,
 * biome palettes, orbital ring projection, and interactive district beacons.
 */

/**
 * Biome color palettes for planetary rendering
 */
export const BIOME_PALETTES = {
    terra_prime: {
        primary: "#1d4ed8",       // Deep ocean blue
        secondary: "#15803d",     // Continental lush green
        atmosphere: "rgba(56, 189, 248, 0.45)", // Cyan sky glow
        highlight: "rgba(255, 255, 255, 0.6)",
        shadow: "rgba(2, 6, 23, 0.9)",
        ring: "rgba(56, 189, 248, 0.25)",
        beacon: "#38bdf8",
        beaconGlow: "rgba(56, 189, 248, 0.6)"
    },
    xylo_delta: {
        primary: "#78350f",       // Canyon amber / deep rust
        secondary: "#d97706",     // Desert dune gold
        atmosphere: "rgba(245, 158, 11, 0.35)", // Amber atmospheric haze
        highlight: "rgba(254, 243, 199, 0.5)",
        shadow: "rgba(20, 10, 5, 0.9)",
        ring: "rgba(217, 119, 6, 0.25)",
        beacon: "#fbbf24",
        beaconGlow: "rgba(251, 191, 36, 0.6)"
    },
    nebula_outpost: {
        primary: "#3b0764",       // Deep void purple
        secondary: "#7e22ce",     // Nebula violet
        atmosphere: "rgba(192, 132, 252, 0.45)", // Magenta/violet haze
        highlight: "rgba(243, 232, 255, 0.6)",
        shadow: "rgba(10, 2, 20, 0.9)",
        ring: "rgba(168, 85, 247, 0.3)",
        beacon: "#c084fc",
        beaconGlow: "rgba(192, 132, 252, 0.6)"
    },
    norkon_outpost: {
        primary: "#0f172a",       // Quantum slate dark
        secondary: "#0e7490",     // Research teal
        atmosphere: "rgba(34, 211, 238, 0.4)", // Electric cyan
        highlight: "rgba(207, 250, 254, 0.6)",
        shadow: "rgba(2, 6, 23, 0.92)",
        ring: "rgba(6, 182, 212, 0.3)",
        beacon: "#22d3ee",
        beaconGlow: "rgba(34, 211, 238, 0.6)"
    },
    derelict: {
        primary: "#1c1917",       // Scrap metal hull
        secondary: "#44403c",     // Oxidized industrial plate
        atmosphere: "rgba(120, 113, 108, 0.3)", // Metallic haze
        highlight: "rgba(214, 211, 209, 0.4)",
        shadow: "rgba(12, 10, 9, 0.95)",
        ring: "rgba(168, 162, 158, 0.2)",
        beacon: "#f97316",        // Hazard orange beacon
        beaconGlow: "rgba(249, 115, 22, 0.6)"
    },
    inferno_ix: {
        primary: "#450a0a",       // Volcanic crust basalt
        secondary: "#dc2626",     // Molten lava streams
        atmosphere: "rgba(239, 68, 68, 0.45)", // Crimson solar radiation
        highlight: "rgba(254, 202, 202, 0.5)",
        shadow: "rgba(15, 2, 2, 0.92)",
        ring: "rgba(248, 113, 113, 0.25)",
        beacon: "#ef4444",
        beaconGlow: "rgba(239, 68, 68, 0.6)"
    },
    crio_prime: {
        primary: "#082f49",       // Deep abyss ice
        secondary: "#38bdf8",     // Glacial ice sheets
        atmosphere: "rgba(186, 230, 253, 0.5)", // Frost haze
        highlight: "rgba(255, 255, 255, 0.8)",
        shadow: "rgba(2, 10, 25, 0.92)",
        ring: "rgba(125, 211, 252, 0.3)",
        beacon: "#bae6fd",
        beaconGlow: "rgba(186, 230, 253, 0.7)"
    },
    default: {
        primary: "#1e293b",       // Slate blue
        secondary: "#0284c7",     // Deep sky blue
        atmosphere: "rgba(56, 189, 248, 0.4)", // Cyber blue
        highlight: "rgba(255, 255, 255, 0.6)",
        shadow: "rgba(2, 6, 23, 0.9)",
        ring: "rgba(56, 189, 248, 0.25)",
        beacon: "#38bdf8",
        beaconGlow: "rgba(56, 189, 248, 0.6)"
    }
};

/**
 * Retrieve the biome palette for a given location ID
 */
export function getBiomePalette(locationId) {
    if (!locationId) return BIOME_PALETTES.default;
    const id = typeof locationId === 'object' ? locationId.id : locationId;
    return BIOME_PALETTES[id] || BIOME_PALETTES.default;
}

/**
 * Project an orbital 3D point onto a 2D screen coordinate system.
 * 
 * @param {number} angle - Angle in radians around orbit
 * @param {number} radius - Radius in pixels
 * @param {number} [tilt=0.38] - Inclination angle in radians
 * @param {number} [centerX=0] - Center X offset
 * @param {number} [centerY=0] - Center Y offset
 * @returns {{ x: number, y: number, z: number, scale: number, visible: boolean }}
 */
export function projectOrbitalPoint(angle, radius, tilt = 0.38, centerX = 0, centerY = 0) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const sinTilt = Math.sin(tilt);
    const cosTilt = Math.cos(tilt);

    const x = centerX + radius * cosAngle;
    const y = centerY + radius * sinAngle * sinTilt;
    const z = radius * sinAngle * cosTilt;

    // Depth-based scale factor: closer items (z > 0) are slightly larger (up to ~1.35x),
    // farther items (z < 0) are slightly smaller (down to ~0.65x).
    const normalizedZ = radius > 0 ? (z / radius) : 0;
    const scale = Math.max(0.4, 1 + normalizedZ * 0.35);
    const visible = z >= -0.001;

    return {
        x,
        y,
        z,
        scale,
        visible
    };
}

let activeHubController = null;

/**
 * Stop any active planet hub animation and cleanup listeners
 */
export function disposePlanetHub() {
    if (activeHubController) {
        activeHubController.destroy();
        activeHubController = null;
    }
}

/**
 * Initialize the 3D procedural planetary hub on a canvas.
 * 
 * @param {HTMLCanvasElement} canvas
 * @param {Object|string} location
 * @param {Array} districts
 * @param {Function} onSelectDistrict
 * @returns {{ renderFrame: Function, destroy: Function }|null}
 */
export function initPlanetHub(canvas, location, districts = [], onSelectDistrict = null) {
    // Graceful check for jsdom / canvas support
    if (!canvas || typeof canvas.getContext !== 'function') {
        return null;
    }

    let ctx = null;
    try {
        ctx = canvas.getContext('2d');
    } catch (e) {
        return null;
    }

    if (!ctx) {
        return null;
    }

    // Dispose previous instance if active
    disposePlanetHub();

    const locId = (location && location.id) ? location.id : location;
    const locName = (location && location.name) ? location.name : (locId || "PLANETARY HUB");
    const palette = getBiomePalette(locId);
    const distList = Array.isArray(districts) ? districts : [];

    let rotationAngle = 0;
    let hoveredDistrict = null;
    let animFrameId = null;
    let isDestroyed = false;

    // Projected nodes state cached for hit testing
    let projectedNodes = [];

    function renderFrame() {
        if (isDestroyed) return;

        const W = canvas.width || 420;
        const H = canvas.height || 180;
        const centerX = W / 2;
        const centerY = H / 2;
        const globeRadius = Math.min(centerX, centerY) * 0.52;
        const orbitalRadius = globeRadius * 1.75;
        const tilt = 0.38;

        // 1. Clear background
        if (typeof ctx.clearRect === 'function') {
            ctx.clearRect(0, 0, W, H);
        }

        // 2. Project all district beacons
        const count = distList.length;
        projectedNodes = distList.map((district, idx) => {
            const angle = rotationAngle + (idx * (2 * Math.PI / Math.max(1, count)));
            const pt = projectOrbitalPoint(angle, orbitalRadius, tilt, centerX, centerY);
            return {
                district,
                ...pt,
                angle
            };
        });

        // 3. Back half of orbital ring (z < 0)
        if (typeof ctx.ellipse === 'function' && typeof ctx.save === 'function') {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, orbitalRadius, orbitalRadius * Math.sin(tilt), 0, Math.PI, 2 * Math.PI);
            ctx.strokeStyle = palette.ring;
            ctx.lineWidth = 1.2;
            if (typeof ctx.setLineDash === 'function') {
                ctx.setLineDash([3, 4]);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 4. Back beacons (z < 0)
        projectedNodes.forEach(node => {
            if (node.z < 0) {
                drawBeacon(ctx, node, palette, false, hoveredDistrict === node.district);
            }
        });

        // 5. Planetary Globe with 3D Shading
        drawPlanetSphere(ctx, centerX, centerY, globeRadius, palette, rotationAngle);

        // 6. Front half of orbital ring (z >= 0)
        if (typeof ctx.ellipse === 'function' && typeof ctx.save === 'function') {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, orbitalRadius, orbitalRadius * Math.sin(tilt), 0, 0, Math.PI);
            ctx.strokeStyle = palette.ring;
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();
        }

        // 7. Front beacons (z >= 0)
        projectedNodes.forEach(node => {
            if (node.z >= 0) {
                drawBeacon(ctx, node, palette, true, hoveredDistrict === node.district);
            }
        });

        // 8. HUD Telemetry overlay
        drawHudOverlay(ctx, W, H, locName, distList.length);
    }

    function getCoords(evt) {
        const rect = (canvas.getBoundingClientRect && typeof canvas.getBoundingClientRect === 'function')
            ? canvas.getBoundingClientRect()
            : null;
        const left = rect ? rect.left : 0;
        const top = rect ? rect.top : 0;
        const rectW = rect ? rect.width : 0;
        const rectH = rect ? rect.height : 0;

        const clientX = typeof evt.clientX === 'number' ? evt.clientX : (evt.offsetX || 0);
        const clientY = typeof evt.clientY === 'number' ? evt.clientY : (evt.offsetY || 0);

        const scaleX = (rectW > 0) ? (canvas.width / rectW) : 1;
        const scaleY = (rectH > 0) ? (canvas.height / rectH) : 1;

        return {
            x: (clientX - left) * scaleX,
            y: (clientY - top) * scaleY
        };
    }

    function findNodeAt(px, py) {
        if (!projectedNodes || projectedNodes.length === 0) return null;
        // Prioritize front beacons (higher z)
        const sorted = [...projectedNodes].sort((a, b) => b.z - a.z);
        for (const node of sorted) {
            const hitRadius = Math.max(18, 14 * node.scale);
            const dx = node.x - px;
            const dy = node.y - py;
            if (Math.hypot(dx, dy) <= hitRadius) {
                return node;
            }
        }
        return null;
    }

    function handleClick(evt) {
        const coords = getCoords(evt);
        const hit = findNodeAt(coords.x, coords.y);
        if (hit && typeof onSelectDistrict === 'function') {
            onSelectDistrict(hit.district);
        }
    }

    function handleMouseMove(evt) {
        const coords = getCoords(evt);
        const hit = findNodeAt(coords.x, coords.y);
        const nextHovered = hit ? hit.district : null;
        if (nextHovered !== hoveredDistrict) {
            hoveredDistrict = nextHovered;
            if (canvas.style) {
                canvas.style.cursor = hit ? 'pointer' : 'default';
            }
            if (animFrameId === null) {
                renderFrame();
            }
        }
    }

    function handleMouseLeave() {
        if (hoveredDistrict !== null) {
            hoveredDistrict = null;
            if (canvas.style) {
                canvas.style.cursor = 'default';
            }
            if (animFrameId === null) {
                renderFrame();
            }
        }
    }

    if (typeof canvas.addEventListener === 'function') {
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    function destroy() {
        isDestroyed = true;
        if (animFrameId !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        if (canvas && typeof canvas.removeEventListener === 'function') {
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        }
        if (activeHubController === controller) {
            activeHubController = null;
        }
    }

    function loop() {
        if (isDestroyed) return;
        rotationAngle += 0.007;
        renderFrame();
        if (typeof requestAnimationFrame === 'function') {
            animFrameId = requestAnimationFrame(loop);
        }
    }

    // Render initial frame
    renderFrame();

    // Start lightweight animation loop if available
    if (typeof requestAnimationFrame === 'function') {
        animFrameId = requestAnimationFrame(loop);
    }

    const controller = {
        renderFrame,
        destroy
    };

    activeHubController = controller;
    return controller;
}

/**
 * Draw the shaded 3D planetary sphere with atmosphere and surface features
 */
function drawPlanetSphere(ctx, cx, cy, r, palette, angle) {
    if (typeof ctx.save !== 'function') return;
    ctx.save();

    // 1. Atmosphere outer glow
    if (typeof ctx.createRadialGradient === 'function' && typeof ctx.arc === 'function') {
        try {
            const glow = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.3);
            glow.addColorStop(0, palette.atmosphere);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
            ctx.fill();
        } catch (e) {}
    }

    // 2. Planet base circle
    if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = palette.primary;
        ctx.fill();
    }

    // Clip to sphere for surface details
    ctx.save();
    if (typeof ctx.clip === 'function') {
        ctx.clip();
    }

    // Procedural terrain bands rotating with angle
    if (typeof ctx.fillRect === 'function' || typeof ctx.rect === 'function') {
        ctx.fillStyle = palette.secondary;
        const bandOffset = (angle * 25) % (r * 2);
        for (let i = -2; i <= 2; i++) {
            const yPos = cy + i * (r * 0.35);
            if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function') {
                ctx.beginPath();
                ctx.rect(cx - r - bandOffset, yPos - 5, r * 4, 10);
                ctx.fill();
            } else if (typeof ctx.fillRect === 'function') {
                ctx.fillRect(cx - r - bandOffset, yPos - 5, r * 4, 10);
            }
        }
    }

    // 3D Spherical Light / Shadow Gradient
    if (typeof ctx.createRadialGradient === 'function' && typeof ctx.fillRect === 'function') {
        try {
            const lightX = cx - r * 0.35;
            const lightY = cy - r * 0.35;
            const shade = ctx.createRadialGradient(lightX, lightY, r * 0.1, cx, cy, r);
            shade.addColorStop(0, palette.highlight || 'rgba(255, 255, 255, 0.45)');
            shade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            shade.addColorStop(1, palette.shadow || 'rgba(2, 6, 23, 0.85)');
            ctx.fillStyle = shade;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        } catch (e) {}
    }

    ctx.restore(); // unclip

    // Atmosphere rim stroke
    if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function' && typeof ctx.stroke === 'function') {
        ctx.strokeStyle = palette.atmosphere;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw a single district beacon
 */
function drawBeacon(ctx, node, palette, isFront, isHovered) {
    if (typeof ctx.save !== 'function') return;
    const { x, y, scale, district } = node;
    const baseR = 5 * scale;
    const alpha = isFront ? 1.0 : 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow halo
    if ((isFront || isHovered) && typeof ctx.arc === 'function') {
        ctx.beginPath();
        const haloR = isHovered ? baseR * 2.2 : baseR * 1.6;
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = palette.beaconGlow || 'rgba(56, 189, 248, 0.5)';
        ctx.fill();
    }

    // Beacon core dot
    if (typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? baseR * 1.3 : baseR, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#ffffff' : (palette.beacon || '#38bdf8');
        ctx.fill();

        // White border ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isHovered ? 1.8 : 1.0;
        ctx.stroke();
    }

    // Beacon label (shown for front beacons or hovered)
    if ((isFront || isHovered) && typeof ctx.fillText === 'function') {
        const text = district.name || district.id || 'District';
        const icon = district.icon || '📍';
        const label = `${icon} ${text}`;

        ctx.font = isHovered ? 'bold 10px monospace' : '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        if (typeof ctx.measureText === 'function' && typeof ctx.fillRect === 'function') {
            const metrics = ctx.measureText(label);
            const textW = metrics.width || (label.length * 6);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(x - textW / 2 - 3, y - baseR - 16, textW + 6, 13);
        }

        ctx.fillStyle = isHovered ? '#ffffff' : '#a5f3fc';
        ctx.fillText(label, x, y - baseR - 4);
    }

    ctx.restore();
}

/**
 * Draw HUD telemetry text
 */
function drawHudOverlay(ctx, W, H, locName, districtCount) {
    if (typeof ctx.save !== 'function' || typeof ctx.fillText !== 'function') return;
    ctx.save();
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SECTOR // ${String(locName).toUpperCase()}`, 10, 8);
    ctx.fillText(`NODES: ${districtCount} MAPPED`, 10, 20);

    ctx.textAlign = 'right';
    ctx.fillText(`ROTATION // ACTIVE`, W - 10, 8);
    ctx.restore();
}
