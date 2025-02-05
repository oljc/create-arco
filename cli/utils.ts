import fs from 'node:fs'
import axios from 'axios'
import zlib from 'node:zlib'
import path from 'node:path'
import os from 'node:os'
import { font } from './color'
import { x } from 'tar'
import { spawn } from 'child_process'
import { Tips } from './tips'

export const isValidName = (name: string): boolean => {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
}

export const existsFiles = (name: string) => {
  const files = fs.readdirSync(process.cwd())
  return files.includes(name)
}

/**
 * 代理网站
 */
let proxyHttps = [
  'https://fastgit.cc',
  'https://gh.llkk.cc',
  'https://gh-proxy.com',
  'https://github.tbedu.top',
  'https://gh.idayer.com',
  'https://gh.zhaojun.im',
  'https://ghp.keleyaa.com'
]

export const fetchProxyHttps = async () => {
  try {
    const response = await axios.get('https://api.akams.cn/github')
    const proxyUrls = response.data.data.map((item: { url: string }) => item.url)
    proxyHttps = [...proxyHttps, ...proxyUrls]
  } catch {
    // ignore
  }
}

/**
 * 下载文件
 * @param url 下载地址
 * @param dest 保存路径
 */
export const fetch = async (url: string, dest: string, tips: Tips): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    let countdown = 120
    let proxyIndex = 0
    const timer = setInterval(() => {
      countdown -= 1
      tips.start().update(`正在生成项目  尝试时间${countdown}s \u{23F3}`)
      if (countdown === 0) {
        exit(false)
      }
    }, 1000)

    const exit = (pass: boolean, tip?: string) => {
      clearInterval(timer)
      if (pass) {
        tips.succeed(tip || '初始化完成')
        resolve()
      } else {
        tips.fail(tip || '网络超时请稍后重试')
        reject()
      }
    }

    fetchProxyHttps()

    const getProxyUrl = () => {
      const api = `${proxyHttps[proxyIndex]}/${url}`
      proxyIndex += 1
      if (proxyIndex >= proxyHttps.length) {
        proxyIndex = 0
      }
      return api
    }

    const http = async (url = getProxyUrl()) => {
      try {
        const response = await axios.get(url, { timeout: 10000, responseType: 'stream' })
        const code = response.status || 0
        if (code >= 400) {
          http(getProxyUrl()) // 重试
        } else if (code >= 300 && response.headers.location) {
          http(response.headers.location) // 重定向处理
        } else {
          clearInterval(timer)
          let downloadedSize = 0
          const startTime = Date.now()
          response.data.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length
            const speed = Math.round((downloadedSize >> 10) / ((Date.now() - startTime) / 1000))
            tips.update(`正在下载中  ${speed} KB/s \u{23F3}`)
          })
          response.data
            .pipe(fs.createWriteStream(dest))
            .on('finish', () => exit(true))
            .on('error', () => exit(false, '初始化失败'))
        }
      } catch {
        http(getProxyUrl())
      }
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
  const tempDir = path.join(dir, '.create-arco-temp')
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

const states: Record<StateIcons, string> = {
  abort: font(icons.cross, 'red'),
  exit: font(icons.cross, 'yellow'),
  submit: font(icons.tick, 'green'),
  none: font('?', 'cyan')
}

export const icon = (name: StateIcons) => states[name]

export const delimiter = (c: boolean) => font(c ? icons.ellipsis : icons.pointerSmall, 'gray')
