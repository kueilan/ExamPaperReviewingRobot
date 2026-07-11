export default function ExamReviewResult({ result }) {
  if (!result) return null

  const { result: review } = result

  return (
    <div className={`review-result ${review.is_valid ? 'valid' : 'invalid'}`}>
      <h3>考卷審題結果</h3>

      <div className={`status ${review.is_valid ? 'success' : 'error'}`}>
        {review.is_valid ? '這份考卷可通過審題' : '這份考卷有需要修正的地方'}
      </div>

      {review.errors.length > 0 && (
        <div className="section errors">
          <h4>錯誤</h4>
          <ul>
            {review.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {review.warnings.length > 0 && (
        <div className="section warnings">
          <h4>提醒</h4>
          <ul>
            {review.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {review.suggestions.length > 0 && (
        <div className="section suggestions">
          <h4>修改建議</h4>
          <ul>
            {review.suggestions.map((sug, i) => (
              <li key={i}>{sug}</li>
            ))}
          </ul>
        </div>
      )}

      {review.detailed_analysis && (
        <div className="section detailed-analysis">
          <h4>細部分析</h4>
          <div className="analysis-content">
            {review.detailed_analysis.conditions && (
              <div className="analysis-block">
                <h5>條件檢查</h5>
                <p>{review.detailed_analysis.conditions}</p>
              </div>
            )}
            {review.detailed_analysis.consistency && (
              <div className="analysis-block">
                <h5>內容一致性</h5>
                <p>{review.detailed_analysis.consistency}</p>
              </div>
            )}
            {review.detailed_analysis.fix_suggestion && (
              <div className="analysis-block">
                <h5>修正建議</h5>
                <p>{review.detailed_analysis.fix_suggestion}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
