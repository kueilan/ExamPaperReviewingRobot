import os
import base64
import json
import httpx
from ..models.exam import ExamPaper, ReviewResult

MATH_PROMPT = """
請你扮演一位嚴謹的數學命題審題老師，幫我檢查以下數學題目是否存在邏輯錯誤、符號誤植、條件不足、圖文不一致或無法推出答案的問題。

請依照以下步驟分析：

**先完整理解題意**
- 列出題目給定的條件。
- 說明圖形中的點、線、角度、平行關係與角平分線條件。

**檢查文字與圖形是否一致**
- 題目文字中提到的點、線、角是否真的出現在圖中。
- 檢查角的記號是否合理，例如某個角的三個點是否能形成該角。
- 若角的頂點或邊不符合圖形，請指出可能錯在哪裡。

**檢查數學邏輯是否可推導**
- 判斷題目給的條件是否足以求出答案。
- 若無法推出唯一答案，請說明缺少哪些條件。
- 若可以推出答案，請簡要說明推理流程。

**檢查是否可能有誤植**
- 特別檢查角度名稱、點名、線段名稱、平行線、角平分線等是否可能打錯。
- 若發現疑似錯字，請提出合理修正版本。
- 修正後請確認題目是否變得合理。

**請注意：**
- 如果題目中的某個角或線段名稱雖然語法上存在，但與圖形或推理目的不符，也請判斷為「疑似誤植」。
- 不要只檢查符號是否存在，要檢查它是否符合整體幾何邏輯。

**輸出格式請依照以下 JSON 格式：**
{
  "is_valid": true/false,
  "errors": ["三、邏輯問題或疑似錯誤"],
  "warnings": ["注意事項"],
  "suggestions": ["四、可能的修正建議"],
  "detailed_analysis": {
    "conditions": "一、題目條件整理",
    "consistency": "二、圖文一致性檢查",
    "fix_suggestion": "五、修正後是否可解"
  }
}

只回覆 JSON，不要有其他文字。
"""

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def load_image_as_base64(image_url):
    possible_paths = [
        image_url.lstrip("/"),
        os.path.join("backend", image_url.lstrip("/")),
    ]
    
    for image_path in possible_paths:
        if os.path.exists(image_path):
            return encode_image(image_path), image_path
    return None, None

async def call_gemini_api(config, images_base64, prompt):
    url = f"{config.baseUrl}/models/{config.model}:generateContent"
    
    parts = []
    for i, (b64, _) in enumerate(images_base64):
        mime_type = "image/jpeg" if ".jpg" in _ or ".jpeg" in _ else "image/png"
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": b64
            }
        })
    
    parts.append({"text": prompt})
    
    payload = {
        "contents": [{"parts": parts}]
    }
    
    headers = {
        "x-goog-api-key": config.apiKey,
        "Content-Type": "application/json"
    }
    
    # 重試機制
    for attempt in range(3):
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(url, json=payload, headers=headers)
            print(f"[AI] Gemini 回應狀態: {response.status_code} (嘗試 {attempt + 1}/3)")
            
            if response.status_code == 200:
                result = response.json()
                text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text
            elif response.status_code == 503:
                print(f"[AI] 服務暫時無法使用，等待後重試...")
                import asyncio
                await asyncio.sleep(2)
                continue
            else:
                error_text = response.text[:500]
                print(f"[AI] Gemini 錯誤: {error_text}")
                raise httpx.HTTPStatusError(f"HTTP {response.status_code}", request=response.request, response=response)
    
    raise Exception("服務暫時無法使用，請稍後再試")

def call_openai_api(config, images_base64, prompt, use_temperature=True):
    from openai import OpenAI
    
    client = OpenAI(
        api_key=config.apiKey,
        base_url=config.baseUrl
    )
    
    content = []
    for b64, path in images_base64:
        ext = os.path.splitext(path)[1].lower()
        mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime_type};base64,{b64}"}
        })
    
    content.append({"type": "text", "text": prompt})
    
    request_kwargs = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": "你是嚴謹的數學命題審題專家，只回覆 JSON 格式的審核結果。"},
            {"role": "user", "content": content}
        ]
    }

    if use_temperature:
        request_kwargs["temperature"] = 0.1

    response = client.chat.completions.create(**request_kwargs)
    
    return response.choices[0].message.content.strip()

def parse_ai_response(result_text):
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()
    
    return json.loads(result_text)

def is_temperature_compatibility_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return (
        "temperature" in message
        and (
            "unsupported value" in message
            or "does not support" in message
            or "invalid_request_error" in message
        )
    )

def friendly_temperature_message(model_name: str) -> str:
    return (
        f"這個模型（{model_name}）不接受我們目前送出的溫度設定（temperature=0.1），"
        "所以系統已自動改用預設值重新嘗試。"
        "這不是 API Key 錯誤，而是模型本身的規則比較嚴格。"
    )

def format_openai_friendly_error(raw_message: str) -> str:
    lowered = raw_message.lower()

    if "temperature" in lowered and (
        "unsupported value" in lowered
        or "does not support" in lowered
        or "invalid_request_error" in lowered
    ):
        return (
            "這個模型不接受目前的溫度設定（temperature=0.1）。"
            "請改用較相容的模型，或讓系統自動改用預設值重試。"
        )

    if "authentication" in lowered or "api key" in lowered or "permission" in lowered:
        return (
            "API 驗證失敗，請確認 API Key 是否正確、是否仍有效，"
            "以及所選的 Base URL 是否與模型相符。"
        )

    if "rate limit" in lowered or "too many requests" in lowered:
        return (
            "目前請求量可能太高，服務暫時沒有回應。"
            "請稍後再試一次。"
        )

    return f"AI 分析失敗：{raw_message}"

async def analyze_exam_paper(exam: ExamPaper) -> ReviewResult:
    errors = []
    warnings = []
    suggestions = []
    detailed_analysis = {}
    extra_warnings = []
    
    print(f"[AI] 開始審題，Provider: {exam.provider}, 模型: {exam.apiConfig.model}")
    print(f"[AI] 考卷頁數: {len(exam.pages)}")
    
    try:
        images_base64 = []
        for i, page in enumerate(exam.pages):
            image_url = page.get('url', '')
            b64, path = load_image_as_base64(image_url)
            if b64:
                images_base64.append((b64, path))
                print(f"[AI] 已載入第 {i + 1} 頁: {path}")
        
        if not images_base64:
            errors.append("未找到任何圖片")
            return ReviewResult(is_valid=False, errors=errors, warnings=warnings, suggestions=suggestions)
        
        if exam.provider == "gemini":
            result_text = await call_gemini_api(exam.apiConfig, images_base64, MATH_PROMPT)
        else:
            try:
                result_text = call_openai_api(exam.apiConfig, images_base64, MATH_PROMPT)
            except Exception as e:
                if is_temperature_compatibility_error(e):
                    extra_warnings.append(friendly_temperature_message(exam.apiConfig.model))
                    print(f"[AI] OpenAI 溫度設定不相容，改用預設值重試: {exam.apiConfig.model}")
                    result_text = call_openai_api(
                        exam.apiConfig,
                        images_base64,
                        MATH_PROMPT,
                        use_temperature=False
                    )
                else:
                    raise
        
        print(f"[AI] AI 回應: {result_text[:300]}...")
        
        result = parse_ai_response(result_text)
        
        errors = result.get("errors", [])
        warnings = extra_warnings + result.get("warnings", [])
        suggestions = result.get("suggestions", [])
        detailed_analysis = result.get("detailed_analysis", {})
        
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP {e.response.status_code}: {e.response.text[:500]}"
        print(f"[AI] HTTP 錯誤: {error_msg}")
        errors.append(format_openai_friendly_error(error_msg))
    except Exception as e:
        print(f"[AI] 錯誤: {str(e)}")
        errors.append(format_openai_friendly_error(str(e)))
    
    return ReviewResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        suggestions=suggestions,
        detailed_analysis=detailed_analysis
    )
