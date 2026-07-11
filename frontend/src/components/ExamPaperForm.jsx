import { useState } from 'react'
import { getBackendBaseUrl, uploadImage } from '../api'

const SUBJECTS = ['數學', '物理', '化學', '生物']
const DEFAULT_GRADE = '國一'

export default function ExamPaperForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    subject: '數學',
    pages: []
  })

  const [apiConfig, setApiConfig] = useState({
    gemini: {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-1.5-flash'
    },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    }
  })

  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value)
  }

  const handleApiConfigChange = (provider, field, value) => {
    setApiConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }))
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = files.map(file => uploadImage(file))
      const results = await Promise.all(uploadPromises)

      const newPages = results.map((r, i) => ({
        url: r.url,
        filename: r.filename,
        originalName: files[i].name
      }))

      setFormData(prev => ({ ...prev, pages: [...prev.pages, ...newPages] }))
      setPreviewUrls(prev => [...prev, ...newPages.map(p => `${getBackendBaseUrl()}${p.url}`)])
    } catch (err) {
      console.error('圖片上傳失敗:', err)
      alert('圖片上傳失敗，請稍後再試。')
    } finally {
      setUploading(false)
    }
  }

  const removePage = (index) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index)
    }))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const movePage = (from, to) => {
    if (to < 0 || to >= formData.pages.length) return
    const newPages = [...formData.pages]
    const newPreviewUrls = [...previewUrls]

    ;[newPages[from], newPages[to]] = [newPages[to], newPages[from]]
    ;[newPreviewUrls[from], newPreviewUrls[to]] = [newPreviewUrls[to], newPreviewUrls[from]]

    setFormData(prev => ({ ...prev, pages: newPages }))
    setPreviewUrls(newPreviewUrls)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.pages.length === 0) {
      alert('請先上傳至少一張考卷圖片。')
      return
    }

    const config = apiConfig[selectedProvider]
    if (!config.apiKey) {
      alert('請先輸入 API Key。')
      return
    }

    onSubmit({
      ...formData,
      grade: DEFAULT_GRADE,
      provider: selectedProvider,
      apiConfig: config
    })
  }

  return (
    <form onSubmit={handleSubmit} className="exam-paper-form">
      <h2>考卷審題</h2>
      <p className="form-note">先選擇 AI 服務，再貼上你自己的 API Key，即可開始審題。</p>

      <div className="form-section">
        <h3>基本資料</h3>
        <div className="form-row">
          <div className="form-group">
            <label>科目</label>
            <select name="subject" value={formData.subject} onChange={handleChange}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>AI 設定</h3>
        <div className="form-group">
          <label>選擇 AI 服務</label>
          <select value={selectedProvider} onChange={handleProviderChange}>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI / 相容 API</option>
          </select>
        </div>

        <div className="form-hint">API Key 由你直接貼上，不會寫死在系統裡。</div>

        {selectedProvider === 'gemini' && (
          <div className="api-config">
            <div className="form-group">
              <label>Gemini API Key</label>
              <input
                type="password"
                placeholder="AIza..."
                value={apiConfig.gemini.apiKey}
                onChange={(e) => handleApiConfigChange('gemini', 'apiKey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>API Base URL</label>
              <input
                type="text"
                placeholder="https://generativelanguage.googleapis.com/v1beta"
                value={apiConfig.gemini.baseUrl}
                onChange={(e) => handleApiConfigChange('gemini', 'baseUrl', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>模型名稱</label>
              <input
                type="text"
                placeholder="gemini-1.5-flash"
                value={apiConfig.gemini.model}
                onChange={(e) => handleApiConfigChange('gemini', 'model', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedProvider === 'openai' && (
          <div className="api-config">
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiConfig.openai.apiKey}
                onChange={(e) => handleApiConfigChange('openai', 'apiKey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>API Base URL</label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={apiConfig.openai.baseUrl}
                onChange={(e) => handleApiConfigChange('openai', 'baseUrl', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>模型名稱</label>
              <input
                type="text"
                placeholder="gpt-4o-mini"
                value={apiConfig.openai.model}
                onChange={(e) => handleApiConfigChange('openai', 'model', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>上傳考卷</h3>
        <div className="form-group">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && <span className="uploading">圖片上傳中...</span>}
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div className="pages-preview">
          <h3>頁面預覽（{previewUrls.length} 張）</h3>
          <div className="pages-grid">
            {previewUrls.map((url, i) => (
              <div key={i} className="page-item">
                <span className="page-number">第 {i + 1} 頁</span>
                <img src={url} alt={`第 ${i + 1} 頁預覽`} />
                <div className="page-actions">
                  <button type="button" onClick={() => movePage(i, i - 1)} disabled={i === 0}>上移</button>
                  <button type="button" onClick={() => movePage(i, i + 1)} disabled={i === previewUrls.length - 1}>下移</button>
                  <button type="button" onClick={() => removePage(i)} className="delete-btn">刪除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={formData.pages.length === 0}>
        開始審題
      </button>
    </form>
  )
}
