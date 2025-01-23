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

/**
 * 下载文件
 * @param url 下载地址
 * @param dest 保存路径
 */
export async function fetch(url: string, dest: string, tips: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const parsedUrl = new URL(url)
    const options: https.RequestOptions = {
      timeout: 15000,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      headers: {
        Connection: 'keep-alive'
      }
    }

    https
      .get(options, (res) => {
        const code = res.statusCode
        if (code == null) {
          return reject(new Error('No status code'))
        }
        if (code >= 400) {
          reject({ code, message: res.statusMessage })
        } else if (code >= 300) {
          fetch(res.headers.location, dest, tips).then(resolve, reject)
        } else {
          let downloadedSize = 0
          const startTime = Date.now()
          res
            .on('data', (chunk) => {
              downloadedSize += chunk.length
              const elapsedTime = (Date.now() - startTime) / 1000
              const speed = (downloadedSize / 1024 / elapsedTime).toFixed(2)
              tips.update(`正在下载中 \u{23F3}${speed} KB/s`)
            })
            .pipe(fs.createWriteStream(dest))
            .on('finish', () => {
              tips.succeed('初始化完成')
              resolve()
            })
            .on('error', () => {
              tips.fail('初始化失败')
              reject
            })
        }
      })
      .on('error', () => {
        // TODO: 保底加速访问后续处理
        if (!url.includes('https://fastgit.cc')) {
          fetch(`https://fastgit.cc/${url}`, dest, tips).then(resolve, reject)
        } else {
          tips.fail('网络超时请稍后重试')
          reject
        }
      })
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
      stdio: ['ignore', 'ignore', 'inherit'],
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
