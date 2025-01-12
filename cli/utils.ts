export const isValidName = (name: string): boolean => {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
}

// 8位表示法 - 不用3/4位表示法是因为不打算兼容很老的终端
export const color = (i, t) => `\x1b[38;5;${i}m${t}\x1b[0m`
export const bgColor = (i, t) => `\x1b[48;5;${i}m${t}\x1b[0m`
