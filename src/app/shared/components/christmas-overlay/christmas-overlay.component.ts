import {
  Component,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-christmas-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isBrowser"
      class="christmas-overlay pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden="true"
    >
      <div class="snowflakes">
        <div class="snowflake text-white">❄️</div>
        <div class="snowflake text-red-500">🎁</div>
        <div class="snowflake text-white">☃️</div>
        <div class="snowflake text-green-400">🎄</div>
        <div class="snowflake text-blue-200">☃️</div>
        <div class="snowflake text-amber-600">🦌</div>
        <div class="snowflake text-red-500">🎅🏻</div>
        <div class="snowflake text-amber-700">🛷</div>
      </div>
    </div>
  `,
  styles: [
    `
      .snowflake {
        font-size: 1.5em;
        font-family: Arial, sans-serif;
        filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.3));
        position: fixed;
        top: -10%;
        z-index: 100;
        user-select: none;
        cursor: default;
        animation-name: snowflakes-fall, snowflakes-shake;
        animation-duration: 16s, 6s;
        animation-timing-function: linear, ease-in-out;
        animation-iteration-count: infinite, infinite;
        animation-play-state: running, running;
      }
      .snowflake:nth-of-type(1) {
        left: 5%;
        animation-delay: 0s, 0s;
        font-size: 1.2em;
      }
      .snowflake:nth-of-type(2) {
        left: 20%;
        animation-delay: 2s, 1s;
        font-size: 1.4em;
      }
      .snowflake:nth-of-type(3) {
        left: 35%;
        animation-delay: 5s, 0.5s;
        font-size: 1.1em;
      }
      .snowflake:nth-of-type(4) {
        left: 50%;
        animation-delay: 1s, 2s;
        font-size: 1.3em;
      }
      .snowflake:nth-of-type(5) {
        left: 65%;
        animation-delay: 8s, 3s;
        font-size: 1.5em;
      }
      .snowflake:nth-of-type(6) {
        left: 80%;
        animation-delay: 3s, 1.5s;
        font-size: 1.2em;
      }
      .snowflake:nth-of-type(7) {
        left: 95%;
        animation-delay: 10s, 2s;
        font-size: 1.3em;
      }
      .snowflake:nth-of-type(8) {
        left: 15%;
        animation-delay: 13s, 0.5s;
        font-size: 1.4em;
      }

      @keyframes snowflakes-fall {
        0% {
          top: -10%;
          transform: rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          top: 100%;
          transform: rotate(360deg);
          opacity: 0;
        }
      }
      @keyframes snowflakes-shake {
        0%,
        100% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(50px);
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ChristmasOverlayComponent {
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
}
