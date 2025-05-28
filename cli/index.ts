#!/usr/bin/env node

import prompts from './prompt'
import { parseArgs } from 'node:util'
import { banner, bannerStr } from './constants'
import { font } from './color'
import { isValidName, fetch, untar, createTempDir, command, existsFiles } from './utils'
import { version as v, name } from '../package.json'
import awesome from '../templates/awesome.json'
import { tipsManage } from './tips'

async function main() {
  const { values: argv, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: { version: { type: 'boolean', short: 'v' } },
    strict: false
  })

  if (argv.version) {
    console.log(`${name} ${font(`v${v}`, 'blue')}`)
    process.exit(0)
  }

  console.log(
    `\n${process.stdout.isTTY && process.stdout.getColorDepth() >= 8 ? banner : font(bannerStr, 'blue')}\n`
  )

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
    result = await prompts<Answers>(
      [
        {
          name: 'projectName',
          type: 'input',
          message: '请输入项目名称',
          initial: positionals[0] || 'hello-arco-pro',
          format: (name: string) => name.trim(),
          validate: (name: string) => {
            if (!isValidName(name)) {
              return '请输入合法的项目名'
            }
            if (existsFiles(name)) {
              return '当前目录下存在同名项目'
            }
            return true
          }
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
          options: (answers: Answers) => [
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
          options: (answers: Answers) =>
            awesome[answers.techStack].map((item) => ({
              label: item.name,
              value: item
            }))
        },
        {
          name: 'manager',
          type: 'select',
          message: '请选择包管理器',
          options: (answers: Answers) => {
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
          message: '是否初始化Git',
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
  } catch {
    process.exit(1)
  }

  if (!result.confirm) {
    console.log(font('✖', 'red') + ' 取消创建项目')
    process.exit(0)
  }

  const { projectName, techStack, version, community, manager, initGit } = result

  const { tempDir, cleanup } = createTempDir()

  // 当选择的是社区版本时 从Github上下载
  const url =
    version === 'community' && community
      ? `${community.repo}/archive/refs/heads/${community.branch}.tar.gz`
      : `https://github.com/RenderUI/${techStack}-${version}/archive/refs/heads/main.tar.gz`

  const file = `${tempDir}/${projectName}.tar.gz`
  const path = `${process.cwd()}/${projectName}`
  const tips = tipsManage()
  await fetch(url, file, tips)
  await untar(file, path)

  cleanup()

  if (initGit) {
    tips.start('初始化 Git')
    try {
      await command('git', ['init', '--quiet'], path)
      tips.update('Git 初始化成功')
    } catch {
      tips.fail('Git 初始化失败, 请自行初始化')
    }
  }

  const installDep = async () => {
    tips.start('安装项目依赖中')
    const installCmd = [
      ['install', '--quiet', '--silent'],
      ['install', '--quiet', '--silent', '--registry', 'https://registry.npmmirror.com']
    ]

    let success = false
    for (const args of installCmd) {
      try {
        await command(manager, args, path)
        tips.succeed('项目依赖安装成功')
        success = true
        break
      } catch {
        continue
      }
    }

    if (!success) {
      tips.fail('项目依赖安装失败')
      const { install } = await prompts<{ install: string }>([
        {
          name: 'install',
          type: 'select',
          message: '依赖安装失败，是否继续尝试？',
          options: [
            { label: '再次尝试', value: 'retry' },
            { label: '跳过', value: 'skip' }
          ]
        }
      ])

      if (install === 'retry') {
        process.stdout.write('\u001b[2A\u001b[K')
        await installDep()
      } else {
        tips.warn('已选择跳过，请自行安装依赖')
      }
    }
  }

  await installDep()

  console.log(`\n\u{1F389}快速开始:`)
  console.log(`   - ${font(`cd ${projectName}`, 192)}`)
  const start = (community?.start || `${manager} run dev`).replace(/\b(pnpm|yarn|npm)\b/, manager)
  console.log(`   - ${font(start, 192)}`)

  if (version === 'community' && community) {
    console.log(font(`\n当前模板文档：${font(community.repo, 'underline')}`, 'blue'))
  }
  console.log(font(`\nGitHub: ${font('https://github.com/oljc/create-arco', 'underline')}`, 'blue'))
  console.log(font('感谢您的使用！如有反馈或需要支持，欢迎访问项目仓库并给予Star！\n', 'blue'))
  process.exit(0)
}

main().catch((e) => {
  if (e) console.error('错误信息', e)
  process.exit(1)
})
