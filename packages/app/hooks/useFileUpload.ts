import { FilePickerResponse, SelectedFile } from '../types/FilePicker'

export const useFileUpload = (): FilePickerResponse => {
  const pick = (): Promise<SelectedFile | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '*/*'

      input.onchange = (e: any) => {
        const file = e.target.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        resolve({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          file: file, // Giữ nguyên object File để đưa vào FormData sau này
          size: file.size,
        })
      }

      input.click()
    })
  }

  return { pick }
}
