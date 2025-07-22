import { CombinedCourseParticipationStatuses } from '../../../prescription/shared/domain/constants.js';

export class CombinedCourse {
  constructor({ id, code, organizationId, name }) {
    this.id = id;
    this.code = code;
    this.organizationId = organizationId;
    this.name = name;
    this.status = CombinedCourseParticipationStatuses.NOT_STARTED;
  }
}
