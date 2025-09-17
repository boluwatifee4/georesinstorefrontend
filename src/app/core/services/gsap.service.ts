import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

@Injectable({
  providedIn: 'root'
})
export class GsapService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Register GSAP plugins
      gsap.registerPlugin(ScrollTrigger, TextPlugin);
    }
  }

  /**
   * Create a fade in animation from bottom
   */
  fadeInUp(element: string | Element, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: "power3.out",
      ...options
    };

    return gsap.from(element, defaults);
  }

  /**
   * Create a staggered fade in animation
   */
  staggerFadeIn(elements: string | NodeList, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      duration: 0.8,
      y: 30,
      opacity: 0,
      stagger: 0.2,
      ease: "power3.out",
      ...options
    };

    return gsap.from(elements, defaults);
  }

  /**
   * Create a scale animation
   */
  scaleIn(element: string | Element, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      duration: 0.6,
      scale: 0,
      ease: "back.out(1.7)",
      ...options
    };

    return gsap.from(element, defaults);
  }

  /**
   * Create a typing text effect
   */
  typeText(element: string | Element, text: string, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      duration: 2,
      ease: "power2.inOut",
      ...options
    };

    return gsap.to(element, {
      ...defaults,
      text: text
    });
  }

  /**
   * Create a floating animation
   */
  float(element: string | Element, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      y: -20,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      ...options
    };

    return gsap.to(element, defaults);
  }

  /**
   * Create a timeline for complex animations
   */
  createTimeline(options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return null;

    return gsap.timeline(options);
  }

  /**
   * Create scroll-triggered animation
   */
  scrollTriggerAnimation(element: string | Element, animation: any, triggerOptions: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      trigger: element,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
      ...triggerOptions
    };

    return gsap.fromTo(element, animation.from, {
      ...animation.to,
      scrollTrigger: defaults
    });
  }

  /**
   * Animate counter numbers
   */
  animateCounter(element: string | Element, endValue: number, options: any = {}) {
    if (!isPlatformBrowser(this.platformId)) return;

    const defaults = {
      duration: 2,
      ease: "power2.out",
      ...options
    };

    const obj = { value: 0 };

    return gsap.to(obj, {
      ...defaults,
      value: endValue,
      onUpdate: () => {
        if (typeof element === 'string') {
          const el = document.querySelector(element);
          if (el) el.textContent = Math.floor(obj.value).toString();
        } else {
          element.textContent = Math.floor(obj.value).toString();
        }
      }
    });
  }

  /**
   * Create a hover animation
   */
  hoverAnimation(element: string | Element, hoverState: any, normalState: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    const hoverTween = gsap.to(el, {
      ...hoverState,
      duration: 0.3,
      ease: "power2.out",
      paused: true
    });

    el.addEventListener('mouseenter', () => hoverTween.play());
    el.addEventListener('mouseleave', () => hoverTween.reverse());

    return hoverTween;
  }

  /**
   * Kill all animations and scroll triggers
   */
  killAll() {
    if (!isPlatformBrowser(this.platformId)) return;

    gsap.killTweensOf("*");
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  /**
   * Refresh ScrollTrigger (useful after DOM changes)
   */
  refreshScrollTrigger() {
    if (!isPlatformBrowser(this.platformId)) return;

    ScrollTrigger.refresh();
  }

  /**
   * Create a particle animation effect
   */
  createParticles(container: string | Element, count: number = 50) {
    if (!isPlatformBrowser(this.platformId)) return;

    const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!containerEl) return;

    const particles: HTMLElement[] = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
      `;

      containerEl.appendChild(particle);
      particles.push(particle);

      // Animate particle
      gsap.set(particle, {
        x: Math.random() * (containerEl as HTMLElement).offsetWidth,
        y: Math.random() * (containerEl as HTMLElement).offsetHeight,
        scale: Math.random() * 0.5 + 0.5
      });

      gsap.to(particle, {
        x: Math.random() * (containerEl as HTMLElement).offsetWidth,
        y: Math.random() * (containerEl as HTMLElement).offsetHeight,
        duration: Math.random() * 10 + 5,
        ease: "none",
        repeat: -1,
        yoyo: true
      });

      gsap.to(particle, {
        opacity: Math.random() * 0.5 + 0.3,
        duration: Math.random() * 3 + 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    }

    return particles;
  }
}
