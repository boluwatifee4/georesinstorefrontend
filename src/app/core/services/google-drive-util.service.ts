import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveUtilService {

  /**
   * Extracts the file ID from a Google Drive sharing URL and converts it to a direct image URL
   * @param shareUrl - The Google Drive sharing URL
   * @returns The direct image URL or the original URL if not a Google Drive URL
   */
  convertGoogleDriveUrl(shareUrl: string): string {
    if (!shareUrl || typeof shareUrl !== 'string') {
      return shareUrl;
    }

    // Clean the URL by trimming whitespace
    const cleanUrl = shareUrl.trim();

    // Check if it's a Google Drive sharing URL
    const googleDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = cleanUrl.match(googleDriveRegex);

    if (match && match[1]) {
      const fileId = match[1];
      // Preferred inline host variant using googleusercontent domain
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Also handle the alternative Google Drive URL format
    const alternativeRegex = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
    const altMatch = cleanUrl.match(alternativeRegex);

    if (altMatch && altMatch[1]) {
      const fileId = altMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // If it's not a Google Drive URL, return the original URL
    return cleanUrl;
  }

  /**
   * Validates if a URL is a Google Drive sharing URL
   * @param url - The URL to validate
   * @returns True if it's a Google Drive sharing URL
   */
  isGoogleDriveUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const googleDriveRegex = /https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
    return googleDriveRegex.test(url.trim());
  }

  /**
   * Extracts just the file ID from a Google Drive URL
   * @param url - The Google Drive URL
   * @returns The file ID or null if not found
   */
  extractFileId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    const cleanUrl = url.trim();

    // Try the standard sharing URL format
    const standardMatch = cleanUrl.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (standardMatch && standardMatch[1]) {
      return standardMatch[1];
    }

    // Try the alternative format
    const altMatch = cleanUrl.match(/https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return null;
  }

  /**
   * Creates different Google Drive URL formats for different use cases
   * @param fileId - The Google Drive file ID
   * @returns Object with different URL formats
   */
  createGoogleDriveUrls(fileId: string) {
    return {
      // Primary (googleusercontent) inline host variant
      gusercontent: `https://lh3.googleusercontent.com/d/${fileId}`,

      // Secondary (older lh3.google.com) host variant
      lh3: `https://lh3.google.com/u/0/d/${fileId}`,

      // Legacy inline-safe view URL
      viewInline: `https://drive.google.com/uc?export=view&id=${fileId}`,

      // Direct download URL (sometimes blocked for hotlinking / 403)
      direct: `https://drive.usercontent.google.com/uc?id=${fileId}`,

      // Explicit download export variant
      download: `https://drive.google.com/uc?export=download&id=${fileId}`,

      // Thumbnail (can append &sz=w{width}-h{height})
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}`,

      // Original view page URL
      viewPage: `https://drive.google.com/file/d/${fileId}/view`,

      // Share URL
      share: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    };
  }

  /**
   * Returns a prioritized list of fallback URLs you can try sequentially (e.g. via (error) handler on <img>)
   */
  getFallbackImageUrls(input: string): string[] {
    const fileId = this.isGoogleDriveUrl(input) ? this.extractFileId(input) : input;
    if (!fileId) return [input];
    const urls = this.createGoogleDriveUrls(fileId as string);
    return [
      urls.gusercontent,
      urls.lh3,
      urls.viewInline,
      urls.direct,
      urls.download,
      `${urls.thumbnail}&sz=w1000`,
      urls.viewPage,
      urls.share
    ];
  }
}
