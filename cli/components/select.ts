import { font } from '../color'
import { Prompt } from './prompt'
import { icons, icon, delimiter } from '../utils'

const { cursor, erase } = require('sisteransi')

class SelectPrompt extends Prompt {
  constructor(opts = {} as any) {
    super()
    this.msg = opts.message
    this.pageSize = opts.pageSize || 10
    this.cursor = 0

    this.options = opts.options.map((ch, i) => {
      const isString = typeof ch === 'string'
      const value = isString ? i : ch.value || i
      const label = isString ? ch : ch.label || i

      if (opts.initial === value) this.cursor = i

      return {
        label,
        value,
        warn: ch?.warn || opts.warn,
        description: ch?.description,
        disabled: ch?.disabled
      }
    })
    this.total = this.options.length
    this.value = (this.options[this.cursor] || {}).value
    this.out.write(erase.line + cursor.to(0) + cursor.save + cursor.hide)
    this.render()
  }

  moveCursor(n) {
    this.cursor = n
    this.value = this.options[n].value
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

  submit() {
    if (!this.options[this.cursor].disabled) {
      this.status = 'submit'
      this.end()
    } else {
      this.bell()
    }
  }

  first() {
    this.moveCursor(0)
  }

  last() {
    this.moveCursor(this.total - 1)
  }

  up() {
    if (this.cursor === 0) {
      this.moveCursor(this.total - 1)
    } else {
      this.moveCursor(this.cursor - 1)
    }
  }

  down() {
    if (this.cursor === this.total - 1) {
      this.moveCursor(0)
    } else {
      this.moveCursor(this.cursor + 1)
    }
  }

  next() {
    this.moveCursor((this.cursor + 1) % this.total)
  }

  _(c) {
    if (c === ' ') return this.submit()
  }

  // 分页
  paginate() {
    let startIndex = Math.min(
      this.total - this.pageSize,
      this.cursor - Math.floor(this.pageSize / 2)
    )
    if (startIndex < 0) startIndex = 0
    let endIndex = Math.min(startIndex + this.pageSize, this.total)
    return { startIndex, endIndex }
  }

  render() {
    this.out.write(cursor.restore + erase.down(this.pageSize) + cursor.save)

    const { startIndex, endIndex } = this.paginate()
    const option = this.options[this.cursor]

    const text =
      this.status === 'submit'
        ? option.label
        : option.disabled
          ? font(option.warn || '', 'red')
          : font('箭头键选择，回车键确认', 'gray')
    let outputText = `${icon(this.status)} ${font(this.msg, 'bold')} ${delimiter(this.status === 'submit')} ${text}`

    if (!this.status) {
      outputText += '\n'
      for (let i = startIndex; i < endIndex; i++) {
        const option = this.options[i]
        const color = option.disabled ? 'gray' : null
        let prefix = '  '
        let label = font(option.label, [color])
        let desc = ''

        if (i === startIndex && startIndex > 0) {
          prefix += icons.arrowUp
        } else if (i === endIndex - 1 && endIndex < this.total) {
          prefix += icons.arrowDown
        }

        if (this.cursor === i) {
          label = font(option.label, [color || 'cyan', 'bold'])
          prefix = ' ' + font(icons.pointer, color || 'cyan')
        }

        desc = font(` ${option.description || ''}`, 'gray')

        outputText += `${prefix} ${label} ${desc}\n`
      }
    }

    this.out.write(outputText)
  }
}

export default SelectPrompt
