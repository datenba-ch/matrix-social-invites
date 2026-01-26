

## Plan: German Translation, Enhanced Forest Background & Mobile Dialog Fixes

This plan covers three main changes: adding visible trees to the forest background while preserving the dark green theme, fixing the regeneration dialog for mobile viewports, and translating all UI content to German.

---

### 1. Enhanced Forest Background with Green Overlay

**Current State**: The `ForestBackground` component exists but has `showTrees={false}` on the Dashboard page, and the trees may blend poorly with the background.

**Changes**:
- In `Dashboard.tsx`: Enable `showTrees={true}` on `ForestBackground`
- In `ForestBackground.tsx`: Reduce tree opacity to ensure they appear as subtle silhouettes behind the main green background, creating depth without overpowering the UI
- Adjust the gradient overlay to maintain the dark forest green atmosphere while allowing trees to show through

---

### 2. Mobile Dialog Centering & Button Alignment

**Current State**: The regeneration confirmation `AlertDialog` may have alignment issues on small screens.

**Changes in `Dashboard.tsx`**:
- Update `AlertDialogContent` classes to ensure proper centering with `fixed inset-0 m-auto` approach
- Add `flex flex-col items-center` to properly center all content within the dialog
- Adjust `AlertDialogFooter` to use `flex-row gap-3 justify-center` for consistent horizontal button layout
- Add `w-fit h-fit` constraints to ensure the dialog sizes correctly
- Add proper padding and max-width constraints for very small screens

---

### 3. German Translation

**All text content will be translated to German:**

**Welcome.tsx**:
- "INVITE CODE GENERATOR" → "EINLADUNGSCODE GENERATOR"
- "Logging in..." → "Anmeldung..."
- "Welcome to the forest! Ready to create invite codes?" → "Willkommen im Wald! Bereit Einladungscodes zu erstellen?"
- "SIGNING IN..." → "ANMELDEN..."
- "SIGN IN" → "ANMELDEN"
- "Sign in with your Matrix account to create invite codes for friends" → "Melde dich mit deinem Matrix-Konto an, um Einladungscodes für Freunde zu erstellen"

**Dashboard.tsx**:
- "LOGOUT" → "ABMELDEN"
- "INVITE CODE" → "EINLADUNGSCODE"
- "Creating your code..." → "Erstelle deinen Code..."
- "Your new code is ready!" → "Dein neuer Code ist bereit!"
- "Your code expires soon!" → "Dein Code läuft bald ab!"
- "A few days left on this code." → "Noch ein paar Tage für diesen Code."
- "Your code is ready to share!" → "Dein Code ist bereit zum Teilen!"
- "Generate a new invite code!" → "Erstelle einen neuen Einladungscode!"
- "Show this to your friend!" → "Zeig das deinem Freund!"
- "NEW CODE" → "NEUER CODE"
- "No active code" → "Kein aktiver Code"
- "CREATING..." → "ERSTELLE..."
- "GENERATE CODE" → "CODE ERSTELLEN"
- "Are you sure?" → "Bist du sicher?"
- "REGENERATE CODE?" → "CODE NEU ERSTELLEN?"
- "This will replace your current code. The old code will stop working." → "Dies ersetzt deinen aktuellen Code. Der alte Code funktioniert dann nicht mehr."
- "CANCEL" → "ABBRECHEN"
- "REGENERATE" → "NEU ERSTELLEN"

**TearOffCode.tsx**:
- "← REGENERATE" → "← NEU ERSTELLEN"
- "TAP TO SHOW QR • SWIPE LEFT TO REGENERATE" → "TIPPEN FÜR QR • NACH LINKS WISCHEN ZUM ERNEUERN"

**QRCodeOverlay.tsx**:
- "Scan me!" → "Scann mich!"
- "TAP ANYWHERE TO CLOSE" → "TIPPEN ZUM SCHLIESSEN"

**CountdownWheel.tsx**:
- "DAY" → "TAG"
- "DAYS" → "TAGE"

**PixelCompanion.tsx** (dialog message):
- "Are you sure?" → "Bist du sicher?"

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Enable showTrees, fix AlertDialog mobile layout, German translations |
| `src/pages/Welcome.tsx` | German translations |
| `src/components/ForestBackground.tsx` | Adjust tree opacity for better background integration |
| `src/components/TearOffCode.tsx` | German translations |
| `src/components/QRCodeOverlay.tsx` | German translations |
| `src/components/CountdownWheel.tsx` | German translations |

---

### Technical Details

**Forest Background Enhancement**:
```tsx
// ForestBackground.tsx - reduce tree opacity for subtle silhouette effect
<div className="absolute inset-x-0 bottom-0 h-32 opacity-20">
```

**Mobile Dialog Fix**:
```tsx
// Dashboard.tsx - improved AlertDialog styling
<AlertDialogContent className="bg-card border-4 border-border fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xs p-6">
  <AlertDialogHeader className="flex flex-col items-center space-y-4">
    ...
  </AlertDialogHeader>
  <AlertDialogFooter className="flex flex-row justify-center gap-3 mt-4 sm:justify-center">
    ...
  </AlertDialogFooter>
</AlertDialogContent>
```

