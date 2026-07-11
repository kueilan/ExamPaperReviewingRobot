import { useState } from 'react'
import { getBackendBaseUrl, uploadImage } from '../api'

const SUBJECTS = ['數學', '物理', '化學', '生物']
const QUESTION_TYPES = ['選擇題', '填充題', '計算題']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const DEFAULT_GRADE = '國一'

export default function QuestionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    subject: '數學',
    question_type: '選擇題',
    content: '',
    options: ['', '', '', ''],
    images: [],
    answer: '',
    knowledge_points: '',
    difficulty: 'medium'
  })
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = files.map(file => uploadImage(file))
      const results = await Promise.all(uploadPromises)
      const newImages = results.map(r => r.url)
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
    } catch (err) {
      console.error('圖片上傳失敗:', err)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const question = {
      ...formData,
      grade: DEFAULT_GRADE,
      options: formData.question_type === '選擇題' ? formData.options.filter(o => o.trim()) : [],
      knowledge_points: formData.knowledge_points.split(',').map(k => k.trim()).filter(k => k)
    }
    console.log('送出題目資料', question)
    onSubmit(question)
  }

  return (
    <form onSubmit={handleSubmit} className="question-form">
      <h2>題目檢查</h2>

      <div className="form-row">
        <div className="form-group">
          <label>科目</label>
          <select name="subject" value={formData.subject} onChange={handleChange}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>題型</label>
          <select name="question_type" value={formData.question_type} onChange={handleChange}>
            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>難度</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>題目內容</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={4}
          placeholder="請輸入題目內容..."
          required
        />
      </div>

      <div className="form-group">
        <label>題目圖片</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <span className="uploading">圖片上傳中...</span>}

        {formData.images.length > 0 && (
          <div className="image-preview">
            {formData.images.map((img, i) => (
              <div key={i} className="image-item">
                <img src={`${getBackendBaseUrl()}${img}`} alt={`題目圖片 ${i + 1}`} />
                <button type="button" onClick={() => removeImage(i)}>刪除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formData.question_type === '選擇題' && (
        <div className="form-group">
          <label>選項</label>
          {formData.options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              placeholder={`${String.fromCharCode(65 + i)}. 選項內容`}
            />
          ))}
        </div>
      )}

      <div className="form-group">
        <label>答案</label>
        <input
          type="text"
          name="answer"
          value={formData.answer}
          onChange={handleChange}
          placeholder="請輸入答案"
          required
        />
      </div>

      <div className="form-group">
        <label>知識點</label>
        <input
          type="text"
          name="knowledge_points"
          value={formData.knowledge_points}
          onChange={handleChange}
          placeholder="請用逗號分隔，例如：一次函數, 代數運算"
        />
      </div>

      <button type="submit" className="submit-btn">開始檢查</button>
    </form>
  )
}
