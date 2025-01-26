import { SelectPrompt } from './components/select'
import { InputPrompt } from './components/input'
import { ConfirmPrompt } from './components/confirm'

type BaseQuestion<T> = {
  name: string
  type: 'input' | 'select' | 'confirm'
  when?: boolean | ((answers: T) => boolean)
  initial?: string | boolean | object | ((answers: T) => string | boolean | object)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
}

type Question<T = Record<string, unknown>> =
  | (SelectOptions & BaseQuestion<T> & { type: 'select' })
  | (ConfirmOptions & BaseQuestion<T> & { type: 'confirm' })
  | (InputOptions & BaseQuestion<T> & { type: 'input' })

async function prompt<T>(questions: Question<T>[], { onCancel = () => {} } = {}): Promise<T> {
  const answers = {} as T
  const isFunction = (fn: unknown) => typeof fn === 'function'

  for (const question of questions) {
    const { name, type, when } = question

    if (when && (isFunction(when) ? !when(answers) : !when)) {
      continue
    }

    if (isFunction(question.options)) {
      question.options = await question.options(answers)
    }
    if (isFunction(question.initial)) {
      question.initial = await question.initial(answers)
    }

    try {
      const PromptComponent = getPromptComponent(type)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const prompt = new PromptComponent({ ...question })
      answers[name as keyof T] = await new Promise((resolve, reject) => {
        prompt.on('submit', resolve)
        prompt.on('exit', reject)
        prompt.on('abort', reject)
      })
    } catch {
      await onCancel()
      break
    }
  }

  return answers
}

function getPromptComponent(type: string) {
  switch (type) {
    case 'select':
      return SelectPrompt
    case 'input':
      return InputPrompt
    case 'confirm':
      return ConfirmPrompt
    default:
      throw new Error(`Unknown prompt type: ${type}`)
  }
}

export default prompt
