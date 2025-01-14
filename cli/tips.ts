import { color } from './utils'

class Tips {
  private text: string
  private interval: NodeJS.Timeout | null = null
  private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  private frameIndex: number = 0

  constructor(text: string = '加载中...') {
    this.text = text
  }

  private stopWithStatus(symbol: string, message: string) {
    this.stop()
    process.stdout.write(`\r\x1b[K${symbol} ${message}\n`)
  }

  /**
   * 启动加载器
   */
  start(text?: string) {
    if (text) this.text = text
    if (this.interval) return this

    this.interval = setInterval(() => {
      const frame = this.frames[this.frameIndex]
      process.stdout.write(`\r${frame} ${this.text}`)
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
    this.stopWithStatus(color('✔', 2), message)
  }

  fail(message: string = '失败！') {
    this.stopWithStatus(color('✖', 1), message)
  }

  warn(message: string = '警告！') {
    this.stopWithStatus(color('!', 3), message)
  }
}

export const tipsManage = (text: string) => new Tips(text)
