import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Zap, Award, Users, BarChart3, Lightbulb, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Career Compass</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition">
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Introducing Career Compass</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-balance">
            Discover Your Perfect
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Career Path
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance leading-relaxed">
            Intelligent career guidance powered by aptitude analysis, skills assessment, and personalized recommendations. Make informed decisions about your future.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition font-semibold"
            >
              Start Career Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-border hover:bg-muted transition font-semibold"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16 pt-16 border-t border-border/40">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">8+</div>
              <div className="text-sm text-muted-foreground">Career Paths</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">20</div>
              <div className="text-sm text-muted-foreground">Assessment Qs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Personalized</div>
            </div>
          </div>
        </div>

        {/* Hero Image/Visual */}
        <div className="mt-20 max-w-4xl mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 p-8 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: BarChart3, label: 'Skills Analysis', color: 'text-primary' },
                { icon: TrendingUp, label: 'Career Matching', color: 'text-secondary' },
                { icon: Award, label: 'Expert Guidance', color: 'text-accent' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-border/40 text-center hover:border-primary/40 transition">
                  <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                  <p className="font-medium text-sm text-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make informed career decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: 'Quick Assessment',
                description: 'Complete a comprehensive 20-question aptitude test in just 10 minutes',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: BarChart3,
                title: 'Smart Analysis',
                description: 'Analyze your academic performance across multiple subjects and streams',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: TrendingUp,
                title: 'Career Matching',
                description: 'Get your top 3 matched careers with compatibility scores and insights',
                color: 'from-orange-500 to-orange-600',
              },
              {
                icon: Award,
                title: 'Learning Paths',
                description: 'Discover curated courses and resources for your chosen career path',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Target,
                title: 'Trait Analysis',
                description: 'Understand 10 key personality traits and how they align with careers',
                color: 'from-pink-500 to-pink-600',
              },
              {
                icon: Lightbulb,
                title: 'Expert Insights',
                description: 'Access personalized recommendations from career specialists',
                color: 'from-yellow-500 to-yellow-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-border/40 hover:border-primary/40 bg-white/50 backdrop-blur-sm hover:shadow-lg transition"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple 4-step process to discover your ideal career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
            {[
              { num: '1', title: 'Sign Up', desc: 'Create your account and profile' },
              { num: '2', title: 'Take Quiz', desc: 'Complete the aptitude assessment' },
              { num: '3', title: 'Get Results', desc: 'Receive personalized recommendations' },
              { num: '4', title: 'Learn', desc: 'Access resources for your career path' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="p-6 rounded-xl border border-border bg-background/50 text-center h-full flex flex-col justify-center hover:border-primary/40 transition">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from students who found their perfect career path
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', role: 'Software Engineer', quote: 'Career Compass helped me understand my strengths and choose the right path!' },
              { name: 'Arjun Patel', role: 'Data Scientist', quote: 'The aptitude assessment was spot-on. It completely changed my perspective.' },
              { name: 'Neha Verma', role: 'Product Manager', quote: 'Best platform for career guidance. Highly recommend for all students!' },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-xl border border-border/40 bg-white/50 backdrop-blur-sm hover:shadow-lg transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-accent">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Find Your Path?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students discovering their perfect career with Career Compass
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition font-semibold"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-border/40">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary"></div>
                <span className="font-bold">Career Compass</span>
              </div>
              <p className="text-sm text-muted-foreground">Your guide to the perfect career path</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact'] },
              { title: 'Resources', links: ['Careers', 'Help Center', 'Community'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2024 Career Compass. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-foreground transition">Privacy</a>
              <a href="#" className="hover:text-foreground transition">Terms</a>
              <a href="#" className="hover:text-foreground transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
