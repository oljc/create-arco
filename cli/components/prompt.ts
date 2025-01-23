const readline = require('readline')
const EventEmitter = require('events')
const { beep, cursor } = require('sisteransi')

// 键盘动作映射表
const KEY_ACTION_MAP = {
  meta: {
    escape: 'exit'
  },
  ctrl: {
    a: 'first',
    c: 'abort',
    d: 'abort',
    e: 'last'
  },
  normal: {
    return: 'submit',
    enter: 'submit',
    backspace: 'delete',
    delete: 'deleteForward',
    escape: 'exit',
    tab: 'next',
    pagedown: 'nextPage',
    pageup: 'prevPage',
    home: 'home',
    end: 'end',
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right'
  },
  select: {
    j: 'down',
    k: 'up'
  }
}

// 动作解析函数
const getAction = (key, isSelect) => {
  if (key.meta) return KEY_ACTION_MAP.meta[key.name] || false
  if (key.ctrl) return KEY_ACTION_MAP.ctrl[key.name] || false
  if (isSelect && KEY_ACTION_MAP.select[key.name]) return KEY_ACTION_MAP.select[key.name]
  return KEY_ACTION_MAP.normal[key.name] || false
}

export class Prompt extends EventEmitter {
  constructor() {
    super()

    this.firstRender = true
    this.in = process.stdin
    this.out = process.stdout

    const rl = readline.createInterface({ input: this.in, escapeCodeTimeout: 50 })
    readline.emitKeypressEvents(this.in, rl)

    if (this.in.isTTY) this.in.setRawMode(true)

    this._bindKeypress(this.constructor.name === 'select', rl)
  }

  _bindKeypress(isSelect, rl) {
    const keypress = (str, key) => {
      const action = getAction(key, isSelect)
      if (!action) {
        this._ && this._(str, key) // 自定义输入处理
      } else if (typeof this[action] === 'function') {
        this[action](key) // 调用对应方法
      } else {
        this.bell() // 无效键
      }
    }

    this.in.on('keypress', keypress)
    this.close = () => this._close(keypress, rl)
  }

  // 关闭事件
  _close(keypress, rl) {
    this.out.write(cursor.show)
    this.in.removeListener('keypress', keypress)
    if (this.in.isTTY) this.in.setRawMode(false)
    rl.close()
    this.emit(this.status, this.value)
  }

  bell() {
    this.out.write(beep)
  }
}
