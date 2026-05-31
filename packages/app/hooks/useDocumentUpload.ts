import { FilePickerResponse, SelectedFile } from '../types/FilePicker'

export const useDocumentUpload = (): FilePickerResponse => {
  const pick = (): Promise<SelectedFile | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/pdf' // Chỉ nhận PDF

      input.onchange = (e: any) => {
        const file = e.target.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        resolve({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: file.type || 'application/pdf',
          file: file, // Cực kỳ quan trọng để Web upload lên S3
          size: file.size,
        })
      }

      input.click()
    })
  }

  return { pick }
}