#!/usr/bin/env node

import prompts from './prompt'
import { parseArgs } from 'node:util'
import { banner, bannerStr } from './constants'
import { font } from './color'
import { isValidName, fetch, untar, createTempDir, command } from './utils'
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
    console.log(`${name} ${font(`v${v}`, 'blue')}`)
    process.exit(0)
  }

  console.log()
  console.log(
    process.stdout.isTTY && process.stdout.getColorDepth() > 8 ? banner : font(bannerStr, 'blue')
  )
  console.log()

  const supportedManagers = await Promise.all(
    ['pnpm', 'yarn', 'npm'].map(async (manager) => {
      try {
        await command(manager, ['--version'])
        return manager
      } catch {
        return null
      }
    })
  ).then((managers) => managers.filter(Boolean) as string[])

  let result: Answers = {} as Answers
  try {
    result = await prompts(
      [
        {
          name: 'projectName',
          type: 'input',
          message: '请输入项目名称',
          initial: positionals[0] || 'hello-arco-pro',
          format: (name: string) => name.trim(),
          validate: (name: string) => isValidName(name) || '请重新输入合法项目名'
        },
        {
          name: 'techStack',
          type: 'select',
          message: '请选择你希望使用的技术栈',
          options: [
            { label: 'Vue', value: 'vue' },
            { label: 'React', value: 'react' }
          ]
        },
        {
          name: 'version',
          type: 'select',
          message: '请选择版本',
          options: (answers) => [
            { label: '基础版', value: 'basic' },
            { label: '完整版', value: 'full' },
            {
              label: '开源项目',
              value: 'community',
              disabled: awesome[answers.techStack].length <= 0,
              warn: '暂无社区开源项目',
              description: '来自社区的优秀活跃开源项目'
            }
          ]
        },
        {
          name: 'community',
          type: 'select',
          message: '请选择社区开源模板',
          when: (answers) => answers.version === 'community',
          options: (answers) =>
            awesome[answers.techStack].map((item) => ({
              label: item.name,
              value: item
            }))
        },
        {
          name: 'manager',
          type: 'select',
          message: '请选择包管理器',
          options: (answers) => {
            const recommended = answers.community?.packageManager || 'pnpm'
            return supportedManagers.map((manager) => ({
              label: manager,
              value: manager,
              description: manager === recommended ? '推荐' : null
            }))
          }
        },
        {
          name: 'initGit',
          type: 'confirm',
          message: '是否初始化 Git',
          initial: true
        },
        {
          name: 'confirm',
          type: 'confirm',
          message: '确认生成项目吗',
          initial: true
        }
      ],
      {
        onCancel: () => {
          console.log(font('✖', 'red') + ' 取消创建项目')
          process.exit(0)
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  if (!result.confirm) {
    console.log(font('✖', 'red') + ' 取消创建项目')
    process.exit(0)
  }

  const { projectName, techStack, version, community, manager, initGit } = result

  const tips = tipsManage('正在生成项目').start()
  const { tempDir, cleanup } = createTempDir()

  // 当选择的是社区版本时 从Github上下载
  const url =
    version === 'community'
      ? `${community.repo}/archive/refs/heads/main.tar.gz`
      : `https://github.com/RenderUI/${techStack}-${version}/archive/refs/heads/main.tar.gz`

  const file = `${tempDir}/${projectName}.tar.gz`
  const path = `${cwd}/${projectName}`
  await fetch(url, file, tips)
  await untar(file, path)

  cleanup()

  if (initGit) {
    tips.start('初始化 Git')
    try {
      await command('git', ['init', '--quiet'], path)
      tips.update('Git 初始化成功')
    } catch (e) {
      tips.fail('Git 初始化失败, 请自行初始化')
    }
  }

  // 安装依赖
  tips.start('安装项目依赖中')
  const argsList = [
    ['install', '--quiet'],
    ['install', '--quiet', '--registry', 'https://registry.npmmirror.com']
  ]

  const success = argsList.some(async (args) => {
    try {
      await command(manager, args, path)
      tips.succeed('项目依赖安装成功')
      return true
    } catch {
      return false
    }
  })

  if (!success) {
    tips.fail('依赖安装失败，请手动安装')
  }

  console.log(`\n\u{1F389} 快速开始：\n`)
  console.log(`  - ${font(`cd ${name}`, 192)}`)
  console.log(`  - ${font(community.start || 'pnpm run dev', 192)}`)

  if (version === 'community') {
    console.log(font(`\n项目文档：${font(community.repo, 'underline')}`, 'blue'))
  }
  console.log(
    font(`\nGitHub: ${font('https://github.com/oljc/creat-arco-pro', 'underline')}`, 'blue')
  )
  console.log(font('感谢您的使用！如有反馈或需要支持，欢迎访问项目仓库并给予Star！', 'blue'))
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
})
