import { PROFILE_TYPES, USER_ROLES } from '../../utils/constants';

export function toIsoString(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

export function objectFromFirestore(id, data) {
  return {
    id: data.code ?? id,
    name: data.title ?? '',
    category: data.category ?? '',
    description: data.description ?? '',
    location: data.locationFound ?? '',
    foundDate: data.dateFound ?? '',
    notes: data.notes ?? '',
    status: data.status,
    registeredBy: data.createdBy ?? null,
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(data.updatedAt) ?? toIsoString(data.createdAt) ?? new Date().toISOString(),
    reviewedBy: data.reviewedBy ?? null,
    reviewedAt: toIsoString(data.reviewedAt),
    activeClaimId: data.activeClaimId ?? null,
  };
}

export function objectToFirestore(values, { code, createdBy, status, timestamp }) {
  return {
    code,
    title: values.name,
    category: values.category,
    description: values.description,
    locationFound: values.location,
    dateFound: values.foundDate,
    notes: values.notes ?? '',
    status,
    createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    reviewedBy: null,
    reviewedAt: null,
    activeClaimId: null,
  };
}

export function claimFromFirestore(id, data) {
  return {
    id,
    objectId: data.objectId,
    objectCode: data.objectCode ?? data.objectId,
    requesterId: data.requesterId,
    message: data.message ?? '',
    additionalInfo: data.additionalInfo ?? '',
    status: data.status,
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(data.updatedAt) ?? toIsoString(data.createdAt) ?? new Date().toISOString(),
    reviewedBy: data.reviewedBy ?? null,
    reviewedAt: toIsoString(data.reviewedAt),
  };
}

export function claimToFirestore(values, { objectId, requesterId, timestamp }) {
  return {
    objectId,
    objectCode: objectId,
    requesterId,
    message: values.message,
    additionalInfo: values.additionalInfo ?? '',
    status: values.status,
    createdAt: timestamp,
    updatedAt: timestamp,
    reviewedBy: null,
    reviewedAt: null,
  };
}

export function auditLogFromFirestore(id, data) {
  return {
    id,
    type: data.type,
    targetType: data.targetType,
    targetId: data.targetId,
    actorId: data.actorId,
    actorRole: data.actorRole,
    details: data.details ?? {},
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
  };
}

export function userProfileToFirestore({ uid, displayName, email, profileType, timestamp }) {
  return {
    uid,
    displayName,
    email,
    profileType,
    role: USER_ROLES.user,
    createdAt: timestamp,
    active: true,
  };
}

export function toDomainUser(authUser, profile) {
  if (!authUser) return null;

  return {
    id: authUser.uid,
    name: profile?.displayName || authUser.displayName || authUser.email || 'Usuário',
    email: authUser.email ?? profile?.email ?? '',
    role: profile?.role === USER_ROLES.admin ? USER_ROLES.admin : USER_ROLES.user,
    profileType: profile?.profileType ?? PROFILE_TYPES.notInformed,
    active: profile ? profile.active !== false : true,
    hasProfile: Boolean(profile),
  };
}
