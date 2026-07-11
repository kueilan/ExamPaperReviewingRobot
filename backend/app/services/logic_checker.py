from typing import List, Tuple
from ..models.question import Question, ReviewResult

def check_question_logic(question: Question) -> ReviewResult:
    errors = []
    warnings = []
    suggestions = []
    
    # 檢查題目內容
    if not question.content or len(question.content.strip()) < 5:
        errors.append("題目內容過短或為空")
    
    # 檢查答案
    if not question.answer or not question.answer.strip():
        errors.append("答案不能為空")
    
    # 選擇題專用檢查
    if question.question_type == "選擇題":
        if not question.options:
            errors.append("選擇題必須有選項")
        elif len(question.options) < 2:
            errors.append("選擇題至少需要2個選項")
        elif len(question.options) > 6:
            warnings.append("選擇題選項過多（建議4-5個）")
        
        if question.options:
            # 檢查重複選項
            unique_options = set(question.options)
            if len(unique_options) != len(question.options):
                errors.append("選擇題存在重複選項")
            
            # 檢查空選項
            empty_options = [i for i, opt in enumerate(question.options) if not opt.strip()]
            if empty_options:
                errors.append(f"選擇題第 {empty_options[0]+1} 個選項為空")
            
            # 檢查答案是否在選項範圍內
            answer_found = False
            for option in question.options:
                if question.answer.strip() in option:
                    answer_found = True
                    break
            
            if not answer_found:
                # 也檢查答案是否為選項編號（A, B, C, D）
                if question.answer.strip().upper() in ['A', 'B', 'C', 'D', 'E', 'F']:
                    answer_index = ord(question.answer.strip().upper()) - ord('A')
                    if answer_index >= len(question.options):
                        errors.append(f"答案 {question.answer} 對應的選項不存在")
                    else:
                        answer_found = True
                
                if not answer_found:
                    errors.append("答案不在選項範圍內")
    
    # 填充題檢查
    elif question.question_type == "填充題":
        if question.options and len(question.options) > 0:
            warnings.append("填充題通常不需要選項")
    
    # 計算題檢查
    elif question.question_type == "計算題":
        if question.options and len(question.options) > 0:
            warnings.append("計算題通常不需要選項")
    
    # 知識點檢查
    if not question.knowledge_points or len(question.knowledge_points) == 0:
        warnings.append("未標註知識點，建議添加")
    
    # 難度檢查
    if not question.difficulty:
        warnings.append("未標註難度")
    
    return ReviewResult(
        question_id=question.id or "unknown",
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        suggestions=suggestions
    )
