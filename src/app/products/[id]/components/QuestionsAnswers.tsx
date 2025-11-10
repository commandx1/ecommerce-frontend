import { User } from "lucide-react"

interface Question {
  id: number
  question: string
  askedBy: string
  askedDate: string
  answer: {
    author: string
    text: string
    list?: string[]
    answeredDate: string
  }
}

interface QuestionsAnswersProps {
  questions: Question[]
}

const QuestionsAnswers = ({ questions: questionsData }: QuestionsAnswersProps) => {
  return (
    <section id="questions-answers" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-steel-blue">Questions & Answers</h2>
          <button
            type="button"
            className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
          >
            Ask a Question
          </button>
        </div>

        <div className="space-y-6">
          {questionsData.map((qa) => (
            <div key={qa.id} className="bg-light-mint-gray rounded-2xl p-8">
              <div className="mb-4">
                <h3 className="font-semibold text-steel-blue mb-2">{qa.question}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Asked by {qa.askedBy} • {qa.askedDate}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center shrink-0">
                    <User className="text-white text-sm w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-steel-blue mb-1">{qa.answer.author}</div>
                    <p className="text-gray-700 mb-3">{qa.answer.text}</p>
                    {qa.answer.list && (
                      <ul className="text-gray-700 space-y-1 ml-4 list-disc">
                        {qa.answer.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    <div className="text-sm text-gray-500 mt-2">Answered {qa.answer.answeredDate}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            type="button"
            className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
          >
            View All Questions
          </button>
        </div>
      </div>
    </section>
  )
}

export default QuestionsAnswers
