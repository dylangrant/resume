// Walk the resume JSON tree and extract editable/reorderable nodes
// Input: job context from Split Out node; resume data via data property or raw tree
// Outputs: editableNodes, reorderableIds (side-channel for Merge), rawTree

const jobContext = $input.item.json;

const {
  id,
  name,
  property_role_title,
  property_job_summary,
  property_insights_summary,
  data,
} = jobContext;

// Handle raw input array or encapsulated data properties from Extract from File
const rawTree = data ?? jobContext;
const resumeTree = rawTree?.body ?? [];

// reorderableIds is a side-channel so Merge can tell reorderable nodes apart
// from text nodes without sending that bookkeeping to the model.
const reorderableIds = new Set();

function extractEditable(nodes, parentContext) {
  const result = [];

  for (const node of nodes ?? []) {
    if (!node) continue;

    const context = node.context ?? parentContext;
    const isReorderable = !!node?.reorderable;
    const isEditable = !!node?.editable;
    const hasReorderableChildren = !!node?.hasReorderable;

    if (hasReorderableChildren || isReorderable || isEditable) {
      if (hasReorderableChildren) {
        reorderableIds.add(node.id);
        result.push({
          id: node.id,
          children: extractEditable(node.children ?? [], context)
        });
      } else if (node.children?.length) {
        const textChild = node.children.find(child => child?.text !== undefined);
        if (textChild) {
          result.push({ id: node.id, text: textChild.text });
        } else {
          result.push({ id: node.id, children: extractEditable(node.children, context) });
        }
      }
    } else if (node.children?.length) {
      result.push(...extractEditable(node.children, context));
    }
  }

  return result;
}

const editableNodes = extractEditable(resumeTree);

if (editableNodes.length === 0) {
  throw new Error(`Filter Editable Nodes: got 0 editable nodes. rawTree keys: ${Object.keys(rawTree).join(", ")}`);
}

return {
  json: {
    editableNodes,
    reorderableIds: Array.from(reorderableIds),
    rawTree,
    id,
    name,
    property_role_title,
    property_job_summary,
    property_insights_summary
  }
};
