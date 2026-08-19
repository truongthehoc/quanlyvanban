export type RoleCode = 'ADMIN' | 'LEADER' | 'CLERK' | 'HEAD_DEPT' | 'OFFICER';

export type DocumentTypeDoc = 'INCOMING' | 'OUTGOING' | 'INTERNAL';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'TOP_URGENT';
export type ConfidentialityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export type DocumentStatus = 
  | 'DRAFT'
  | 'PENDING_DIRECTIVE'
  | 'DIRECTED'
  | 'PROCESSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'ARCHIVED';

export type AssigneeRoleType = 'PRIMARY' | 'COORDINATE' | 'OBSERVE';
export type AssigneeStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export type ScopeType = 'ALL' | 'DEPARTMENT' | 'USER';

export interface UserDTO {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  position: string;
  departmentId?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  roles: RoleCode[];
  avatar?: string | null;
}

export interface DepartmentDTO {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  userCount?: number;
}

export interface DocumentTypeDTO {
  id: string;
  code: string;
  name: string;
  numberingPattern: string;
  defaultBookId?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface DocumentBookDTO {
  id: string;
  code: string;
  name: string;
  type: DocumentTypeDoc;
  year: number;
  currentNumber: number;
  isActive: boolean;
}

export interface DocumentAssigneeDTO {
  id: string;
  documentId: string;
  departmentId?: string | null;
  departmentName?: string | null;
  userId?: string | null;
  userName?: string | null;
  roleType: AssigneeRoleType;
  status: AssigneeStatus;
  notes?: string | null;
  completedAt?: string | null;
}

export interface DocumentProcessingLogDTO {
  id: string;
  documentId: string;
  actorId: string;
  actorName: string;
  actorPosition?: string;
  action: string;
  notes?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
}

export interface DocumentDTO {
  id: string;
  documentNumber?: string | null;
  autoSequence?: number | null;
  subNumber?: string | null;
  documentTypeDoc: DocumentTypeDoc;
  title: string;
  summary?: string | null;
  senderOrg?: string | null;
  recipientOrg?: string | null;
  issueDate?: string | null;
  arrivalDate?: string | null;
  dueDate?: string | null;
  urgencyLevel: UrgencyLevel;
  confidentialityLevel: ConfidentialityLevel;
  status: DocumentStatus;
  leaderDirective?: string | null;
  leaderId?: string | null;
  leaderName?: string | null;
  clerkId?: string | null;
  clerkName?: string | null;
  creatorId: string;
  creatorName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  documentTypeId?: string | null;
  documentTypeName?: string | null;
  bookId?: string | null;
  bookName?: string | null;
  dispatchMethod?: string | null;
  dispatchStatus?: string | null;
  dispatchDate?: string | null;
  assignees?: DocumentAssigneeDTO[];
  processingLogs?: DocumentProcessingLogDTO[];
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  internalAudiences?: {
    id: string;
    scopeType: ScopeType;
    departmentId?: string | null;
    departmentName?: string | null;
    isRead: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDTO {
  id: string;
  module: string;
  action: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface RoleMatrixDTO {
  role: {
    id: string;
    code: RoleCode;
    name: string;
    description?: string | null;
  };
  permissionCodes: string[];
}
