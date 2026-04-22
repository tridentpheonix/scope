import type { MongoBackupManifest } from "./mongo-backup";

export type MongoDrillMismatch = {
  name: string;
  sourceCount: number;
  targetCount: number;
};

export type MongoDrillComparison = {
  matches: boolean;
  missingCollections: string[];
  extraCollections: string[];
  mismatchedCollections: MongoDrillMismatch[];
};

function toCollectionCountMap(manifest: MongoBackupManifest) {
  return new Map(manifest.collections.map((collection) => [collection.name, collection.documentCount] as const));
}

export function compareMongoBackupManifests(
  source: MongoBackupManifest,
  target: MongoBackupManifest,
): MongoDrillComparison {
  const sourceCounts = toCollectionCountMap(source);
  const targetCounts = toCollectionCountMap(target);

  const missingCollections = source.collections
    .map((collection) => collection.name)
    .filter((name) => !targetCounts.has(name));

  const extraCollections = target.collections
    .map((collection) => collection.name)
    .filter((name) => !sourceCounts.has(name));

  const mismatchedCollections = source.collections
    .filter((collection) => targetCounts.has(collection.name))
    .flatMap((collection) => {
      const targetCount = targetCounts.get(collection.name) ?? 0;
      return targetCount === collection.documentCount
        ? []
        : [
            {
              name: collection.name,
              sourceCount: collection.documentCount,
              targetCount,
            },
          ];
    });

  return {
    matches: missingCollections.length === 0 && extraCollections.length === 0 && mismatchedCollections.length === 0,
    missingCollections,
    extraCollections,
    mismatchedCollections,
  };
}
