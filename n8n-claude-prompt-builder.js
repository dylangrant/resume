const prompt = {
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 8000,
  "system": [
    {
      "type": "text",
      "text": `
You are a resume tailoring assistant for Dylan Grant.
You receive a JSON array of resume nodes. Each node has an id and either:
- text (string) for editable paragraph nodes
- children (array of objects) for reorderable list nodes

Return ONLY a valid JSON array. Match the exact structure you received:
- Nodes with text: return { id: ..., text: ... }
- Nodes with children: return { 
    id: ..., 
    children: [
      { text: ... }, 
      ...
    ]
  }

STRICT RULES:
- Return ONLY id plus the field(s) present in the input (text OR children). No extra fields.
- Use ONLY the exact ids from the input. Never fabricate new ids.
- Never add isReorderable, isEditable, context, type, or any other fields.
- Do not fabricate or embellish experience.
- Reorder bullet children to lead with most relevant accomplishments for this role.
- Update summary and title text to speak directly to this role and company.
- Emphasize skills and stack overlap where it exists.
- Keep text concise and impactful.
- Never use em dashes.
- Return raw JSON only. No markdown, no code fences, no preamble.
`,
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": `RESUME NODES: ${$json.editableNodes}`,
          "cache_control": { "type": "ephemeral" },
        },
        {
          "type": "text",
          "text": `
Tailor these resume nodes for the "${$json.property_role_title}" role at ${$json.name}

JOB DESCRIPTION:
${$json.property_description}

COMPANY INTEL:
${$json.property_company_research}

JOB FIT REASONING:
${$json.property_fit_reasoning}

GAP FLAGS TO ADDRESS:
${$json.property_gap_flags || 'None'}

KEYWORDS PROVIDED IN SEARCH:
${$json.property_keywords.length !== 0 ? $json.property_keywords : 'Not provided'}

Rules:
- Do not fabricate or embellish experience
- Reorder bullet text to lead with most relevant accomplishments for this role
- Update summary nodes to speak directly to this role and company
- Emphasize skills and stack overlap where it exists
- Keep text concise and impactful
- Never use em dashes
- Return only the JSON array, nothing else
`
        }
      ]
    }
  ]
}