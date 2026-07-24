import { describe, expect, it } from "vitest";
import { buildExploreResources, EXPLORE_RESOURCE_DEFINITIONS, getVisibleExploreResources, type ExploreResourceCounts } from "./exploreResourcesModel";

const emptyProgress = (): ExploreResourceCounts => Object.fromEntries(EXPLORE_RESOURCE_DEFINITIONS.map(({ id }) => [id, false])) as ExploreResourceCounts;

describe("explore resources", () => {
  it("keeps only four resources visible and advances the window as resources are completed", () => {
    const progress = emptyProgress();
    let resources = buildExploreResources(progress);
    expect(getVisibleExploreResources(resources).map((resource) => resource.id)).toEqual(EXPLORE_RESOURCE_DEFINITIONS.slice(0, 4).map((resource) => resource.id));

    for (const id of EXPLORE_RESOURCE_DEFINITIONS.slice(0, 4).map((resource) => resource.id)) progress[id] = true;
    resources = buildExploreResources(progress);
    expect(getVisibleExploreResources(resources)).toHaveLength(4);
    expect(getVisibleExploreResources(resources).at(-1)?.id).toBe(EXPLORE_RESOURCE_DEFINITIONS[4].id);
  });

  it("preserves the configured order and completion state", () => {
    const progress = emptyProgress();
    progress["lesson-plan"] = true;
    const resources = buildExploreResources(progress);
    expect(resources).toHaveLength(EXPLORE_RESOURCE_DEFINITIONS.length);
    expect(resources.find((resource) => resource.id === "lesson-plan")?.completed).toBe(true);
  });
});
