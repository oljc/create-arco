import { font } from './color'

export class Tips {
  private text: string
  private interval: NodeJS.Timeout | null = null
  private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  private frameIndex: number = 0

  constructor(text: string = '加载中...') {
    this.text = text
    process.stdout.write('\x1b[?25l')
  }

  private stopWithStatus(symbol: string, message: string) {
    this.stop()
    process.stdout.write(`\r\x1b[K${symbol} ${message}\x1b[?25h\n`)
  }

  /**
   * 启动加载器
   */
  start(text?: string) {
    if (text) this.text = text
    this.stop()
    this.interval = setInterval(() => {
      const frame = this.frames[this.frameIndex]
      process.stdout.write(`\r\x1B[K${frame} ${this.text}`)
      this.frameIndex = (this.frameIndex + 1) % this.frames.length
    }, 100)

    return this
  }
  /**
   * 暂停加载器
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * 更新文本
   */
  update(newText: string) {
    this.text = newText
    return this
  }

  succeed(message: string = '成功！') {
    this.stopWithStatus(font('✔', 'green'), message)
  }

  fail(message: string = '失败！') {
    this.stopWithStatus(font('✖', 'red'), message)
  }

  warn(message: string = '警告！') {
    this.stopWithStatus(font('!', 'yellow'), message)
  }
}

export const tipsManage = (text?: string) => new Tips(text)
