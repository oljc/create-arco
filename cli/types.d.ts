interface Result {
  projectName: string
  techStack: 'vue' | 'react'
  version: 'full' | 'basic' | 'community'
  manager?: 'npm' | 'yarn' | 'pnpm'
  community: Awesome
}

interface Awesome {
  name: string
  repo: string
  packageManager: 'npm' | 'yarn' | 'pnpm'
  start: string
}
