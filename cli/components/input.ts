import { font } from '../color'
import { Prompt } from './prompt'
import { icons, icon, delimiter } from '../utils'

const { erase, cursor } = require('sisteransi')

class TextPrompt extends Prompt {
  constructor(opts = {} as any) {
    super()
    this.message = opts.message
    this.initial = opts.initial || ``
    this.format = opts.format || ((s) => s)
    this.validator = opts.validate || (() => true)
    this.value = ``
    this.errorMsg = opts.error || `请输入有效值`
    this.error = false
    this.cursor = 0
    this.render()
  }

  end() {
    this.value = this.value || this.initial
    this.render()
    this.out.write('\n')
    this.close()
  }

  exit() {
    this.status = 'exit'
    this.end()
  }

  abort() {
    this.status = 'abort'
    this.end()
  }

  async validate() {
    let valid = await this.validator(this.value)
    if (typeof valid === `string`) {
      this.errorMsg = valid
      valid = false
    }
    this.error = !valid
  }

  async submit() {
    this.value = this.value || this.initial
    await this.validate()

    if (this.error) {
      this.render()
    } else {
      this.status = 'submit'
      this.render()
      this.out.write('\n')
      this.close()
    }
  }

  moveCursor(n) {
    this.cursor = Math.max(0, Math.min(this.cursor + n, this.value.length))
    this.render()
  }

  _(char) {
    const before = this.value.slice(0, this.cursor)
    const after = this.value.slice(this.cursor)
    this.value = this.format(`${before}${char}${after}`)
    this.moveCursor(1)
  }

  delete() {
    if (this.cursor === 0) return this.bell()
    const before = this.value.slice(0, this.cursor - 1)
    const after = this.value.slice(this.cursor)
    this.value = this.format(`${before}${after}`)
    this.moveCursor(-1)
  }

  next() {
    if (!this.initial) return this.bell()
    this.value = this.initial
    this.cursor = this.value.length
    this.render()
  }

  first() {
    this.cursor = 0
    this.render()
  }

  last() {
    this.cursor = this.value.length
    this.render()
  }

  left() {
    if (this.cursor <= 0 || !this.value) return this.bell()
    this.moveCursor(-1)
  }

  right() {
    if (this.cursor >= this.value.length) return this.bell()
    this.moveCursor(1)
  }

  render() {
    const result = this.value ? this.value : font(` ${this.initial}`, 'gray')

    const outputError = this.error
      ? `\n${icons.pointerSmall} ${font(this.errorMsg, [`red`, 'italic'])}`
      : ''
    const outputText = `${icon(this.status)} ${font(this.message, 'bold')} ${delimiter(this.status == 'submit')} ${result}`
    const cursorPos = this.value ? this.cursor - this.value.length : -this.initial.length - 1

    this.out.write(
      erase.line +
        cursor.to(0) +
        outputText +
        cursor.save +
        outputError +
        cursor.restore +
        cursor.move(cursorPos, 0)
    )
  }
}

export default TextPrompt
