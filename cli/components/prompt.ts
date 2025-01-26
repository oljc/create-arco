import readline from 'readline'
import EventEmitter from 'events'
import { beep, cursor } from 'sisteransi'

// 键盘动作映射表
const KEY_MAP = {
  'ctrl+a': 'first',
  'ctrl+c': 'abort',
  'ctrl+d': 'abort',
  'ctrl+e': 'last',
  'meta+escape': 'exit',
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
} as const

const getAction = (key: { name: string; ctrl: boolean; meta: boolean }): string | false => {
  const keyName =
    `${key.ctrl ? 'ctrl+' : ''}${key.meta ? 'meta+' : ''}${key.name}` as keyof typeof KEY_MAP
  return KEY_MAP[keyName] || false
}

export class Prompt extends EventEmitter {
  in = process.stdin
  out = process.stdout
  status: StateIcons = 'none'
  rl: readline.Interface

  constructor() {
    super()
    this.in = process.stdin
    this.out = process.stdout
    this.rl = readline.createInterface({
      input: this.in,
      escapeCodeTimeout: 50
    })
    readline.emitKeypressEvents(this.in, this.rl)

    if (this.in.isTTY) this.in.setRawMode(true)

    this.in.on('keypress', this.handleKeypress)
  }

  handleKeypress = (str: string, key: { name: string; ctrl: boolean; meta: boolean }) => {
    const action = getAction(key)

    if (!action) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      this.input?.(str)
    } else if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typeof this[action] === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this[action](key)
    } else {
      this.bell()
    }
  }

  // 关闭事件
  close() {
    this.out.write(cursor.show)
    this.in.off('keypress', this.handleKeypress)
    if (this.in.isTTY) this.in.setRawMode(false)
    this.rl.close()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.emit(this.status, this.value)
  }

  bell() {
    this.out.write(beep)
  }
}
