import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PublicCategoriesService } from '../../api/public/categories/categories.service';
import { PublicNotificationsService } from '../../api/public/notifications/notifications.service';
import { Category } from '../../types/api.types';
import { toast } from 'ngx-sonner';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit, AfterViewInit, OnDestroy {

  // Countdown properties
  timeLeft: any = {};
  targetDate: Date;
  private countdownInterval: any;

  // Waitlist form
  email: string = '';
  phone: string = '';
  contactMethod: 'email' | 'phone' = 'email';
  isSubmitted: boolean = false;

  // Animation timeline
  private tl: gsap.core.Timeline | null = null;

  // Categories (coming soon)
  categories: Category[] = [];
  loadingCategories = false;
  categoriesError: string | null = null;

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private categoriesApi: PublicCategoriesService,
    private notificationsApi: PublicNotificationsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Set target date to next Monday
    this.targetDate = this.getNextMonday();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startCountdown();
      this.fetchCategories();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initSophisticatedAnimations(), 100);
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.tl) {
      this.tl.kill();
    }
    // Kill all ScrollTriggers to avoid leaks when navigating
    if (isPlatformBrowser(this.platformId)) {
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.killTweensOf('.parallax-layer');
    }
  }

  private getNextMonday(): Date {
    // Set to September 22nd, 2025 at noon
    const launchDate = new Date(2025, 8, 22, 12, 0, 0, 0); // Month is 0-indexed, so 8 = September
    return launchDate;
  }

  private startCountdown() {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown() {
    const now = new Date().getTime();
    const distance = this.targetDate.getTime() - now;

    if (distance > 0) {
      this.timeLeft = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    } else {
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      clearInterval(this.countdownInterval);
    }
  }

  private initSophisticatedAnimations() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Minimal animations for accessibility
      document.querySelector('.intro-overlay')?.remove();
      return;
    }
    // Create master timeline with cinematic intro
    this.tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Intro overlay cinematic logo reveal
    const hasIntro = document.querySelector('.intro-overlay');
    if (hasIntro) {
      gsap.set('.intro-logo', { scale: 0.6, opacity: 0 });
      this.tl
        .to('.intro-logo', { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.6)' })
        .to('.intro-logo', { scale: 1.2, duration: 0.5, yoyo: true, repeat: 1 }, '+=0.2')
        .to('.intro-logo', { opacity: 0, duration: 0.5 }, '-=0.1')
        .to('.intro-overlay', { autoAlpha: 0, duration: 0.8 }, '-=0.1');
    }

    // Hero entrance sequence (line-based to preserve gradient text)
    this.tl
      .from('.hero-title .line', {
        duration: 1,
        y: 80,
        opacity: 0,
        stagger: 0.2,
        ease: 'power4.out'
      }, hasIntro ? '+=0' : '+=0')
      .from('.hero-subtitle', {
        duration: 0.9,
        y: 40,
        opacity: 0,
        ease: 'power3.out'
      }, '-=0.6')
      .from('.hero-description', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
      }, '-=0.5')
      .from('.countdown-container', {
        duration: 0.8,
        scale: 0.92,
        opacity: 0,
        ease: 'back.out(1.6)'
      }, '-=0.4')
      .from('.waitlist-form', {
        duration: 0.7,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
      }, '-=0.3');

    // Continuous floating animation for background elements
    gsap.to('.floating-bg-1', {
      duration: 6,
      y: -20,
      rotation: 5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });

    gsap.to('.floating-bg-2', {
      duration: 8,
      y: -30,
      rotation: -3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 2
    });

    // Countdown number pulse effect
    gsap.to('.countdown-number', {
      duration: 1,
      scale: 1.05,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true,
      stagger: 0.2
    });

    // Clean up old feature section trigger if present (template may not have it anymore)
    ScrollTrigger.getAll().forEach(t => {
      const trigger = (t as any).vars?.trigger as Element | undefined;
      if (trigger && (trigger as HTMLElement).classList.contains('features-section')) t.kill();
    });

    // Social icons hover animations
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
      icon.addEventListener('mouseenter', () => {
        gsap.to(icon, {
          duration: 0.3,
          scale: 1.2,
          rotation: 10,
          ease: 'power2.out'
        });
      });

      icon.addEventListener('mouseleave', () => {
        gsap.to(icon, {
          duration: 0.3,
          scale: 1,
          rotation: 0,
          ease: 'power2.out'
        });
      });
    });

    // Button hover effects
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          duration: 0.3,
          scale: 1.05,
          y: -2,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          ease: 'power2.out'
        });
      });

      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          duration: 0.3,
          scale: 1,
          y: 0,
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          ease: 'power2.out'
        });
      });
    });

    // Input focus animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        gsap.to(input, {
          duration: 0.3,
          scale: 1.02,
          y: -3,
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
          ease: 'power2.out'
        });
      });

      input.addEventListener('blur', () => {
        gsap.to(input, {
          duration: 0.3,
          scale: 1,
          y: 0,
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          ease: 'power2.out'
        });
      });
    });

    // Create floating particles (subtle)
    this.createFloatingParticles();

    // Manifesto pinned section with subtle parallax
    const manifesto = document.querySelector('.manifesto-section');
    if (manifesto) {
      gsap.from('.manifesto-line', {
        opacity: 0,
        y: 40,
        stagger: 0.3,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: manifesto as Element,
          start: 'top center',
          end: '+=300',
          scrub: true
        }
      });

      gsap.to('.manifesto-bg', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: manifesto as Element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // Hero parallax - slight depth on scroll
    const hero = document.querySelector('.hero-section');
    if (hero) {
      gsap.to('.hero-title', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: hero as Element,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      gsap.to(['.floating-bg-1', '.floating-bg-2'], {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: hero as Element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

      // Parallax decorative layers
      this.setupParallaxLayers(hero as HTMLElement);
    }

    // Categories grid fade-in on scroll
    const catSection = document.querySelector('.categories-section');
    if (catSection) {
      gsap.from('.category-card', {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: catSection as Element,
          start: 'top 80%',
          end: '+=200',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }


  private createFloatingParticles() {
    const container = document.querySelector('.hero-section');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
      `;

      container.appendChild(particle);

      // Random starting position
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: Math.random() * 0.7 + 0.3
      });

      // Floating animation
      gsap.to(particle, {
        duration: Math.random() * 10 + 10,
        y: -window.innerHeight - 100,
        ease: 'none',
        repeat: -1,
        delay: Math.random() * 5
      });

      gsap.to(particle, {
        duration: Math.random() * 3 + 2,
        x: `+=${Math.random() * 100 - 50}`,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    }
  }

  // Set up scroll and mouse parallax for decorative layers
  private setupParallaxLayers(root: HTMLElement) {
    if (!isPlatformBrowser(this.platformId)) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('.parallax-layer'));
    if (!layers.length) return;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Scroll-based parallax using ScrollTrigger (pixel-based for clearer motion)
    layers.forEach((layer) => {
      const speedAttr = layer.getAttribute('data-speed');
      const speed = speedAttr ? parseFloat(speedAttr) : 0.2;
      gsap.to(layer, {
        y: () => -window.innerHeight * 0.35 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // Subtle mouse-based parallax
    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      layers.forEach((layer) => {
        const speedAttr = layer.getAttribute('data-speed');
        const speed = speedAttr ? parseFloat(speedAttr) : 0.2;
        gsap.to(layer, {
          x: dx * 60 * speed,
          // Avoid touching 'y' here to prevent conflict with scroll parallax
          duration: 0.25,
          ease: 'power2.out'
        });
      });
    };

    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', () => {
      gsap.to(layers, { x: 0, duration: 0.4, ease: 'power2.out' });
    });
  }

  private fetchCategories() {
    this.loadingCategories = true;
    this.categoriesError = null;
    this.categoriesApi.getCategories().subscribe({
      next: (list) => {
        // Keep top 8 to keep it tight and performant on mobile
        this.categories = (list || []).filter(c => !!c?.name).slice(0, 8);
        this.loadingCategories = false;
        // After DOM updates, refresh triggers for grid animation
        setTimeout(() => {
          if (isPlatformBrowser(this.platformId)) {
            ScrollTrigger.refresh();
          }
        }, 0);
      },
      error: (err) => {
        this.categoriesError = (err?.message || 'Failed to load categories');
        this.loadingCategories = false;
      }
    });
  }

  // Removed horizontal scroller; using responsive grid

  onSubmitWaitlist() {
    const isValid = this.contactMethod === 'email'
      ? this.email && this.isValidEmail(this.email)
      : this.phone && this.phone.length >= 10;

    if (isValid) {
      this.isSubmitted = true;

      // Enhanced success animation sequence
      const form = document.querySelector('.waitlist-form');
      if (form) {
        const btn = form.querySelector('button');
        if (btn) {
          gsap.timeline()
            .to(btn, {
              width: 'auto',
              padding: '1rem',
              duration: 0.3,
              ease: 'power2.inOut'
            })
            .to(form, {
              scale: 1.02,
              duration: 0.4,
              ease: 'elastic.out(1, 0.3)',
              boxShadow: '0 0 30px rgba(130,63,216,0.3)'
            })
            .to(form, {
              scale: 1,
              duration: 0.3,
              boxShadow: '0 0 0 rgba(0,0,0,0)',
              delay: 0.2
            });
        }
      }

      // Compose admin-facing Telegram message payload
      const now = new Date();
      const contact = this.contactMethod === 'email' ? this.email : this.phone;
      const contactLabel = this.contactMethod === 'email' ? 'Email' : 'Phone';
      const message = [
        '📝 New Waitlist Signup',
        '',
        `• ${contactLabel}: ${contact}`,
        `• Method: ${this.contactMethod}`,
        `• Timestamp: ${now.toLocaleString()}`,
        '',
        'Action: Add to launch VIP list and send early access when live.'
      ].join('\n');

      this.notificationsApi.sendTelegram(message).subscribe({
        next: () => {
          console.log('Waitlist telegram notification sent');
          const successText = this.contactMethod === 'email'
            ? `You're on the VIP list! We'll email early access to ${this.email}.`
            : `You're on the VIP list! We'll text early access to ${this.phone}.`;
          toast.success(successText, { duration: 4000 });
        },
        error: (err) => {
          console.error('Failed to send waitlist telegram:', err);
          toast.error('We could not confirm your VIP signup. Please try again.');
        }
      });

      // Reset after delay
      setTimeout(() => {
        this.email = '';
        this.phone = '';
        this.isSubmitted = false;
      }, 3000);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  navigateToStore() {
    // Store navigation removed - launch page only
    console.log('Store access coming soon...');
  }
}
