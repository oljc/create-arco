interface Answers {
  projectName: string
  techStack: 'vue' | 'react'
  version: 'full' | 'basic' | 'community'
  manager: 'npm' | 'yarn' | 'pnpm'
  community?: Awesome
  confirm: boolean
  initGit: boolean
}

interface Awesome {
  name: string
  repo: string
  packageManager: 'npm' | 'yarn' | 'pnpm'
  start: string
  branch: string
}

type StateIcons = 'abort' | 'exit' | 'submit' | 'none'

type Options = {
  label: string
  value: unknown
  warn?: string
  description?: string
  disabled?: boolean
}

interface SelectOptions {
  message: string
  initial?: string | number | boolean | object
  options: Options[]
  pageSize?: number
  warn?: string
}

interface ConfirmOptions {
  message: string
  initial?: boolean
  yes?: string
  no?: string
}

interface InputOptions {
  message: string
  initial?: string
  format?: (s: string) => string
  validate?: (s: string) => boolean | string
  error?: string
}
