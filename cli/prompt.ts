import * as el from './components'

async function prompt(questions = [], { onCancel = () => {} } = {}): Promise<any> {
  const answers: Record<string, any> = {}
  const isFunction = (fn) => typeof fn === 'function'

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
      const prompt = new el[type]({ name, ...question })
      answers[name] = await new Promise((resolve, reject) => {
        prompt.on('submit', resolve)
        prompt.on('exit', reject)
        prompt.on('abort', reject)
      })
    } catch (error) {
      await onCancel()
      break
    }
  }

  return answers
}

export default prompt
