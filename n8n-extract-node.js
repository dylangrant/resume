// Walk the resume JSON tree and extract editable/reorderable nodes
// Input: either raw array from GitHub, or { data: [...] } object from app
// Job context comes from the Split Out node

const rawInput = $input.first().json;

// Handle both { data: [...] } and raw array
const resumeTree = Array.isArray(rawInput) ? rawInput : rawInput?.data ?? [];

const {
  id,
  name,
  property_role_title,
  property_description,
  property_company_research,
  property_fit_reasoning,
  property_gap_flags,
  property_keywords,
} = rawInput;

function extractEditable(nodes, parentContext) {
  const result = [];

  for (const node of nodes ?? []) {
    if (!node) continue;

    const context = node.context ?? parentContext;
    const isReorderable = !!node?.reorderable;
    const isEditable = !!node?.editable;
    const hasReorderableChildren = !!node?.hasReorderable;

    if (hasReorderableChildren || isReorderable || isEditable) {
      const entry = {
        id: node.id,
        isReorderable,
        isEditable,
        type: node.type,
        ...(context !== undefined && { context }),
      };

      if (hasReorderableChildren) {
        entry.children = extractEditable(node.children ?? [], context);
      } else if (node.children?.length) {
        const textChild = node.children.find(child => child?.text !== undefined);
        if (textChild) {
          entry.text = textChild.text;
        } else {
          entry.children = extractEditable(node.children, context);
        }
      }

      result.push(entry);
    } else if (node.children?.length) {
      result.push(...extractEditable(node.children, context));
    }
  }

  return result;
}

const editableNodes = extractEditable(resumeTree);

return [{
  json: {
    editableNodes,
    resumeTree,
    id,
    name,
    property_role_title,
    property_description,
    property_company_research,
    property_fit_reasoning,
    property_gap_flags,
    property_keywords,
  }
}];