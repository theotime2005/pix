import { CampaignTypes } from '../../../shared/domain/constants.js';

class CampaignToStartParticipation {
  constructor({
    id,
    idPixLabel,
    archivedAt,
    type,
    isManagingStudents,
    hasLearnersImportFeature,
    multipleSendings,
    assessmentMethod,
    skillCount,
    organizationId,
    deletedAt,
  } = {}) {
    this.id = id;
    this.type = type;
    this.idPixLabel = idPixLabel;
    this.archivedAt = archivedAt;
    this.multipleSendings = multipleSendings;
    this.assessmentMethod = assessmentMethod;
    this.skillCount = skillCount;
    this.organizationId = organizationId;
    this.deletedAt = deletedAt;
    this.isRestricted = isManagingStudents || hasLearnersImportFeature;
  }

  get isAssessment() {
    return this.type === CampaignTypes.ASSESSMENT;
  }

  get isArchived() {
    return Boolean(this.archivedAt);
  }

  get isDeleted() {
    return Boolean(this.deletedAt);
  }
}

export { CampaignToStartParticipation };
