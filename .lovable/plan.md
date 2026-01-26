

## Plan: UI Refinements for Dashboard

This plan addresses four specific visual improvements: logout button visibility, countdown wheel sizing, code/button positioning, and enhanced tear-off styling.

---

### 1. Logout Button - Solid Background

**Current Issue**: The logout button uses `variant="ghost"` which has a transparent background, making it hard to see against the forest wallpaper.

**Solution**: Change the variant to `secondary` or add a solid muted background to the ghost variant.

**Changes in `Dashboard.tsx`**:
- Line 121: Change `variant="ghost"` to `variant="secondary"` for the logout button
- This provides a visible blue background while maintaining the pixel aesthetic

---

### 2. Countdown Wheel - 70% Container Width

**Current Issue**: The countdown wheel has a fixed size of `w-28 h-28` (112px × 112px).

**Changes in `CountdownWheel.tsx`**:
- Replace the fixed `w-28 h-28` with `w-[70%] aspect-square` to make it responsive
- Update center text sizing to scale proportionally using larger font sizes
- The notched segments are already implemented and will scale with the container

---

### 3. Code and Button - Pinned to Bottom

**Current Issue**: The code display and "NEUER CODE" button are vertically centered in the bulletin board rather than anchored at the bottom.

**Changes in `Dashboard.tsx`**:
- Restructure the bulletin board content to use flexbox with `flex-col justify-between`
- Create a top section for the heading and countdown wheel
- Create a bottom section with `mt-auto` for the code display and regenerate button
- This ensures the code tabs are always at the bottom of the bulletin board

---

### 4. Tear-Off Code - Brighter Background & Dotted Edge

**Current Issue**: The code tabs use `bg-pixel-cream` which may blend in, and the tear-off edge uses solid dashes rather than dots.

**Changes in `TearOffCode.tsx`**:
- Update the code tab background to a brighter cream/white color: `bg-[hsl(45,100%,95%)]`
- Add a subtle glow or higher contrast border to make tabs pop

**Changes in `src/index.css`**:
- Update the `.tear-off-edge` utility class to use a dotted pattern instead of dashed
- Create a more authentic "perforated" tab look with small circular dots

**New CSS pattern**:
```css
.tear-off-edge {
  background-image: radial-gradient(
    circle,
    hsl(var(--border)) 2px,
    transparent 2px
  );
  background-size: 12px 12px;
  background-position: center;
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Logout button variant, restructure bulletin board layout for bottom-pinned code |
| `src/components/CountdownWheel.tsx` | Change from fixed size to 70% width with aspect-square |
| `src/components/TearOffCode.tsx` | Brighter background color for code tabs |
| `src/index.css` | Update tear-off-edge to dotted pattern |

---

### Technical Implementation Details

**Dashboard Layout Structure**:
```tsx
<BulletinBoard className="flex-1 max-w-sm">
  <div className="flex flex-col h-full">
    {/* Top section - title and countdown */}
    <div className="text-center">
      <h2>EINLADUNGSCODE</h2>
      <CountdownWheel ... />
    </div>
    
    {/* Bottom section - code and button pinned to bottom */}
    <div className="mt-auto text-center">
      <TearOffCode ... />
      <PixelButton>NEUER CODE</PixelButton>
    </div>
  </div>
</BulletinBoard>
```

**CountdownWheel Responsive Sizing**:
```tsx
<div className={cn("relative w-[70%] aspect-square mx-auto", className)}>
  {/* SVG scales automatically with container */}
</div>
```

**Enhanced Tear-Off Edge CSS**:
```css
.tear-off-edge {
  background-image: radial-gradient(
    circle at center,
    hsl(var(--muted-foreground)) 2px,
    transparent 2px
  );
  background-size: 10px 10px;
  height: 8px;
}
```

