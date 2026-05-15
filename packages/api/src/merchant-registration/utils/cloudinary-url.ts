/**
 * Ensures document URLs point at Cloudinary under the configured cloud name.
 */
export function assertCloudinaryDocumentUrl(
  url: string,
  cloudName: string,
): void {
  if (!cloudName) {
    if (!/^https:\/\//i.test(url)) {
      throw new Error('Document URL must be HTTPS');
    }
    return;
  }
  const safeCloud = cloudName.replace(/[^a-z0-9-]/gi, '');
  const ok =
    url.includes(`res.cloudinary.com/${safeCloud}/`) ||
    url.includes(`cloudinary.com/${safeCloud}/`);
  if (!ok) {
    throw new Error(
      `Document URL must be hosted on Cloudinary cloud "${safeCloud}"`,
    );
  }
}
