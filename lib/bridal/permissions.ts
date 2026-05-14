type BridalOwnedResource = {
  sessionId?: string | null;
  userId?: string | null;
};

type CanAccessBridalResourceParams = {
  currentUserId?: string | null;
  sessionId?: string | null;
  resource: BridalOwnedResource | null | undefined;
};

export function canAccessBridalResource({
  currentUserId,
  sessionId,
  resource,
}: CanAccessBridalResourceParams) {
  if (!resource) {
    return false;
  }

  if (currentUserId && resource.userId === currentUserId) {
    return true;
  }

  return Boolean(sessionId && resource.sessionId === sessionId);
}

export function assertBridalOwner(params: CanAccessBridalResourceParams) {
  if (!canAccessBridalResource(params)) {
    throw new Error("Forbidden");
  }
}

