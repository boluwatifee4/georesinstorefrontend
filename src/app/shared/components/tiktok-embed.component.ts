import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnDestroy, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Reusable TikTok embed component (SSR-safe)
 * Usage:
 * <app-tiktok-embed [url]="'https://www.tiktok.com/@geo_crafts08/video/7554325402085346567'" [maxWidth]="520"></app-tiktok-embed>
 */
@Component({
  selector: 'app-tiktok-embed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Background mode: render iframe directly, no embed.js -->
    <ng-container *ngIf="mode === 'background'; else standardEmbed">
      <div class="w-full h-full relative">
        <iframe
          *ngIf="currentSanitizedUrl"
          [src]="currentSanitizedUrl"
          frameborder="0"
          allowfullscreen
          title="TikTok background"
          [attr.loading]="autoplay ? 'eager' : 'lazy'"
          allow="encrypted-media; autoplay; picture-in-picture; playsinline"
          referrerpolicy="no-referrer-when-downgrade"
          style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:100;"
        ></iframe>
      </div>
    </ng-container>

    <!-- Standard embed: blockquote + embed.js processing (supports multiple) -->
    <ng-template #standardEmbed>
      <div *ngIf="isBrowser" class="w-full flex flex-col items-center gap-6">
        <ng-container *ngFor="let vId of videoIds; let i = index">
          <blockquote
            class="tiktok-embed"
            [attr.cite]="getCite(i)"
            [attr.data-video-id]="vId"
            [attr.style]="'max-width: ' + maxWidth + 'px; min-width: ' + minWidth + 'px;'"
          >
            <section>
              <a [href]="profileUrls[i]" target="_blank" [title]="handles[i]">{{ handles[i] }}</a>
            </section>
          </blockquote>
        </ng-container>
      </div>
    </ng-template>
  `,
})
export class TikTokEmbedComponent implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * Accepts a single TikTok video URL or an array of URLs.
   * If multiple, will render all videos in order (background mode: stacked, standard: vertical list)
   */
  @Input() url!: string | string[];
  @Input() maxWidth = 605;
  @Input() minWidth = 325;
  /** 'standard' uses blockquote + embed.js; 'background' renders iframe for background use */
  @Input() mode: 'standard' | 'background' = 'standard';
  @Input() autoplay = false;
  /** Rotate between multiple URLs in background mode (ms). Set 0 to disable. */
  @Input() rotateInterval = 8000;
  /** Starting index when rotating multiple background videos */
  @Input() startIndex = 0;

  isBrowser = false;
  sanitizedUrls: (SafeResourceUrl | null)[] = [];
  videoIds: string[] = [];
  handles: string[] = [];
  profileUrls: string[] = [];
  private embedUrls: string[] = [];
  private rotateTimer: any;
  currentIndex = 0;
  currentSanitizedUrl: SafeResourceUrl | null = null;

  constructor(private host: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) private platformId: Object, private sanitizer: DomSanitizer) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url']) {
      this.parseUrls();
      this.setupRotation();
    }
    if (changes['rotateInterval'] && Array.isArray(this.url)) {
      this.setupRotation();
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    if (this.mode === 'standard') {
      // Defer to next tick to ensure blockquote exists in DOM
      setTimeout(() => this.injectTikTokScript(), 0);
    }
  }

  private injectTikTokScript() {
    const existing = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (existing) {
      // Re-insert a script node to trigger processing of new blockquotes
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      this.host.nativeElement.appendChild(s);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }

  /**
   * Parses one or more TikTok URLs and populates arrays for ids, handles, profileUrls, and sanitizedUrls.
   */
  private parseUrls() {
    const urls = Array.isArray(this.url) ? this.url : [this.url];
    this.videoIds = [];
    this.handles = [];
    this.profileUrls = [];
    this.sanitizedUrls = [];
    this.embedUrls = [];
    for (const url of urls) {
      let videoId = '';
      let handle = '';
      let profileUrl = '';
      try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const handlePart = parts.find(p => p.startsWith('@')) || '';
        const vidIndex = parts.findIndex(p => p === 'video');
        const vid = vidIndex >= 0 ? parts[vidIndex + 1] : '';
        handle = handlePart || '';
        videoId = vid || '';
        profileUrl = `${u.origin}/${handle}`;
      } catch {
        const match = url?.match(/video\/(\d+)/);
        videoId = match?.[1] || '';
        const handleMatch = url?.match(/(\/@[^/]+)/);
        handle = handleMatch?.[1] || '';
        profileUrl = `https://www.tiktok.com/${handle}`;
      }
      this.videoIds.push(videoId);
      this.handles.push(handle);
      this.profileUrls.push(profileUrl);
      if (videoId) {
        // Official TikTok player path for direct iframe usage (avoids 'profile not available' error)
        let embedUrl = `https://www.tiktok.com/player/v1/${videoId}`;
        if (this.mode === 'background' && this.autoplay) {
          // Autoplay parameters for seamless background playback
          embedUrl += '?autoplay=1&muted=1&loop=1&playsinline=1';
        }
        this.embedUrls.push(embedUrl);
        this.sanitizedUrls.push(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
      } else {
        this.embedUrls.push('');
        this.sanitizedUrls.push(null);
      }
    }
    // Initialize current index and url for background mode
    this.currentIndex = Math.min(Math.max(this.startIndex || 0, 0), Math.max(this.embedUrls.length - 1, 0));
    this.updateCurrentSanitized();
  }

  private setupRotation() {
    if (!this.isBrowser) return;
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
    const count = this.embedUrls.length;
    if (this.mode === 'background' && count > 1 && this.rotateInterval > 0) {
      this.rotateTimer = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % count;
        this.updateCurrentSanitized();
      }, this.rotateInterval);
    }
  }

  private updateCurrentSanitized() {
    if (this.mode !== 'background') return;
    // Destroy current iframe first so a brand new one is created (ensures autoplay retriggers)
    this.currentSanitizedUrl = null;
    setTimeout(() => {
      const raw = this.embedUrls[this.currentIndex] || '';
      if (!raw) return;
      this.currentSanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(raw);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  /**
   * Helper to get the cite URL for template (handles single or multiple url inputs)
   */
  getCite(i: number): string {
    if (Array.isArray(this.url)) {
      return (this.url as string[])[i] || '';
    }
    return (this.url as string) || '';
  }

}
