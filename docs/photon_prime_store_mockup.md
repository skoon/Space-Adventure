# UI Design Mockup — Photon Prime Store

This document presents the visual mockup design for the **Photon Prime Online Store** interface. In the game, players can open the store to order items (like Plasma Cores, Circuit Boards, or custom accessories) remotely from anywhere, which are later delivered to planetary Drop Boxes. 

Below is the proposed design layout to upgrade the existing simple shop interface into a premium, immersive cyber-grid dashboard.

---

## 1. Visual Mockup Design

![Photon Prime Store UI Mockup](file:///C:/Users/Scott%20Koon/.gemini/antigravity/brain/b960922c-f226-4310-9ddc-85f5232472fb/photon_prime_store_ui_mockup_1783789367946.jpg)

### Key Design Pillars:
1. **Glassmorphism Panels:** Sleek semi-translucent dark panels with dynamic backdrops that float over the deep-space starfield container.
2. **Neon Orange Gridlines:** High-contrast tactical amber/orange HUD grids (`#ff7a00`) that convey corporate/industrial Syndicate efficiency.
3. **Product Action Cards:** Elevated grids that display neon holographic items in 3D rotations, with purchase buttons and credit balances flashing upon interaction.
4. **Order Tracking HUD:** A circular status gauge tracking active deliveries in real-time, showing how many seconds remain before the shipment lands in the planetary drop box.

---

## 2. Technical UI Implementation Plan

To translate this mockup into the game, we will update the HTML template in [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html) and add CSS classes to [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css).

### A. CSS Styles Injection (`style.css`)
```css
/* Photon Prime Store Glassmorphic Panel */
.photon-store-container {
    background: rgba(10, 16, 26, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 122, 0, 0.4);
    box-shadow: 0 0 25px rgba(255, 122, 0, 0.15);
    border-radius: 8px;
    color: #ffb87a;
    font-family: 'Outfit', sans-serif;
}

/* Glowing Amber Button */
.photon-buy-btn {
    background: linear-gradient(135deg, #ff7a00 0%, #cc5200 100%);
    border: 1px solid #ffaa55;
    box-shadow: 0 0 10px rgba(255, 122, 0, 0.3);
    color: #0d0805;
    font-weight: 700;
    transition: all 0.2s ease-in-out;
}

.photon-buy-btn:hover {
    box-shadow: 0 0 18px rgba(255, 122, 0, 0.6);
    transform: translateY(-1px);
    cursor: pointer;
}

/* Micro-Animation: Pulse Ring for Delivery Loader */
@keyframes ring-pulse {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(0.95); opacity: 0.5; }
}

.delivery-pulse-indicator {
    border: 2px solid #ff7a00;
    border-radius: 50%;
    animation: ring-pulse 2s infinite ease-in-out;
}
```

### B. HTML Layout Refactoring (`index.html`)
The existing shop panel is replaced with a responsive grid section:
```html
<div id="photonStorePanel" class="photon-store-container p-6 hidden">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-orange-500 pb-3 mb-4">
        <h2 class="text-xl font-bold tracking-wider text-orange-400">>> PHOTON PRIME COM-NET SHOP <<</h2>
        <div class="text-sm font-semibold">Balance: <span id="photonCredits">120</span> CR</div>
    </div>
    
    <!-- Grid -->
    <div class="grid grid-cols-3 gap-4">
        <!-- Item Card -->
        <div class="border border-orange-900 bg-black/40 p-4 rounded flex flex-col justify-between">
            <div>
                <h3 class="text-md font-bold text-orange-300">Plasma Core</h3>
                <p class="text-xs text-gray-400 my-1">Highly concentrated energy cell for weapon crafts.</p>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <span class="text-orange-400 font-bold">150 CR</span>
                <button onclick="orderItem('plasma_core')" class="photon-buy-btn px-3 py-1 rounded text-xs">ORDER</button>
            </div>
        </div>
    </div>
</div>
```

---

## 3. UI logic hook (`shop-ui.js`)

The delivery logic in [`shop-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/shop-ui.js) updates the delivery rings:
1. When `orderItem()` is triggered, a pending order object is pushed to `state.character.pendingOrders[]` with a calculated timestamp.
2. The UI renders the active order cards under a new **"Pending Shipments"** tab, featuring a counting-down loader and localized progress circles.
3. Upon arrival (transit complete / seconds hit 0), the UI displays a notification: `"🚨 Photon Prime shipment dropped at planet's drop box!"` and enables the **"Claim Shipments"** button.
