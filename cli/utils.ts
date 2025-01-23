import fs from 'node:fs'
import https from 'node:https'
import zlib from 'node:zlib'
import path from 'node:path'
import os from 'node:os'
import { font } from './color'
import { x } from 'tar'
import { spawn } from 'child_process'

export const isValidName = (name: string): boolean => {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
}

export const existsFiles = (name: string) => {
  const files = fs.readdirSync(process.cwd())
  return files.includes(name)
}

/**
 * 下载文件
 * @param url 下载地址
 * @param dest 保存路径
 */
export const fetch = async (url: string, dest: string, tips: any): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    let countdown = 60
    const timer = setInterval(() => {
      countdown -= 1
      tips.start().update(`正在生成项目  尝试时间${countdown}s \u{23F3}`)
      if (countdown === 0) {
        exit(false)
      }
    }, 1000)

    const exit = (pass, tip?: string) => {
      clearInterval(timer)
      if (pass) {
        tips.succeed(tip || '初始化完成')
        resolve()
      } else {
        tips.fail(tip || '网络超时请稍后重试')
        reject()
      }
    }
    // 重试
    let retry = 3
    const tryAgain = (url: string) => {
      retry -= 1
      if (retry <= 0) {
        exit(false)
      } else {
        http(url)
      }
    }

    const http = (url: string) => {
      const parsedUrl = new URL(url)
      https
        .get(
          {
            timeout: 15000,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname,
            headers: {
              Connection: 'keep-alive'
            }
          },
          (res) => {
            const code = res.statusCode
            if (code >= 400) {
              tryAgain(`https://fastgit.cc/${url}`)
            } else if (code >= 300 && res.headers.location) {
              tryAgain(res.headers.location)
            } else {
              clearInterval(timer)
              let downloadedSize = 0
              const startTime = Date.now()
              res
                .on('data', (chunk) => {
                  downloadedSize += chunk.length
                  const speed = Math.round(
                    (downloadedSize >> 10) / ((Date.now() - startTime) / 1000)
                  )
                  tips.update(`正在下载中  ${speed} KB/s \u{23F3}`)
                })
                .pipe(fs.createWriteStream(dest))
                .on('finish', () => exit(true))
                .on('error', () => exit(false, '初始化失败'))
            }
          }
        )
        .on('error', () => tryAgain(`https://fastgit.cc/${url}`))
    }
    http(url)
  })
}

/**
 * 解压 .tar.gz 文件
 * @param {string} src -  原文件路径
 * @param {string} dest - 解压到的目标目录
 */
export async function untar(source: string, desc: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source)
    const gunzipStream = zlib.createGunzip()

    if (!fs.existsSync(desc)) {
      fs.mkdirSync(desc, { recursive: true })
    }

    readStream
      .pipe(gunzipStream)
      .pipe(x({ cwd: desc, strip: 1 }))
      .on('finish', resolve)
      .on('error', reject)
  })
}

/**
 * 管理临时目录
 */
export const createTempDir = (baseDir?: string) => {
  const dir = baseDir || os.tmpdir()
  const tempDir = path.join(dir, '.temp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  return {
    tempDir,
    cleanup: () => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    }
  }
}

export const command = (cmd: string, args: string[], cwd?: string) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      shell: process.platform === 'win32',
      stdio: ['ignore', 'ignore', 'ignore'],
      cwd
    })
    child.on('close', resolve)
    child.on('error', reject)
  })
}

const main = {
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  pointer: '>',
  ellipsis: ':',
  tick: '✔',
  cross: '✖',
  pointerSmall: '›'
}
const win = {
  tick: '√',
  cross: '×',
  pointerSmall: '»'
}

export const icons = {
  ...main,
  ...(process.platform === 'win32' ? win : {})
}

const states = {
  abort: font(icons.cross, 'red'),
  exit: font(icons.cross, 'yellow'),
  submit: font(icons.tick, 'green'),
  none: font('?', 'cyan')
}

export const icon = (name) => states[name] || states.none

export const delimiter = (c) => font(c ? icons.ellipsis : icons.pointerSmall, 'gray')
