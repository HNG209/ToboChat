export type UploadToPresignedUrlParams = {
  presignedUrl: string
  file: Blob
  contentType?: string
}

export async function uploadToPresignedUrl({
  presignedUrl,
  file,
  contentType,
}: UploadToPresignedUrlParams): Promise<void> {
  const attempt = async (withContentType: boolean): Promise<Response> => {
    return await fetch(presignedUrl, {
      method: 'PUT',
      headers: withContentType && contentType ? { 'Content-Type': contentType } : undefined,
      body: file,
      // Ensure we don't send cookies/credentials to S3
      credentials: 'omit',
    })
  }

  let res: Response
  try {
    res = await attempt(true)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Upload to S3 failed before receiving a response (network/CORS). Details: ${msg}`
    )
  }

  // Some backends generate presigned URLs that don't include Content-Type in the signature.
  // In that case, sending Content-Type can cause a 403 SignatureDoesNotMatch.
  if (!res.ok && contentType && (res.status === 400 || res.status === 403)) {
    try {
      const retryRes = await attempt(false)
      if (retryRes.ok) return
      res = retryRes
    } catch {
      // ignore; original error reporting below
    }
  }

  if (!res.ok) {
    let details = ''
    try {
      const text = await res.text()
      if (text) details = ` Response: ${text.slice(0, 300)}`
    } catch {
      // ignore (often blocked by CORS)
    }
    throw new Error(`Upload to S3 failed (status ${res.status}).${details}`)
  }
}
