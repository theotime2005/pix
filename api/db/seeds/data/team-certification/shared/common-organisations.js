import { CenterTypes } from '../../../../../src/certification/enrolment/domain/models/CenterTypes.js';
import { OrganizationForAdmin } from '../../../../../src/organizational-entities/domain/models/OrganizationForAdmin.js';
import { usecases as organizationalEntitiesUsecases } from '../../../../../src/organizational-entities/domain/usecases/index.js';
import * as organizationCreationValidator from '../../../../../src/organizational-entities/domain/validators/organization-creation-validator.js';
import { Membership } from '../../../../../src/shared/domain/models/Membership.js';
import { LANGUAGES_CODE } from '../../../../../src/shared/domain/services/language-service.js';
import { usecases as teamUsecases } from '../../../../../src/team/domain/usecases/index.js';
import { acceptPixOrgaTermsOfService } from '../../common/tooling/legal-documents.js';
import { SHARED_ORGANIZATION_EXTERNAL_ID, SHARED_ORGANIZATION_USER_ID } from './constants.js';

/**
 * Default Certification organizations
 */
export class CommonOrganizations {
  organization;
  organizationMember;
  organizationMembership;

  constructor({ databaseBuilder }) {
    this.databaseBuilder = databaseBuilder;
  }

  static async getPro({ databaseBuilder }) {
    if (!this.instance) {
      this.instance = await new CommonOrganizations({ databaseBuilder }).#init();
    }

    return this.instance;
  }

  async #init() {
    this.organizationMember = this.databaseBuilder.factory.buildUser.withRawPassword({
      id: SHARED_ORGANIZATION_USER_ID,
      firstName: 'Certif',
      lastName: 'Pix Orga member',
      email: 'certif-prescriptor@example.net',
      cgu: true,
      lang: LANGUAGES_CODE.FRENCH,
      lastTermsOfServiceValidatedAt: new Date(),
      mustValidateTermsOfService: false,
      pixCertifTermsOfServiceAccepted: true,
    });

    acceptPixOrgaTermsOfService(this.databaseBuilder, this.organizationMember.id);

    await this.databaseBuilder.commit();

    // Organization
    const organization = new OrganizationForAdmin({
      name: 'Certification PRO organization',
      type: CenterTypes.PRO,
      isManagingStudents: false,
      externalId: SHARED_ORGANIZATION_EXTERNAL_ID,
    });

    this.organization = await organizationalEntitiesUsecases.createOrganization({
      organization,
      organizationCreationValidator,
    });

    this.organizationMembership = await teamUsecases.createMembership({
      organizationRole: Membership.roles.ADMIN,
      userId: this.organizationMember.id,
      organizationId: this.organization.id,
    });

    return this;
  }
}
