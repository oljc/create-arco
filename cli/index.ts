#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import prompts from 'prompts'
import { parseArgs } from 'node:util'
import { banner, bannerStr } from './constants'

import { version, name } from '../package.json'
import { color, isValidName } from './utils'

import community from '../templates/community.json'

interface Result {
  projectName: string
  techStack: 'vue' | 'react'
  version: 'full' | 'basic' | 'community'
  community: any
}

async function main() {
  const cwd = process.cwd()
  const args = process.argv.slice(2)

  const { values: argv, positionals } = parseArgs({
    args,
    options: {
      version: { type: 'boolean', short: 'v' }
    },
    strict: false
  })

  if (argv.version) {
    console.log(`${name} ${color(48, `v${version}`)}`)
    process.exit(0)
  }

  console.log()
  console.log(process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? banner : bannerStr)
  console.log()

  let result: Result = {} as Result
  try {
    const defaultProjectName = positionals[0] || 'hello-arco-pro'

    let contrib = [] as any[]
    result = await prompts(
      [
        {
          name: 'projectName',
          type: 'text',
          message: '请输入项目名称',
          initial: defaultProjectName,
          format: (name: string) => name.trim(),
          validate: (name: string) => isValidName(name) || '请重新输入合法项目名'
        },
        {
          name: 'techStack',
          type: 'select',
          message: '请选择你希望使用的技术栈',
          hint: '箭头键选择，回车键确认',
          choices: [
            { title: 'Vue', value: 'vue' },
            { title: 'React', value: 'react' }
          ],
          format: (value: Result['techStack']) => {
            contrib = community[value] || []
            return value
          }
        },
        {
          name: 'version',
          type: 'select',
          message: '请选择版本',
          hint: '上下键选择，回车键确认',
          warn: '暂无社区开源项目',
          choices: () => [
            { title: '基础版', value: 'basic' },
            { title: '完整版', value: 'full' },
            { title: '开源社区', value: 'community', disabled: !contrib.length }
          ]
        },
        {
          name: 'community',
          type: (prev: string) => (prev === 'community' ? 'select' : null),
          message: '请选择社区开源模板',
          hint: '上下键选择，回车键确认',
          choices: () =>
            contrib.map((item) => ({
              title: item.name,
              value: item,
              description: '1k Stars, oljc'
            }))
        },
        {
          name: 'confirm',
          type: 'confirm',
          message: '确认生成项目吗？',
          initial: true
        }
      ],
      {
        onCancel: () => {
          console.log(color(1, '✖') + ' 取消创建项目')
          process.exit(0)
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  console.log(color(10, '正在初始化项目'))
  // 当选择的是社区版本时 从Github上下载
  if (result.version === 'community') {
    const repository = result.community.repository
    // 下载模板
  }

  // 结束语
  console.log(color(87, `\n项目生成完成，感谢使用 create-arco-pro！`))
  console.log(`\n快速开始：`)
  console.log(`  - ${color(222, `cd ${result.projectName}`)}`)
  console.log(`  - ${color(222, 'npm run dev')}`)

  console.log(color(192, '\n感谢您的使用！如有反馈或需要支持，欢迎访问项目仓库并给予 Star！'))
  console.log(color(192, `GitHub: \x1b[4mhttps://github.com/oljc/creat-arco-pro\x1b[24m`))
}

main().catch((e) => {
  console.error(e)
})
