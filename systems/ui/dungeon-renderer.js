/**
 * Dungeon Renderer Module
 * Handles retro-futuristic pseudo-3D first-person wireframe raycasting
 * and 2D radar minimap rendering for derelict ships.
 */

let state;

export function initDungeonRenderer(gameState) {
    state = gameState;
}

/**
 * Render both the 3D viewport and 2D minimap
 */
export function renderDungeon() {
    if (!state || !state.derelict || !state.derelict.active) return;

    render3DViewport();
    renderMinimap();
}

/**
 * Render first-person 3D vector graphics view
 */
function render3DViewport() {
    const canvas = document.getElementById('dungeonCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // 1. Clear background (retro dark space black)
    ctx.fillStyle = '#0a0601';
    ctx.fillRect(0, 0, W, H);

    // Draw horizon line
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    const dState = state.derelict;
    const grid = dState.map;
    
    // Player floating point position (center of current cell)
    const playerX = dState.x + 0.5;
    const playerY = dState.y + 0.5;
    
    // Direction vector
    const dirX = dState.dirX;
    const dirY = dState.dirY;

    // Camera plane rotated 90 degrees and scaled
    const planeX = -dirY * 0.66;
    const planeY = dirX * 0.66;

    // Z-Buffer for sprite casting
    const zBuffer = new Array(W).fill(Infinity);

    // Track previous ray hits to draw vertical boundaries on change (wireframe effect)
    let prevMapX = -1;
    let prevMapY = -1;
    let prevSide = -1;
    let prevDrawStart = -1;
    let prevDrawEnd = -1;

    // Store vertical edges to render afterwards (wireframe outlines)
    const verticalEdges = [];

    // 2. Raycast columns
    for (let x = 0; x < W; x++) {
        // Calculate ray position and direction
        const cameraX = (2 * x) / W - 1;
        const rayDirX = dirX + planeX * cameraX;
        const rayDirY = dirY + planeY * cameraX;

        // Current grid cell
        let mapX = Math.floor(playerX);
        let mapY = Math.floor(playerY);

        // Length of ray from one x or y-side to next x or y-side
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);

        let stepX, stepY;
        let sideDistX, sideDistY;

        // Calculate step and initial sideDist
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (playerX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - playerX) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (playerY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - playerY) * deltaDistY;
        }

        // Perform DDA
        let hit = 0;
        let side = 0; // 0 = X-side, 1 = Y-side
        const maxDdaSteps = 40;
        let stepCount = 0;

        while (hit === 0 && stepCount < maxDdaSteps) {
            stepCount++;
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            // Check out of bounds
            if (mapX < 0 || mapX >= 8 || mapY < 0 || mapY >= 8) {
                hit = 1;
                break;
            }

            // Check if ray hit a wall (1)
            if (grid[mapY][mapX] === 1) {
                hit = 1;
            }
        }

        // Calculate distance projected on camera direction
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - playerX + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - playerY + (1 - stepY) / 2) / rayDirY;
        }

        // Avoid division by zero
        if (perpWallDist <= 0) perpWallDist = 0.01;

        zBuffer[x] = perpWallDist;

        // Calculate height of line to draw
        const lineHeight = Math.floor(H / perpWallDist);

        // Calculate lowest and highest pixel to fill in current stripe
        let drawStart = -lineHeight / 2 + H / 2;
        let drawEnd = lineHeight / 2 + H / 2;

        // Setup stroke color based on depth (fog effect)
        const alpha = Math.min(1.0, 3.5 / perpWallDist);
        const strokeColor = `rgba(255, 184, 0, ${alpha * 0.7})`; // Radioactive Amber

        // 3. Draw horizontal wall wireframe edges (ceiling and floor borders of walls)
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;

        // Draw top ceiling line of wall
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawStart + 1);
        ctx.stroke();

        // Draw bottom floor line of wall
        ctx.beginPath();
        ctx.moveTo(x, drawEnd);
        ctx.lineTo(x, drawEnd - 1);
        ctx.stroke();

        // If the grid coordinate or wall side changes, this is a wall edge intersection!
        // Record it to draw a vertical wireframe line.
        if (x > 0 && (mapX !== prevMapX || mapY !== prevMapY || side !== prevSide)) {
            verticalEdges.push({
                x: x,
                y1: Math.min(drawStart, prevDrawStart),
                y2: Math.max(drawEnd, prevDrawEnd),
                color: strokeColor
            });
        }

        // Always draw final vertical borders at screen boundaries
        if (x === 0 || x === W - 1) {
            verticalEdges.push({
                x: x,
                y1: drawStart,
                y2: drawEnd,
                color: strokeColor
            });
        }

        prevMapX = mapX;
        prevMapY = mapY;
        prevSide = side;
        prevDrawStart = drawStart;
        prevDrawEnd = drawEnd;
    }

    // Render the recorded vertical wireframe wall edges
    verticalEdges.forEach(edge => {
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(edge.x, edge.y1);
        ctx.lineTo(edge.x, edge.y2);
        ctx.stroke();
    });

    // 4. Draw wireframe floor/ceiling grid lines converging to center
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(W / 2, H / 2);
        ctx.lineTo(i, H);
        ctx.stroke();
    }

    // 5. Project and draw sprites/entities (Chests, Hazards, Boss, Airlock)
    renderSprites(ctx, W, H, playerX, playerY, dirX, dirY, planeX, planeY, zBuffer);
}

/**
 * Render billboards/sprites inside 3D viewport
 */
function renderSprites(ctx, W, H, playerX, playerY, dirX, dirY, planeX, planeY, zBuffer) {
    const dState = state.derelict;
    const grid = dState.map;
    const sprites = [];

    // Scan grid for active objects (2 = Hazard, 3 = Loot, 4 = Boss, 5 = Airlock)
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const val = grid[y][x];
            if (val > 1) {
                // If it is the boss and it is already defeated, do not draw it
                if (val === 4 && dState.bossDefeated) continue;
                
                sprites.push({
                    x: x + 0.5,
                    y: y + 0.5,
                    type: val
                });
            }
        }
    }

    // Sort sprites from far to near
    sprites.sort((a, b) => {
        const distA = (playerX - a.x) ** 2 + (playerY - a.y) ** 2;
        const distB = (playerX - b.x) ** 2 + (playerY - b.y) ** 2;
        return distB - distA;
    });

    // Draw sprites
    sprites.forEach(sprite => {
        const spriteX = sprite.x - playerX;
        const spriteY = sprite.y - playerY;

        // Transform sprite with camera matrix
        const invDet = 1.0 / (planeX * dirY - dirX * planeY);
        const transformX = invDet * (dirY * spriteX - dirX * spriteY);
        const transformY = invDet * (-planeY * spriteX + planeX * spriteY); // Depth

        // If in front of player
        if (transformY > 0.1) {
            const spriteScreenX = Math.floor((W / 2) * (1 + transformX / transformY));
            const spriteSize = Math.abs(Math.floor(H / transformY));

            // Z-Buffer check to make sure sprite is not fully hidden behind a wall
            const startX = Math.max(0, Math.floor(spriteScreenX - spriteSize / 2));
            const endX = Math.min(W - 1, Math.floor(spriteScreenX + spriteSize / 2));
            
            let visible = false;
            for (let stripe = startX; stripe <= endX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    visible = true;
                    break;
                }
            }

            if (visible) {
                const alpha = Math.min(1.0, 3.5 / transformY);
                drawWireframeSprite(ctx, spriteScreenX, H / 2, spriteSize, sprite.type, alpha);
            }
        }
    });
}

/**
 * Draw custom wireframe vector graphics representing the entity
 */
function drawWireframeSprite(ctx, cx, cy, size, type, alpha) {
    ctx.lineWidth = 2;
    
    if (type === 3) {
        // 📦 Loot Chest: Faint golden neon wireframe cube
        ctx.strokeStyle = `rgba(234, 179, 8, ${alpha})`;
        const w = size * 0.4;
        const h = size * 0.3;
        
        // Front face
        ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        
        // Perspective back face
        const offset = w * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy - h / 2);
        ctx.lineTo(cx - w / 2 + offset, cy - h / 2 - offset);
        ctx.lineTo(cx + w / 2 + offset, cy - h / 2 - offset);
        ctx.lineTo(cx + w / 2, cy - h / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + w / 2 + offset, cy - h / 2 - offset);
        ctx.lineTo(cx + w / 2 + offset, cy + h / 2 - offset);
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.stroke();

        // Connect remaining edge
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy + h / 2);
        ctx.lineTo(cx - w / 2 + offset, cy + h / 2 - offset);
        ctx.lineTo(cx + w / 2 + offset, cy + h / 2 - offset);
        ctx.stroke();
        
    } else if (type === 2) {
        // ⚠️ Hazard: Neon orange/red warnings triangle
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        const side = size * 0.4;
        const h = (Math.sqrt(3) / 2) * side;

        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2);
        ctx.lineTo(cx - side / 2, cy + h / 2);
        ctx.lineTo(cx + side / 2, cy + h / 2);
        ctx.closePath();
        ctx.stroke();

        // Exclamation inside
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.fillRect(cx - 2, cy - h / 4, 4, h * 0.4);
        ctx.fillRect(cx - 2, cy + h / 4, 4, 4);

    } else if (type === 4) {
        // 💀 Boss: Menacing bright red cyber-spider/alien drone
        ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
        const r = size * 0.2;

        // Draw glowing inner core
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Radiating laser eyes / limbs
        const legs = [
            [-r * 2, -r], [-r * 2, r], [r * 2, -r], [r * 2, r],
            [-r * 1.5, -r * 1.5], [r * 1.5, -r * 1.5]
        ];

        legs.forEach(([lx, ly]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + lx, cy + ly);
            ctx.stroke();
        });

    } else if (type === 5) {
        // 🚪 Airlock escape: Cyan portal/door
        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        const w = size * 0.4;
        const h = size * 0.6;

        // Vault ring
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Outer arch
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy + h / 2);
        ctx.lineTo(cx - w / 2, cy - h / 2);
        ctx.arc(cx, cy - h / 2, w / 2, Math.PI, 0);
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.closePath();
        ctx.stroke();

        // Inner spokes
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * w * 0.5);
            ctx.stroke();
        }
    }
}

/**
 * Render 2D tactical radar minimap
 */
function renderMinimap() {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Clear minimap
    ctx.fillStyle = '#020504';
    ctx.fillRect(0, 0, W, H);

    const dState = state.derelict;
    const grid = dState.map;
    const visited = dState.visited;

    const gridSize = 8;
    const cellSize = W / gridSize;

    // Draw grid cells
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const isVisited = visited[y][x];
            
            if (isVisited) {
                const cellVal = grid[y][x];

                if (cellVal === 1) {
                    // Wall (shouldn't really be visited, but safety check)
                    ctx.fillStyle = '#1c2e27';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                } else {
                    // Explored floor
                    ctx.fillStyle = 'rgba(0, 255, 204, 0.07)';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Draw icons or colored blocks for interactive elements
                    if (cellVal === 5) {
                        // Airlock
                        ctx.fillStyle = '#3b82f6';
                        ctx.fillRect(x * cellSize + 3, y * cellSize + 3, cellSize - 6, cellSize - 6);
                    } else if (cellVal === 3) {
                        // Loot
                        ctx.fillStyle = '#eab308';
                        ctx.fillRect(x * cellSize + 3, y * cellSize + 3, cellSize - 6, cellSize - 6);
                    } else if (cellVal === 2) {
                        // Hazard
                        ctx.fillStyle = '#ef4444';
                        ctx.fillRect(x * cellSize + 3, y * cellSize + 3, cellSize - 6, cellSize - 6);
                    } else if (cellVal === 4 && !dState.bossDefeated) {
                        // Boss
                        ctx.fillStyle = '#dc2626';
                        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                    }
                }
            } else {
                // Unvisited cell
                // Check if it's adjacent to a visited cell to render it as a fuzzy radar signature
                let isAdjacent = false;
                const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                        if (visited[ny][nx]) {
                            isAdjacent = true;
                            break;
                        }
                    }
                }

                if (isAdjacent) {
                    const cellVal = grid[y][x];
                    if (cellVal === 1) {
                        // Wall edge revealed on scanner
                        ctx.strokeStyle = 'rgba(255, 184, 0, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                    } else {
                        // Empty hallway signature
                        ctx.fillStyle = 'rgba(255, 184, 0, 0.02)';
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        
                        // Faint warning or loot marker based on scanner
                        if (cellVal === 4) {
                            ctx.fillStyle = 'rgba(220, 38, 38, 0.15)'; // Boss alert
                            ctx.beginPath();
                            ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (cellVal === 3) {
                            ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; // Loot alert
                            ctx.beginPath();
                            ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }

            // Draw grid outline
            ctx.strokeStyle = 'rgba(255, 184, 0, 0.04)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }

    // Draw Player Arrow
    const px = dState.x * cellSize + cellSize / 2;
    const py = dState.y * cellSize + cellSize / 2;
    const arrowSize = cellSize * 0.4;
    
    // Rotate triangle matching direction vector (dirX, dirY)
    ctx.fillStyle = '#ffb800';
    ctx.shadowColor = '#ffb800';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    // Angle rotation
    const angle = Math.atan2(dState.dirY, dState.dirX);
    ctx.moveTo(px + Math.cos(angle) * arrowSize, py + Math.sin(angle) * arrowSize);
    ctx.lineTo(px + Math.cos(angle + (Math.PI * 5) / 6) * arrowSize * 0.8, py + Math.sin(angle + (Math.PI * 5) / 6) * arrowSize * 0.8);
    ctx.lineTo(px + Math.cos(angle - (Math.PI * 5) / 6) * arrowSize * 0.8, py + Math.sin(angle - (Math.PI * 5) / 6) * arrowSize * 0.8);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}
