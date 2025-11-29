# EasyNotesAI

Transform your thoughts into organized notes with ease — powered by AI.

This is a [Next.js](https://nextjs.org) project built with TailwindCSS v4 and beautiful typography using Playfair Display and Inter fonts.

## Features

- **AI-Powered Generation**: Transform your thoughts using Groq's Llama3-70B model
- **Beautiful UI Components**: Modular InputCard and OutputCard components with elegant design
- **Blurred Header**: Sticky header with backdrop blur effect featuring logo and title
- **Input Section**: Large rounded textarea with Almond Silk background and format selector dropdown
- **Generate Button**: Primary Dusty Mauve button with micro-bounce hover states and loading spinner
- **Output Display**: Elegant card for displaying generated notes with rich text formatting
- **Loading States**: Beautiful breathing animation with placeholder skeleton during generation
- **Error Handling**: User-friendly error messages with elegant styling
- **Rich Text Rendering**: Automatic formatting for bullet points, numbered lists, checklists, and more
- **Copy, Download & Share**: Export your notes in multiple ways
- **Animations**: Smooth fade-in animations and hover effects throughout
- **Responsive Design**: Mobile-friendly layout with Tailwind breakpoints

## Design System

### Colors
- **Dust Grey**: #f5f3f0 (background)
- **Sage Green**: #a8b5a0 (accents)
- **Terracotta**: #d97d62 (highlights)
- **Cream**: #faf8f5 (cards)
- **Charcoal**: #3e3e3e (text)
- **Soft Pink**: #e8c5c1 (accents)
- **Almond Silk**: #f7f1e8 (input backgrounds)
- **Dusty Mauve**: #b89faa (primary buttons)

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

## Components

### InputCard
Located at `/components/InputCard.tsx`
- Large textarea for user input
- Format selector dropdown (Bullet Points, Paragraph, Checklist, Summary, Outline)
- Generate button with loading state
- Proper TypeScript types and accessibility

### OutputCard
Located at `/components/OutputCard.tsx`
- Empty state when no output is available
- Formatted output display with Almond Silk background
- Action buttons: Copy to Clipboard, Download, Share
- Format badge display
- Smooth animations

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, set up your environment variables. Create a `.env.local` file in the root directory:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

To get a Groq API key:
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Mobile & Responsive Design

This application has been optimized for mobile devices with the following enhancements:

### Mobile Features
- **Responsive Textarea**: Intelligent resizing based on screen size (140px on mobile, 240px on desktop)
- **Sticky Generate Button**: On mobile devices, the Generate button sticks to the bottom of the screen for easy access
- **Touch-Optimized Targets**: All buttons meet accessibility standards with minimum 48px touch targets
- **Stacked Layout**: Components automatically stack vertically on small screens
- **Adaptive Spacing**: Padding and margins adjust based on screen size for optimal use of space
- **Smooth Animations**: Fade-in animations work consistently across all devices

### Touch Accessibility
All interactive elements follow WCAG 2.1 guidelines:
- Minimum touch target size: 48px × 48px
- Added `touch-manipulation` CSS to prevent tap delays
- Appropriate spacing between touch targets (12px minimum)

### Groq API Credit
The footer now displays "Powered by Groq AI with Llama3-70B" to properly credit the AI service provider.

## Known Caveats & Limitations

### Mobile-Specific Behaviors
1. **Sticky Button Gradient**: The Generate button on mobile has a gradient background to fade smoothly into the page. This gradient may be visible on very short screens (< 400px height).

2. **Textarea Resizing**: While the textarea is resizable on desktop (via `resize-y`), iOS Safari may limit this functionality. The min-height ensures usability regardless.

3. **Bottom Padding**: Mobile layout adds 96px bottom padding (`pb-24`) to accommodate the sticky button. This extra space is only visible on mobile viewports.

4. **PDF Generation on Mobile**: The html2pdf.js library works on mobile browsers, but:
   - Large notes may cause memory issues on older devices
   - Some mobile browsers may block automatic downloads
   - Users may need to allow popups/downloads in browser settings

5. **Viewport Height**: The sticky button positioning works best on standard mobile devices. Folding phones or unusual aspect ratios may require manual testing.

### Browser Compatibility
- **Chrome/Edge**: Full support for all features
- **Safari/iOS Safari**: Tested and working, but backdrop-blur may have slight visual differences
- **Firefox**: Full support
- **Samsung Internet**: Touch targets work correctly, animations may vary slightly

### Performance Considerations
- **Animations**: Fade-in animations use `transform` and `opacity` for GPU acceleration
- **Large Notes**: PDF generation of very long notes (>10,000 words) may be slow on mobile devices
- **Network**: Groq API calls require active internet connection; no offline mode available

### Accessibility Notes
- All interactive elements have appropriate labels and ARIA attributes
- Color contrast meets WCAG AA standards
- Focus indicators are visible on all interactive elements
- Touch targets exceed minimum size requirements

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
