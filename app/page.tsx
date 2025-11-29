export default function Home() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="mb-4 font-serif text-5xl font-semibold text-charcoal sm:text-6xl">
            Aesthetic Notes AI
          </h1>
          <p className="text-lg text-charcoal/80">
            Transform your thoughts into beautifully organized aesthetic notes powered by AI
          </p>
        </header>

        <main className="space-y-8">
          <section className="rounded-[--radius-default] bg-cream p-8 shadow-[--shadow-default] transition-all duration-[--animate-duration-normal] hover:shadow-[--shadow-md]">
            <h2 className="mb-4 font-serif text-3xl text-charcoal">
              Welcome to Your Creative Space
            </h2>
            <p className="mb-6 leading-relaxed text-charcoal/90">
              Experience a new way to capture and organize your ideas with elegant design and intelligent features.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-[--radius-default] bg-sage-green px-6 py-3 font-medium text-cream transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-sm]">
                Get Started
              </button>
              <button className="rounded-[--radius-default] border-2 border-sage-green px-6 py-3 font-medium text-sage-green transition-all duration-[--animate-duration-fast] hover:bg-sage-green hover:text-cream">
                Learn More
              </button>
            </div>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[--radius-default] bg-soft-pink/30 p-6 transition-all duration-[--animate-duration-slow] hover:bg-soft-pink/40">
              <h3 className="mb-3 font-serif text-xl text-charcoal">
                Elegant Design
              </h3>
              <p className="text-charcoal/80">
                Beautiful, distraction-free interface that inspires creativity
              </p>
            </div>
            <div className="rounded-[--radius-default] bg-sage-green/20 p-6 transition-all duration-[--animate-duration-slow] hover:bg-sage-green/30">
              <h3 className="mb-3 font-serif text-xl text-charcoal">
                AI-Powered
              </h3>
              <p className="text-charcoal/80">
                Smart organization and suggestions to enhance your notes
              </p>
            </div>
          </div>

          <section className="rounded-[--radius-lg] bg-terracotta p-8 text-cream shadow-[--shadow-lg]">
            <h2 className="mb-4 font-serif text-3xl">
              Brand Colors Showcase
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              <div className="space-y-2 text-center">
                <div className="aspect-square rounded-[--radius-sm] bg-dust-grey shadow-[--shadow-sm]"></div>
                <p className="text-sm">Dust Grey</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-square rounded-[--radius-sm] bg-sage-green shadow-[--shadow-sm]"></div>
                <p className="text-sm">Sage Green</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-square rounded-[--radius-sm] bg-terracotta shadow-[--shadow-sm]"></div>
                <p className="text-sm">Terracotta</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-square rounded-[--radius-sm] bg-cream shadow-[--shadow-sm]"></div>
                <p className="text-sm text-charcoal">Cream</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="aspect-square rounded-[--radius-sm] bg-soft-pink shadow-[--shadow-sm]"></div>
                <p className="text-sm">Soft Pink</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-12 text-center text-sm text-charcoal/60">
          <p>Built with Next.js, TailwindCSS, and beautiful typography</p>
        </footer>
      </div>
    </div>
  );
}
