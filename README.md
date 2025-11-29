# Aesthetic Notes AI

Transform your thoughts into beautifully organized aesthetic notes powered by AI.

This is a [Next.js](https://nextjs.org) project built with TailwindCSS v4 and beautiful typography using Playfair Display and Inter fonts.

## Features

- **Beautiful UI Components**: Modular InputCard and OutputCard components with high-end aesthetics
- **Blurred Header**: Sticky header with backdrop blur effect featuring logo and title
- **Input Section**: Large rounded textarea with Almond Silk background and format selector dropdown
- **Generate Button**: Primary Dusty Mauve button with micro-bounce hover states
- **Output Display**: Elegant card for displaying generated notes with copy, download, and share options
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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
