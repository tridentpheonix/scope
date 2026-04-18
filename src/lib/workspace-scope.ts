export function assertWorkspaceOwnership(
  resourceName: string,
  expectedWorkspaceId: string,
  actualWorkspaceId: string | null | undefined,
) {
  if (actualWorkspaceId && actualWorkspaceId !== expectedWorkspaceId) {
    throw new Error(`${resourceName} belongs to a different workspace.`);
  }
}
