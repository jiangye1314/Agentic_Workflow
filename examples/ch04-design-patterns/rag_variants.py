"""RAG 五种变体 · 第 4 章配套伪代码。

整理自本书第 4 章（约 p74–76），已修复排版误差。
`knowledge_base`、`vector_db`、`language_model` 等为抽象接口，不可直接运行。
工程化落地（分块、元数据过滤、引用校验）另见 ../../templates/rag-workflow.yaml。
"""


# ── 变体一：基础 RAG ────────────────────────────────────────
def basic_rag(query, knowledge_base):
    # 1. 检索：从知识库中检索与问题相关的文档
    relevant_docs = knowledge_base.search(query, top_k=5)
    # 2. 构建上下文：将检索到的文档内容拼接成上下文
    context = "\n\n".join([doc.content for doc in relevant_docs])
    # 3. 构建提示词：将问题和上下文组合成完整的提示词
    prompt = f"""基于以下信息回答问题。如果信息不足，请说明无法回答。

{context}
问题：{query}
回答："""
    # 4. 生成：调用语言模型生成回答
    response = language_model.generate(prompt)
    return response


# ── 变体二：向量 RAG（语义检索 + 引用）───────────────────────
def vector_rag(query, vector_db):
    # 1. 编码：将查询转换为向量表示
    query_vector = embedding_model.encode(query)
    # 2. 检索：执行向量相似度搜索，找到最相似的文档
    similar_docs = vector_db.similarity_search(query_vector, top_k=5)
    # 3. 构建上下文：将检索到的文档内容拼接成上下文
    context = "\n\n".join([doc.content for doc in similar_docs])
    # 4. 生成：调用语言模型，使用上下文生成回答
    response = language_model.generate_with_context(query, context)
    # 5. 引用：为回答添加来源引用
    cited_response = add_citations(response, similar_docs)
    return cited_response


# ── 变体三：混合 RAG（关键词 + 向量，重排序）──────────────────
def hybrid_rag(query, knowledge_base):
    # 1. 检索：分别进行关键词搜索和向量搜索
    keyword_results = knowledge_base.keyword_search(query, top_k=3)
    vector_results = knowledge_base.vector_search(query, top_k=3)
    # 2. 合并：将两种检索结果合并并去重
    combined_results = merge_and_deduplicate(keyword_results, vector_results)
    # 3. 重排序：根据相关性对合并后的结果进行重新排序
    ranked_results = rerank_by_relevance(query, combined_results)
    # 4. 构建上下文：从排序后的文档中构建上下文
    context = build_context_from_docs(ranked_results)
    # 5. 生成：调用语言模型，使用上下文生成回答
    response = language_model.generate_with_context(query, context)
    return response


# ── 变体四：多步 RAG（查询分解）─────────────────────────────
def multi_step_rag(query, knowledge_base):
    # 1. 查询分解：将原始查询分解成多个子查询
    sub_queries = query_decomposer.decompose(query)
    all_contexts = []
    # 2. 检索：为每个子查询检索相关信息
    for sub_query in sub_queries:
        sub_results = knowledge_base.search(sub_query)
        all_contexts.append(build_context(sub_results))
    # 3. 合并上下文：整合所有子查询检索到的信息
    combined_context = integrate_contexts(all_contexts)
    # 4. 生成：调用语言模型，使用整合后的上下文生成回答
    response = language_model.generate(query, combined_context)
    return response


# ── 变体五：迭代 RAG（识别信息缺口，按需补充检索）─────────────
def iterative_rag(query, knowledge_base, max_iterations=3):
    current_answer = ""
    for i in range(max_iterations):
        # 1. 识别信息缺口：根据当前答案判断还需要哪些信息
        if i == 0:
            info_needs = initial_info_needs(query)
        else:
            info_needs = identify_gaps(query, current_answer)
        # 如果没有信息缺口，结束迭代
        if not info_needs:
            break
        # 2. 检索：根据信息缺口检索额外信息
        additional_info = knowledge_base.search(info_needs)
        # 3. 更新答案：结合新信息，细化和完善当前答案
        current_answer = refine_answer(query, current_answer, additional_info)
    return current_answer
