export interface SelectedFile {
  uri: string
  name: string
  type: string
  file?: File // Chỉ có trên Web
  size?: number
}

export interface FilePickerResponse {
  pick: () => Promise<SelectedFile | null>
}
