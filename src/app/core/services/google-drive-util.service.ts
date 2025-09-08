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
      // Convert to direct download URL
      return `https://drive.usercontent.google.com/download?id=${fileId}`;
    }

    // Also handle the alternative Google Drive URL format
    const alternativeRegex = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
    const altMatch = cleanUrl.match(alternativeRegex);

    if (altMatch && altMatch[1]) {
      const fileId = altMatch[1];
      return `https://drive.usercontent.google.com/download?id=${fileId}`;
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
      // Direct download URL (best for images)
      direct: `https://drive.usercontent.google.com/download?id=${fileId}`,

      // Alternative direct URL format
      directAlt: `https://drive.google.com/uc?export=download&id=${fileId}`,

      // Thumbnail URL (for previews)
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}`,

      // View URL (opens in browser)
      view: `https://drive.google.com/file/d/${fileId}/view`,

      // Sharing URL (what users typically copy)
      share: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    };
  }
}
