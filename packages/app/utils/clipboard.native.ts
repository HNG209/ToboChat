import * as Clipboard from 'expo-clipboard'

export async function copyToClipboard(text: string): Promise<void> {
  if (!text) return
  await Clipboard.setStringAsync(text)
}
