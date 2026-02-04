# Build Debug Report - Yeonhui Studio (Ttalkkak Passport AI)

**Last Updated:** 2026-02-04
**Project:** ddalkak-creator-studio
**Version:** 1.0.0
**Build Status:** SUCCESS

---

## 1. Latest Vercel Build Log

### Build Info
| Item | Value |
|------|-------|
| Timestamp | 2026-02-04 16:27:10 UTC |
| Region | Washington, D.C., USA (iad1) |
| Machine | 2 cores, 8 GB RAM |
| Vercel CLI | 50.9.6 |
| Repository | github.com/wlstn562-gif/onepage-ai-maker |
| Branch | main |
| Commit | aa06167 |

### Build Timeline
| Step | Duration | Status |
|------|----------|--------|
| Cloning | 457ms | OK |
| Dependencies Install | 10s (179 packages) | OK |
| Compilation | ~15s | OK |
| Static Page Generation | 34 pages | OK |
| **Total Build** | ~45s | SUCCESS |

### Build Output
```
✓ Compiled successfully
✓ Generating static pages (34/34)
✓ Finalizing page optimization
✓ Collecting build traces
```

---

## 2. Warnings & Action Items

### 2.1 CRITICAL - Security Vulnerability

| Severity | Package | Issue | Action Required |
|----------|---------|-------|-----------------|
| HIGH | next@15.1.5 | CVE-2025-66478 Security Vulnerability | **UPGRADE IMMEDIATELY** |

**Fix Command:**
```bash
npm install next@latest
```

**Reference:** https://nextjs.org/blog/CVE-2025-66478

### 2.2 Deprecated Packages

| Package | Message | Priority |
|---------|---------|----------|
| node-domexception@1.0.0 | Use platform's native DOMException | LOW |

### 2.3 Edge Runtime Warning

```
⚠ Using edge runtime on a page currently disables static generation for that page
```

**Impact:** Some pages may not be statically generated
**Resolution:** Review pages using edge runtime and consider switching to Node.js runtime if static generation is needed

---

## 3. Project Overview

| Item | Value |
|------|-------|
| Framework | Next.js 15.1.5 (needs upgrade) |
| React | ^19.0.0 |
| Styling | Tailwind CSS ^3.4.1 |
| Language | TypeScript ^5 |
| Package Manager | npm |
| Total Packages | 179 |

---

## 4. Dependencies Status

### 4.1 Core Dependencies

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| next | 15.1.5 | VULNERABLE | Upgrade to latest |
| react | ^19.0.0 | OK | |
| react-dom | ^19.0.0 | OK | |
| tailwindcss | ^3.4.1 | OK | |
| @tailwindcss/container-queries | ^0.1.1 | OK | |
| sharp | ^0.34.5 | OK | Image optimization |
| zod | ^3.25.76 | OK | Validation |
| openai | ^4.0.0 | OK | AI integration |
| google-auth-library | ^9.0.0 | OK | |
| google-trends-api | ^4.9.2 | OK | |

### 4.2 Recommended Upgrades

```bash
# Upgrade Next.js to fix security vulnerability
npm install next@latest

# Check for other outdated packages
npm outdated
```

---

## 5. Tailwind Configuration

**File:** `tailwind.config.js`

### Custom Colors
```javascript
colors: {
  primary: "#FFC107",              // Premium Gold
  "accent-pink": "#FF6B6B",        // CTA Pink
  "accent-blue": "#4DABF7",        // Feature Blue
  "accent-green": "#51CF66",       // Success Green
  "accent-purple": "#BE4BDB",      // Feature Purple
  "background-vibrant": "#FFD43B", // Main Background
}
```

### 3D Shadow Effects
```javascript
boxShadow: {
  "3d-black": "0 6px 0 0 #000000",
  "3d-pink": "0 8px 0 0 #E03131",
  "3d-blue": "0 6px 0 0 #1971C2",
  "3d-purple": "0 6px 0 0 #862E9C",
  "3d-green": "0 6px 0 0 #2F9E44",
}
```

---

## 6. Component Status

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| Header | `src/components/Header.tsx` | OK | Navigation with logo |
| Hero | `src/components/Hero.tsx` | OK | Korean text, 3D button |
| Features | `src/components/Features.tsx` | OK | 3-column grid, colored icons |
| DemoSection | `src/components/DemoSection.tsx` | OK | Before/After hover effect |
| CallToAction | `src/components/CallToAction.tsx` | OK | Pink CTA button, badge |
| Footer | `src/components/Footer.tsx` | OK | Black rounded footer |

---

## 7. Global Styles Status

**File:** `src/app/globals.css`

### Font Configuration
- **Primary Font:** Plus Jakarta Sans (Google Fonts)
- **Icon Font:** Material Symbols Outlined
- **Fallback:** Pretendard, system-ui

### CSS Variables
```css
:root {
  --vibrant-yellow: #FFD43B;
  --premium-gold: #FFC107;
  --accent-pink: #FF6B6B;
  --accent-blue: #4DABF7;
  --accent-green: #51CF66;
  --accent-purple: #BE4BDB;
  --shadow-3d-black: 0 6px 0 0 #000000;
  --shadow-3d-pink: 0 8px 0 0 #E03131;
}
```

### Component Classes
| Class | Description | Status |
|-------|-------------|--------|
| `.btn-3d` | Black 3D button | OK |
| `.btn-3d-pink` | Pink CTA 3D button | OK |
| `.btn-outline-3d` | Outlined 3D button | OK |
| `.card-playful` | White card with hover | OK |
| `.layout-container` | Max-width 1440px container | OK |

### Animations
| Animation | Description | Status |
|-----------|-------------|--------|
| `fadeInUp` | Fade in with translateY(30px) | OK |
| `bounceSlow` | 3s infinite bounce (-10px) | OK |
| `float` | 4s infinite float with rotation | OK |

---

## 8. Ignored Files (.vercelignore)

The following files are excluded from Vercel deployment:

```
/check_api.js
/docs/build_debug_report.md
/docs/work-plans/2026-02-03-yeonhui-studio-rebrand.md
/docs/work-plans/yeonhui-studio/.gitignore
/docs/work-plans/yeonhui-studio/App.tsx
/docs/work-plans/yeonhui-studio/components/CallToAction.tsx
/docs/work-plans/yeonhui-studio/components/DemoSection.tsx
/docs/work-plans/yeonhui-studio/components/Features.tsx
/docs/work-plans/yeonhui-studio/components/Footer.tsx
/docs/work-plans/yeonhui-studio/components/Header.tsx
```

**Total:** 19 files removed from deployment

---

## 9. Resolved Issues

| Issue | Solution | Status |
|-------|----------|--------|
| Components not rendering | Copied to `src/components/` | RESOLVED |
| Center alignment missing | Added `items-center`, `text-center` | RESOLVED |
| 3D shadow not working | Added custom Tailwind utilities | RESOLVED |
| Material Symbols not loading | Added Google Fonts import | RESOLVED |
| Build failing | Fixed component imports | RESOLVED |

---

## 10. Potential Issues to Monitor

| Issue | Cause | Recommended Fix |
|-------|-------|-----------------|
| Security vulnerability | next@15.1.5 | Upgrade to patched version |
| Edge runtime warning | Pages using edge runtime | Review runtime config |
| Image loading slow | External Google images | Use Next.js Image + CDN |
| Font flash (FOUT) | Google Fonts loading | Add font-display: swap |

---

## 11. Build Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Start Production
npm start

# Lint Check
npm run lint

# Check outdated packages
npm outdated

# Upgrade Next.js (RECOMMENDED)
npm install next@latest
```

---

## 12. File Structure

```
src/
├── app/
│   ├── globals.css      # Global styles + Tailwind
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page component
├── components/
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section with image
│   ├── Features.tsx     # Feature cards grid
│   ├── DemoSection.tsx  # Before/After demo
│   ├── CallToAction.tsx # CTA section
│   └── Footer.tsx       # Footer component
docs/
├── build_debug_report.md
└── work-plans/
    ├── 2026-02-03-yeonhui-studio-rebrand.md
    └── yeonhui-studio/   # Reference design files
```

---

## 13. Design System Quick Reference

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Vibrant Yellow | #FFD43B | Background |
| Premium Gold | #FFC107 | Primary/Accent |
| Accent Pink | #FF6B6B | CTA Buttons |
| Accent Blue | #4DABF7 | Feature Icons |
| Accent Green | #51CF66 | Success States |
| Accent Purple | #BE4BDB | Feature Icons |
| Deep Black | #0A0A0A | Text/Buttons |

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| rounded-2xl | 1.5rem | Small elements |
| rounded-3xl | 2.5rem | Buttons |
| rounded-[40px] | 40px | Cards |
| rounded-[50px] | 50px | Large sections |
| rounded-[60px] | 60px | Phone mockup |

---

## 14. Testing Checklist

- [x] `npm run build` completes without errors
- [x] Static pages generated (34/34)
- [ ] `npm run lint` passes
- [ ] Security vulnerability fixed (next upgrade)
- [ ] All components render correctly
- [ ] Mobile responsive design works
- [ ] 3D button hover/active states work
- [ ] Material Symbols icons display
- [ ] Before/After hover effect works
- [ ] Korean text displays properly

---

## 15. Debug Log

| Date | Issue | Resolution |
|------|-------|------------|
| 2026-02-04 | Initial component setup | Created all 6 main components |
| 2026-02-04 | Style system setup | Configured Tailwind with custom colors and shadows |
| 2026-02-04 | Korean localization | Updated Hero, Features, CTA with Korean text |
| 2026-02-04 | Vercel build success | 34 static pages generated in ~45s |
| 2026-02-04 | Security warning | Next.js CVE-2025-66478 identified, upgrade needed |

---

## 16. Priority Action Items

### HIGH Priority
1. **Upgrade Next.js** - Fix security vulnerability CVE-2025-66478
   ```bash
   npm install next@latest
   ```

### MEDIUM Priority
2. Review edge runtime usage and consider Node.js runtime
3. Implement Next.js Image component for optimization

### LOW Priority
4. Clean up deprecated node-domexception dependency
5. Add unit tests for components

---

*Report generated for Yeonhui Studio development team*
*Build ID: aa06167 | Region: iad1*
