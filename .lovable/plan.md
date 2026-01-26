

## Datenbach Invite Code Generator

A mobile-first PWA that lets Matrix users create and share invite codes for friends, wrapped in a charming SNES-era pixel art aesthetic inspired by Odenwald nature.

---

### Visual Identity & Theme

**Color Palette**
- Dark forest green backgrounds
- Orange accent color for interactive elements
- Blue highlights for secondary actions
- Pixel-perfect borders and UI elements

**Design Style**
- Full pixel art aesthetic (Stardew Valley / Harvest Moon inspired)
- Community bulletin board "tear-off tabs" for the invite code display
- Light on heavy graphics, focused on clean pixel UI elements

---

### Pixel Companion Character

**Forest Creature Guide**
- A cute woodland animal (fox, owl, or deer) rendered in pixel art
- Appears throughout the user journey with contextual help

**Interactions**
- Speech bubbles with friendly text prompts ("Welcome back!", "Your code is ready!")
- Animated reactions for key moments (waving on login, celebrating on code creation, sleeping during countdown)

---

### User Journey & Screens

**1. Welcome/Login Screen**
- Full-screen forest-themed background
- Companion greets new visitors with a speech bubble
- Large, pixel-styled "Sign In" button
- Tapping initiates OIDC flow (mocked for now, prepared for real Matrix OIDC)

**2. Main Dashboard (Logged In)**
- Full-screen card styled as a community bulletin board
- Perforated tear-off tabs at the bottom showing the 6-character code
- Large circular button to generate a new invite code
- Companion character reacts when code is created

**3. Active Code State**
- Code displayed prominently in tear-off tab style
- Circular countdown wheel showing 7-day expiration
- Companion offers encouraging messages
- Tap code → opens QR view

**4. QR Code View**
- Full-screen overlay with large QR code (containing just the 6-char code)
- Code displayed below in clear pixel font
- Tap anywhere to dismiss
- Companion waves goodbye

**5. Code Regeneration**
- Swipe gesture on code card triggers confirmation dialog
- Companion asks "Are you sure?" in speech bubble
- Confirm creates new code and resets timer

---

### Technical Features

**PWA Setup**
- Installable to home screen
- Offline-capable (shows cached code state)
- Mobile-first responsive design

**Code Management**
- 6-character alphanumeric codes
- 7-day expiration with local timer
- Stored locally with creation timestamp
- Mocked API calls (ready for Matrix integration)

**OIDC Preparation**
- Auth flow structure in place
- Easy to connect real Matrix OIDC when ready
- Secure token handling patterns

---

### Interactions & Animations

- Pixel-perfect button press effects
- Smooth countdown wheel animation
- Character idle animations and reactions
- Swipe gestures for code regeneration
- Tear-off tab visual feedback

