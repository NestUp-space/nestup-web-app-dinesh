/**
 * Smart Cut Sequence Algorithm
 *
 * Generates a damage-minimizing cutting order for planks on a CNC sheet.
 * Strategy: cut smaller/edge pieces first to maintain structural support,
 * bottom-to-top progression, never isolate unsupported pieces.
 */

interface PlankRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const EDGE_TOLERANCE = 2; // mm – how close to sheet edge counts as "touching"
const ADJACENCY_TOLERANCE = 3; // mm – gap between planks to count as neighbors

export function generateSmartCutSequence(
  planks: PlankRect[],
  sheetWidth: number,
  sheetHeight: number,
): Map<string, number> {
  if (planks.length === 0) return new Map();
  if (planks.length === 1) return new Map([[planks[0].id, 1]]);

  const remaining = new Set(planks.map(p => p.id));
  const plankMap = new Map(planks.map(p => [p.id, p]));
  const adjacency = buildAdjacencyGraph(planks);
  const sequence = new Map<string, number>();
  let order = 1;

  while (remaining.size > 0) {
    let bestId: string | null = null;
    let bestScore = -Infinity;

    Array.from(remaining).forEach(id => {
      const score = scorePlankForRemoval(
        id,
        plankMap,
        remaining,
        adjacency,
        sheetWidth,
        sheetHeight,
      );
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    });

    if (!bestId) {
      let minArea = Infinity;
      Array.from(remaining).forEach(id => {
        const p = plankMap.get(id)!;
        const area = p.width * p.height;
        if (area < minArea) { minArea = area; bestId = id; }
      });
    }

    sequence.set(bestId!, order++);
    remaining.delete(bestId!);
  }

  return sequence;
}

function buildAdjacencyGraph(planks: PlankRect[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const p of planks) adj.set(p.id, new Set());

  for (let i = 0; i < planks.length; i++) {
    for (let j = i + 1; j < planks.length; j++) {
      if (areAdjacent(planks[i], planks[j])) {
        adj.get(planks[i].id)!.add(planks[j].id);
        adj.get(planks[j].id)!.add(planks[i].id);
      }
    }
  }
  return adj;
}

function areAdjacent(a: PlankRect, b: PlankRect): boolean {
  const overlapX = a.x < b.x + b.width + ADJACENCY_TOLERANCE &&
                   a.x + a.width + ADJACENCY_TOLERANCE > b.x;
  const overlapY = a.y < b.y + b.height + ADJACENCY_TOLERANCE &&
                   a.y + a.height + ADJACENCY_TOLERANCE > b.y;

  if (!overlapX || !overlapY) return false;

  const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));

  return (gapX <= ADJACENCY_TOLERANCE && gapY === 0) ||
         (gapY <= ADJACENCY_TOLERANCE && gapX === 0);
}

function scorePlankForRemoval(
  id: string,
  plankMap: Map<string, PlankRect>,
  remaining: Set<string>,
  adjacency: Map<string, Set<string>>,
  sheetWidth: number,
  sheetHeight: number,
): number {
  const p = plankMap.get(id)!;
  const area = p.width * p.height;
  const maxArea = sheetWidth * sheetHeight;

  // 1. Edge proximity – planks touching sheet edges are safer (supported by bed clamps)
  let edgeCount = 0;
  if (p.x <= EDGE_TOLERANCE) edgeCount++;
  if (p.y <= EDGE_TOLERANCE) edgeCount++;
  if (p.x + p.width >= sheetWidth - EDGE_TOLERANCE) edgeCount++;
  if (p.y + p.height >= sheetHeight - EDGE_TOLERANCE) edgeCount++;
  const edgeScore = edgeCount * 25;

  // 2. Size – smaller pieces first (less stress on remaining material)
  const sizeScore = (1 - area / maxArea) * 30;

  // 3. Support contribution – planks supporting fewer remaining neighbors are safer to remove
  const neighbors = adjacency.get(id) || new Set<string>();
  let remainingNeighborCount = 0;
  Array.from(neighbors).forEach(nid => {
    if (remaining.has(nid)) remainingNeighborCount++;
  });
  const supportScore = Math.max(0, 20 - remainingNeighborCount * 5);

  // 4. Direction bias – prefer bottom-to-top (lower Y first), left-to-right
  const yBias = (1 - p.y / sheetHeight) * 15;
  const xBias = (1 - p.x / sheetWidth) * 5;

  // 5. Island prevention – if removing this plank would isolate a group, penalize
  const islandPenalty = wouldCreateIsland(id, remaining, adjacency) ? -40 : 0;

  return edgeScore + sizeScore + supportScore + yBias + xBias + islandPenalty;
}

/**
 * Check if removing `targetId` from `remaining` would split the remaining planks
 * into disconnected groups (islands). Uses BFS on the adjacency graph.
 */
function wouldCreateIsland(
  targetId: string,
  remaining: Set<string>,
  adjacency: Map<string, Set<string>>,
): boolean {
  if (remaining.size <= 2) return false;

  const withoutTarget = new Set(Array.from(remaining));
  withoutTarget.delete(targetId);

  const arr = Array.from(withoutTarget);
  const start = arr.length > 0 ? arr[0] : undefined;
  if (!start) return false;

  const visited = new Set<string>();
  const queue: string[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    Array.from(neighbors).forEach(nid => {
      if (withoutTarget.has(nid) && !visited.has(nid)) {
        visited.add(nid);
        queue.push(nid);
      }
    });
  }

  return visited.size < withoutTarget.size;
}
