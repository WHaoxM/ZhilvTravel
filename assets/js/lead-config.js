/*
 * 文数智旅留资提交公开配置（不包含任何密钥）。
 * 生产环境建议在构建时通过 WENSHU_LEAD_ENDPOINT 或 lead.config.json 生成 dist/assets/js/lead-config.js。
 * 如果目标 CRM 需要鉴权，请配置到自有 webhook / serverless 代理，不要把密钥写入浏览器端配置。
 */
window.WENSHU_LEAD_CONFIG = window.WENSHU_LEAD_CONFIG || {
  target: "webhook",
  endpoint: "https://www.xuntingtravel.com/api/wenshu?action=lead",
  method: "POST",
  timeoutMs: 10000,
  headers: {},
  fieldMap: {
    source: "source",
    phone: "phone",
    name: "name",
    company: "company",
      companyAddress: "company_address",
    language: "language",
    businessType: "business_type",
    pageTitle: "page_title",
    pageUrl: "page_url",
    referrer: "referrer",
    userAgent: "user_agent",
    submittedAt: "submitted_at"
  },
  extra: {}
};
