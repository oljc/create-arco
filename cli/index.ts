import prompts from 'prompts'
import pico from 'picocolors'
import { banner } from './banner'

interface Result {
  projectName: string
  techStack: 'vue' | 'react'
  version: 'full' | 'basic' | 'community'
}

async function main() {
  console.log(banner)
  console.log()

  let result: Result = {} as Result
  try {
    result = await prompts(
      [
        {
          name: 'projectName',
          type: 'text',
          message: '请输入项目名称',
          initial: 'hello-arco-pro'
        },
        {
          name: 'techStack',
          type: 'select',
          message: '请选择你希望使用的技术栈',
          choices: [
            { title: 'Vue', value: 'vue' },
            { title: 'React', value: 'react' }
          ]
        },
        {
          name: 'version',
          type: 'select',
          message: '请选择版本',
          choices: [
            { title: '完整版', value: 'full' },
            { title: '基础版', value: 'basic' },
            { title: '从社区选择', value: 'community' }
          ]
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
          console.log(pico.red('✖') + ' 取消创建项目')
          process.exit(0)
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  console.log(pico.green('开始生成项目...'))
}

main().catch((e) => {
  console.error(e)
})
