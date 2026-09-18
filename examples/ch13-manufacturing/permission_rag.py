"""私有化知识库权限控制三件套 · 第 13 章配套伪代码。

整理自本书第 13 章（约 p365–366），已修复排版误差。
要点：上传时打部门标签 → 检索时按权限过滤 → 全程审计日志。
`dify_client`、`get_user_departments` 等为示意接口，需对接实际平台 API。
"""

from datetime import datetime
import json


def upload_document(file, user_id):
    """上传文档到知识库，并附加部门元数据标签。"""
    # 获取用户部门信息
    user_depts = get_user_departments(user_id)
    # 添加部门元数据标签
    metadata = {
        "departments": user_depts,
        "uploader": user_id,
        "upload_time": datetime.now().isoformat(),
    }
    # 上传到 Dify 知识库并附加元数据
    dify_client.upload_document(file, metadata=metadata)


def retrieve_knowledge(query, user_id):
    """检索知识库：只返回用户有权限的部门文档或公开文档。"""
    # 获取用户可访问部门
    accessible_depts = get_user_accessible_departments(user_id)
    # 构建过滤条件：本部门文档 ∪ 公开文档
    filter_condition = {
        "$or": [
            {"departments": {"$in": accessible_depts}},
            {"access_level": "public"},
        ]
    }
    # 带过滤条件执行检索（示意）
    results = knowledge_base.search(query, filter=filter_condition)
    return results


def log_permission_check(user_id, resource_id, allowed):
    """权限审计日志：每次访问检查都留痕。"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "resource_id": resource_id,
        "action": "access_check",
        "result": "allowed" if allowed else "denied",
    }
    # 写入审计日志数据库
    audit_logger.info(json.dumps(log_entry))
