#!/usr/bin/env node

import prompts from 'prompts'
import { parseArgs } from 'node:util'
import { banner, bannerStr } from './constants'
import { color, isValidName, end, fetch, untar, createTempDir, command } from './utils'
import { version as v, name } from '../package.json'
import awesome from '../templates/awesome.json'
import { tipsManage } from './tips'

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
    console.log(`${name} ${color(`v${v}`, 48)}`)
    process.exit(0)
  }

  console.log()
  console.log(
    process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? banner : color(bannerStr, 27)
  )
  console.log()

  const supportedManagers: string[] = []
  for (const manager of ['pnpm', 'yarn', 'npm'] as const) {
    try {
      await command(manager, ['--version'])
      supportedManagers.push(manager)
    } catch {}
  }

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
            contrib = awesome[value] || []
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
              value: item
            }))
        },
        {
          name: 'manager',
          type: 'select',
          message: '请选择包管理器',
          hint: '上下键选择，回车键确认',
          choices: (prev: Result) => {
            const recommended = prev.community?.packageManager || 'pnpm'
            return supportedManagers.map((manager) => ({
              title: manager,
              value: manager,
              description: manager === recommended ? '推荐' : undefined
            }))
          },
          initial: (prev: Result) =>
            ['pnpm', 'yarn', 'npm'].indexOf(prev.community?.packageManager || 'pnpm')
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
          console.log(color('✖', 1) + ' 取消创建项目')
          process.exit(0)
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  const tips = tipsManage('正在生成项目').start()
  const { tempDir, cleanup } = createTempDir()
  const { projectName, techStack, version, community, manager } = result

  // 当选择的是社区版本时 从Github上下载
  let url = `https://github.com/RenderUI/${techStack}-${version}/archive/refs/heads/main.tar.gz`
  if (result.version === 'community') {
    const { repo } = community
    url = `${repo}/archive/refs/heads/main.tar.gz`
  }

  const file = `${tempDir}/${projectName}.tar.gz`
  const path = `${cwd}/${projectName}`
  await fetch(url, file, tips)
  await untar(file, path)

  cleanup()

  const projectPath = `${cwd}/${result.projectName}`
  tips.start('初始化 Git')
  try {
    await command('git', ['init', '--quiet'], projectPath)
    tips.update('Git 初始化成功')
  } catch (e) {
    tips.fail('Git 初始化失败')
  }

  // 安装依赖
  tips.start('安装项目依赖中')
  try {
    await command(manager, ['install', '--quiet'], projectPath)
    tips.succeed('依赖安装成功')
  } catch (e) {
    tips.fail('依赖安装失败')
    throw e
  }

  end(projectName, result.community?.start)
}

main().catch((e) => {
  console.error(e)
})
