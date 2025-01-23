export type StyleType = keyof Styler | number

class Styler {
  private text: string
  private styles: string[]

  constructor(text: string, fn?: StyleType | StyleType[]) {
    this.text = text
    this.styles = []
    // 执行内置方法
    const run = (fn) => {
      if (typeof fn === 'number') this.color(fn)
      else if (typeof this[fn] === 'function') (this[fn] as Function).call(this)
    }
    if (Array.isArray(fn)) {
      for (const style of fn) {
        run(style)
      }
    } else {
      run(fn)
    }
  }

  // 自定义颜色
  color(colorCode: number = 255): this {
    this.styles.push(`\x1b[38;5;${colorCode}m`)
    return this
  }

  // 背景颜色
  background(colorCode: number = 255): this {
    this.styles.push(`\x1b[48;5;${colorCode}m`)
    return this
  }

  // 加粗
  bold(): this {
    this.styles.push('\x1b[1m')
    return this
  }

  // 下划线
  underline(): this {
    this.styles.push('\x1b[4m')
    return this
  }

  // 删除线
  strikethrough(): this {
    this.styles.push('\x1b[9m')
    return this
  }

  italic(): this {
    this.styles.push('\x1b[3m')
    return this
  }

  red(): this {
    return this.color(196)
  }

  green(): this {
    return this.color(46)
  }

  blue(): this {
    return this.color(27)
  }

  yellow(): this {
    return this.color(226)
  }

  cyan(): this {
    return this.color(50)
  }

  gray(): this {
    return this.color(240)
  }

  toString(): string {
    return `${this.styles.join('')}${this.text}\x1b[0m`
  }
}

export const font = (text: string, fn?: StyleType | StyleType[]) => {
  if (!fn) return text
  return new Styler(text, fn).toString()
}
