import { useState } from 'react'
import ExamPaperForm from './components/ExamPaperForm'
import ExamReviewResult from './components/ExamReviewResult'
import { reviewExamPaper } from './api'
import './App.css'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleReview = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const response = await reviewExamPaper(data)
      setResult(response)
    } catch (err) {
      setError('審題失敗，請確認後端服務是否正常，或稍後再試一次。')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>審題機器人</h1>
        <p>上傳考卷圖片，選擇 Gemini 或 OpenAI，貼上你的 API Key 後即可開始審題。</p>
      </header>

      <main>
        <ExamPaperForm onSubmit={handleReview} />

        {loading && <div className="loading">AI 審題中，請稍候...</div>}
        {error && <div className="error-msg">{error}</div>}
        {result && <ExamReviewResult result={result} />}
      </main>
    </div>
  )
}

export default App
