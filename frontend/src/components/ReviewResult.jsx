export default function ReviewResult({ result }) {
  if (!result) return null

  const { result: review } = result

  return (
    <div className={`review-result ${review.is_valid ? 'valid' : 'invalid'}`}>
      <h3>題目檢查結果</h3>

      <div className={`status ${review.is_valid ? 'success' : 'error'}`}>
        {review.is_valid ? '題目格式正常' : '題目有需要修正的地方'}
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
    </div>
  )
}
