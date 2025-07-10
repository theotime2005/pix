import dayjs from 'dayjs';

import { generateCertificateVerificationCode } from '../../../../../src/certification/evaluation/domain/services/verify-certificate-code-service.js';
import { AlgorithmEngineVersion } from '../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { Assessment } from '../../../../../src/shared/domain/models/index.js';
import { AssessmentResult, Membership } from '../../../../../src/shared/domain/models/index.js';
import {
  createServer,
  databaseBuilder,
  expect,
  generateAuthenticatedUserRequestHeaders,
  insertUserWithRoleSuperAdmin,
  learningContentBuilder,
  mockLearningContent,
} from '../../../../test-helper.js';

describe('Certification | Results | Acceptance | Application | Routes | certification-attestation', function () {
  beforeEach(async function () {
    const learningContent = [
      {
        id: 'recvoGdo7z2z7pXWa',
        frameworkId: 'Pix',
        code: '1',
        name: '1. Information et données',
        title_i18n: { fr: 'Information et données' },
        color: 'jaffa',
        competences: [
          {
            id: 'Pix',
            name_i18n: { fr: 'Mener une recherche et une veille d’information' },
            index: '1.1',
            tubes: [
              {
                id: 'recTube1',
                skills: [
                  {
                    id: 'recSkillId1',
                    challenges: [
                      { id: 'rec02tVrimXNkgaLD1' },
                      { id: 'rec0gm0GFue3PQB3k1' },
                      { id: 'rec0hoSlSwCeNNLkq1' },
                      { id: 'rec2FcZ4jsPuY1QYt1' },
                      { id: 'rec39bDMnaVw3MyMR1' },
                      { id: 'rec3FMoD8h9USTktb1' },
                      { id: 'rec3P7fvPSpFkIFLV1' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'recNv8qhaY887jQb2',
            frameworkId: 'Pix',
            name_i18n: { fr: 'Gérer des données' },
            index: '1.2',
            tubes: [
              {
                id: 'recTube2',
                skills: [
                  {
                    id: 'recSkillId2',
                    challenges: [
                      { id: 'rec02tVrimXNkgaLD2' },
                      { id: 'rec0gm0GFue3PQB3k2' },
                      { id: 'rec0hoSlSwCeNNLkq2' },
                      { id: 'rec2FcZ4jsPuY1QYt2' },
                      { id: 'rec39bDMnaVw3MyMR2' },
                      { id: 'rec3FMoD8h9USTktb2' },
                      { id: 'rec3P7fvPSpFkIFLV2' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'recIkYm646lrGvLNT',
            frameworkId: 'Pix',
            name_i18n: { fr: 'Traiter des données' },
            index: '1.3',
            tubes: [
              {
                id: 'recTube3',
                skills: [
                  {
                    id: 'recSkillId3',
                    challenges: [
                      { id: 'rec02tVrimXNkgaLD3' },
                      { id: 'rec0gm0GFue3PQB3k3' },
                      { id: 'rec0hoSlSwCeNNLkq3' },
                      { id: 'rec2FcZ4jsPuY1QYt3' },
                      { id: 'rec39bDMnaVw3MyMR3' },
                      { id: 'rec3FMoD8h9USTktb3' },
                      { id: 'rec3P7fvPSpFkIFLV3' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'recoB4JYOBS1PCxhh',
        frameworkId: 'Pix',
        code: '2',
        name: '2. Communication et collaboration',
        competences: [
          {
            id: 'recDH19F7kKrfL3Ii',
            name_i18n: { fr: 'Interagir' },
            index: '2.1',
          },
          {
            id: 'recgxqQfz3BqEbtzh',
            name_i18n: { fr: 'Partager et publier' },
            index: '2.2',
          },
          {
            id: 'recMiZPNl7V1hyE1d',
            name_i18n: { fr: 'Collaborer' },
            index: '2.3',
          },
          {
            id: 'recFpYXCKcyhLI3Nu',
            name_i18n: { fr: "S'insérer" },
            index: '2.4',
          },
        ],
      },
      {
        id: 'recOdC9UDVJbAXHAm',
        frameworkId: 'Pix',
        code: '3',
        name: '3. Création de contenu',
        competences: [
          {
            id: 'recOdC9UDVJbAXHAm',
            name_i18n: { fr: 'Dev des docs' },
            index: '3.1',
          },
          {
            id: 'recbDTF8KwupqkeZ6',
            name_i18n: { fr: 'Dev des docs mult' },
            index: '3.2',
          },
          {
            id: 'recHmIWG6D0huq6Kx',
            name_i18n: { fr: 'Adapt' },
            index: '3.3',
          },
          {
            id: 'rece6jYwH4WEw549z',
            name_i18n: { fr: 'Programmer' },
            index: '3.4',
          },
        ],
      },
      {
        id: 'recUcSnS2lsOhFIeE',
        frameworkId: 'Pix',
        code: '4',
        name: '4. Protection et sécurité',
        competences: [
          {
            id: 'rec6rHqas39zvLZep',
            name_i18n: { fr: 'Dev des docs' },
            index: '4.1',
          },
          {
            id: 'recofJCxg0NqTqTdP',
            name_i18n: { fr: 'Dev des docs mult' },
            index: '4.2',
          },
          {
            id: 'recfr0ax8XrfvJ3ER',
            name_i18n: { fr: 'Adapt' },
            index: '4.3',
          },
        ],
      },
      {
        id: 'recnrCmBiPXGbgIyQ',
        frameworkId: 'Pix',
        code: '5',
        name: '5. Environnement numérique',
        competences: [
          {
            id: 'recIhdrmCuEmCDAzj',
            name_i18n: { fr: 'Dev des docs' },
            index: '5.1',
          },
          {
            id: 'recudHE5Omrr10qrx',
            name_i18n: { fr: 'Dev des docs mult' },
            index: '5.2',
          },
        ],
      },
    ];

    const learningContentObjects = learningContentBuilder.fromAreas(learningContent);
    await mockLearningContent(learningContentObjects);
  });

  describe('GET /api/attestation/{certificationCourseId}', function () {
    context('when user own the certification', function () {
      context('when session version is V3', function () {
        it('should return 200 HTTP status code and the certification', async function () {
          // given
          const userId = databaseBuilder.factory.buildUser().id;

          const session = databaseBuilder.factory.buildSession({
            id: 123,
            publishedAt: new Date('2018-12-01T01:02:03Z'),
            version: AlgorithmEngineVersion.V3,
          });
          const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
            id: 1234,
            sessionId: session.id,
            userId,
            isPublished: true,
            verificationCode: await generateCertificateVerificationCode(),
          });
          const assessment = databaseBuilder.factory.buildAssessment({
            userId,
            certificationCourseId: certificationCourse.id,
            type: Assessment.types.CERTIFICATION,
            state: Assessment.states.COMPLETED,
          });
          databaseBuilder.factory.buildAssessmentResult.last({
            certificationCourseId: certificationCourse.id,
            assessmentId: assessment.id,
            level: 1,
            pixScore: 23,
            status: AssessmentResult.status.VALIDATED,
          });

          await databaseBuilder.commit();

          const server = await createServer();

          // when
          const response = await server.inject({
            method: 'GET',
            url: `/api/attestation/${certificationCourse.id}?isFrenchDomainExtension=true&lang=fr`,
            headers: generateAuthenticatedUserRequestHeaders({ userId }),
          });

          // then
          expect(response.statusCode).to.equal(200);
          expect(response.headers['content-type']).to.equal('application/pdf');

          const filename = `filename=certification-pix-20181201.pdf`;
          expect(response.headers['content-disposition']).to.include(filename);

          const fileFormat = response.result.substring(1, 4);
          expect(fileFormat).to.equal('PDF');
        });
      });
    });

    context('when session version is V2', function () {
      it('should return 200 HTTP status code and the certification', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser().id;
        await _buildDatabaseCertification({ userId, certificationCourseId: 1234 });
        await databaseBuilder.commit();

        const server = await createServer();

        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/attestation/1234?isFrenchDomainExtension=true&lang=fr',
          headers: generateAuthenticatedUserRequestHeaders({ userId }),
        });

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal('application/pdf');
        expect(response.headers['content-disposition']).to.include('filename=certification-pix');
        expect(response.file).not.to.be.null;
      });
    });
  });

  describe('GET /api/admin/sessions/{sessionId}/attestations', function () {
    context('when the session version is V2', function () {
      it('should return 200 HTTP status code and the certification', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();
        const { session } = await _buildDatabaseCertification({ userId: superAdmin.id, sessionId: 4567 });
        await databaseBuilder.commit();

        const server = await createServer();

        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/admin/sessions/4567/attestations',
          headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        });

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal('application/pdf');
        expect(response.headers['content-disposition']).to.equal(
          `attachment; filename=session-${session.id}-certification-pix-${dayjs(session.publishedAt).format('YYYYMMDD')}.pdf`,
        );
        expect(response.file).not.to.be.null;
      });
    });

    context('when the session version is V3', function () {
      it('should return 200 HTTP status code and the certification', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();

        const sessionId = 4567;

        const { session } = await _buildDatabaseCertification({
          userId: superAdmin.id,
          sessionId,
          sessionVersion: AlgorithmEngineVersion.V3,
        });
        await databaseBuilder.commit();

        const server = await createServer();

        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/admin/sessions/4567/attestations',
          headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        });

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal('application/pdf');
        expect(response.headers['content-disposition']).to.equal(
          `attachment; filename=session-${sessionId}-certification-pix-${dayjs(session.publishedAt).format('YYYYMMDD')}.pdf`,
        );
        expect(response.file).not.to.be.null;
      });
    });
  });

  describe('GET /api/organizations/{organizationId}/certification-attestations', function () {
    context('when the session version is V2', function () {
      it('should return HTTP status 200 and a PDF', async function () {
        // given
        const adminIsManagingStudent = databaseBuilder.factory.buildUser.withRawPassword();

        const organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
        databaseBuilder.factory.buildMembership({
          organizationId: organization.id,
          userId: adminIsManagingStudent.id,
          organizationRole: Membership.roles.ADMIN,
        });

        const student = databaseBuilder.factory.buildUser.withRawPassword();
        const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          division: 'aDivision',
          userId: student.id,
        });

        const candidate = databaseBuilder.factory.buildCertificationCandidate({
          organizationLearnerId: organizationLearner.id,
          userId: student.id,
        });
        databaseBuilder.factory.buildCoreSubscription({ certificationCandidateId: candidate.id });

        const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
          userId: candidate.userId,
          sessionId: candidate.sessionId,
          isPublished: true,
        });

        databaseBuilder.factory.buildBadge({ key: 'a badge' });

        const assessment = databaseBuilder.factory.buildAssessment({
          userId: candidate.userId,
          certificationCourseId: certificationCourse.id,
          type: Assessment.types.CERTIFICATION,
          state: 'completed',
        });

        const assessmentResult = databaseBuilder.factory.buildAssessmentResult.last({
          certificationCourseId: certificationCourse.id,
          assessmentId: assessment.id,
          status: AssessmentResult.status.VALIDATED,
        });
        databaseBuilder.factory.buildCompetenceMark({
          level: 3,
          score: 23,
          area_code: '1',
          competence_code: '1.3',
          assessmentResultId: assessmentResult.id,
        });

        await databaseBuilder.commit();

        const server = await createServer();

        const options = {
          method: 'GET',
          url: `/api/organizations/${organization.id}/certification-attestations?division=aDivision&isFrenchDomainExtension=true&lang=fr`,
          headers: generateAuthenticatedUserRequestHeaders({ userId: adminIsManagingStudent.id }),
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal('application/pdf');
        expect(response.headers['content-disposition']).to.include(`_attestations_${organizationLearner.division}`);
      });
    });

    context('when the session version is V3', function () {
      it('should return HTTP status 200', async function () {
        // given
        const adminIsManagingStudent = databaseBuilder.factory.buildUser.withRawPassword();

        const organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
        databaseBuilder.factory.buildMembership({
          organizationId: organization.id,
          userId: adminIsManagingStudent.id,
          organizationRole: Membership.roles.ADMIN,
        });

        const student = databaseBuilder.factory.buildUser.withRawPassword();
        const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          division: 'aDivision',
          userId: student.id,
        });

        const session = databaseBuilder.factory.buildSession({
          version: AlgorithmEngineVersion.V3,
          publishedAt: new Date(),
        });

        const candidate = databaseBuilder.factory.buildCertificationCandidate({
          organizationLearnerId: organizationLearner.id,
          userId: student.id,
          sessionId: session.id,
        });
        databaseBuilder.factory.buildCoreSubscription({ certificationCandidateId: candidate.id });

        const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
          userId: candidate.userId,
          sessionId: session.id,
          isPublished: true,
        });

        const assessment = databaseBuilder.factory.buildAssessment({
          userId: candidate.userId,
          certificationCourseId: certificationCourse.id,
          type: Assessment.types.CERTIFICATION,
          state: 'completed',
        });

        databaseBuilder.factory.buildAssessmentResult.last({
          certificationCourseId: certificationCourse.id,
          assessmentId: assessment.id,
          status: AssessmentResult.status.VALIDATED,
        });

        await databaseBuilder.commit();

        const server = await createServer();

        const options = {
          method: 'GET',
          url: `/api/organizations/${organization.id}/certification-attestations?division=aDivision&isFrenchDomainExtension=true&lang=fr`,
          headers: generateAuthenticatedUserRequestHeaders({ userId: adminIsManagingStudent.id }),
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal('application/pdf');
        expect(response.headers['content-disposition']).to.equal(
          `attachment; filename=${organizationLearner.division.toLowerCase()}-certification-pix-${dayjs(session.publishedAt).format('YYYYMMDD')}.pdf`,
        );
        expect(response.file).not.to.be.null;
      });
    });
  });
});

async function _buildDatabaseCertification({
  userId,
  certificationCourseId = 10,
  sessionId = 12,
  sessionVersion = AlgorithmEngineVersion.V2,
}) {
  const session = databaseBuilder.factory.buildSession({
    id: sessionId,
    publishedAt: new Date('2018-12-01T01:02:03Z'),
    version: sessionVersion,
  });
  const badge = databaseBuilder.factory.buildBadge({ key: 'charlotte_aux_fraises' });
  const cc = databaseBuilder.factory.buildComplementaryCertification({ key: 'A' });
  const ccBadge = databaseBuilder.factory.buildComplementaryCertificationBadge({
    complementaryCertificationId: cc.id,
    badgeId: badge.id,
    imageUrl: 'http://tarte.fr/mirabelle.png',
    isTemporaryBadge: false,
    label: 'tarte à la mirabelle',
    certificateMessage: 'Miam',
    stickerUrl: 'http://example.net/stickers/macaron_pixclea.pdf',
  });
  const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
    sessionId: session.id,
    id: certificationCourseId,
    userId,
    isPublished: true,
    maxReachableLevelOnCertificationDate: 3,
    verificationCode: await generateCertificateVerificationCode(),
  });
  const assessment = databaseBuilder.factory.buildAssessment({
    userId,
    certificationCourseId: certificationCourse.id,
    type: Assessment.types.CERTIFICATION,
    state: 'completed',
  });
  const assessmentResult = databaseBuilder.factory.buildAssessmentResult.last({
    certificationCourseId: certificationCourse.id,
    assessmentId: assessment.id,
    level: 1,
    pixScore: 23,
    status: 'validated',
  });
  const { id } = databaseBuilder.factory.buildComplementaryCertificationCourse({
    certificationCourseId: certificationCourse.id,
    complementaryCertificationBadgeId: ccBadge.id,
    complementaryCertificationId: cc.id,
    name: 'patisseries au fruits',
  });
  databaseBuilder.factory.buildComplementaryCertificationCourseResult({
    complementaryCertificationCourseId: id,
    complementaryCertificationBadgeId: ccBadge.id,
  });
  return { userId, session, badge, certificationCourse, assessment, assessmentResult };
}
