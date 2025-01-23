import { font } from '../color'
import { Prompt } from './prompt'
import { delimiter, icon } from '../utils'

const { erase, cursor } = require('sisteransi')

class ConfirmPrompt extends Prompt {
  constructor(opts = {} as any) {
    super()
    this.msg = opts.message
    this.value = opts.initial
    this.yes = opts.yes || 'Yes'
    this.no = opts.no || 'No'
    this.out.write(cursor.hide)
    this.render()
  }

  exit() {
    this.status = 'exit'
    this.end()
  }

  abort() {
    this.status = 'abort'
    this.end()
  }

  end() {
    this.render()
    this.out.write('\n')
    this.close()
  }

  toggleValue(value: boolean) {
    this.value = value
    this.render()
  }

  // 快捷键操作
  right() {
    this.toggleValue(false)
  }
  left() {
    this.toggleValue(true)
  }
  up() {
    this.toggleValue(!this.value)
  }
  down() {
    this.toggleValue(!this.value)
  }

  submit() {
    this.status = 'submit'
    this.end()
  }

  _(c) {
    if (c.toLowerCase() === 'y') {
      this.value = true
      return this.submit()
    }
    if (c.toLowerCase() === 'n') {
      this.value = false
      return this.submit()
    }
    return this.bell()
  }
  render() {
    const highlight = (text) => font(text, ['cyan', 'bold'])
    const choice = this.value
      ? `${highlight(this.yes)}/${this.no}`
      : `${this.yes}/${highlight(this.no)}`

    const statusIcon = icon(this.status)
    const message = font(this.msg, 'bold')
    const delim = delimiter(this.status === 'submit')
    const result = this.status === 'submit' ? (this.value ? this.yes : this.no) : choice

    this.outputText = `${statusIcon} ${message} ${delim} ${result}`
    this.out.write(erase.line + cursor.to(0) + this.outputText)
  }
}

export default ConfirmPrompt
