import Joi from 'joi';

import { identifiersType } from '../../../shared/domain/types/identifiers-type.js';
import { certificateController } from './certificate-controller.js';

const register = async function (server) {
  server.route([
    {
      method: 'POST',
      path: '/api/shared-certifications',
      config: {
        validate: {
          payload: Joi.object({
            verificationCode: Joi.string().min(10).max(10),
          }),
        },
        auth: false,
        handler: certificateController.getCertificateByVerificationCode,
        notes: [
          "- **Route accessible par n'importe qui**\n" +
            '- Récupération des informations d’une certification d’un utilisateur' +
            ' via un code de vérification',
        ],
        tags: ['api', 'certifications', 'shared-certifications'],
      },
    },
    {
      method: 'GET',
      path: '/api/certifications/{certificationCourseId}',
      config: {
        validate: {
          params: Joi.object({
            certificationCourseId: identifiersType.certificationCourseId,
          }),
        },
        handler: certificateController.getCertificate,
        notes: [
          '- **Route nécessitant une authentification**\n' +
            '- Seules les certifications de l’utilisateur authentifié sont accessibles\n' +
            '- Récupération des informations d’une certification de l’utilisateur courant',
        ],
        tags: ['api', 'certifications'],
      },
    },
    {
      method: 'GET',
      path: '/api/certifications',
      config: {
        handler: certificateController.findUserCertificates,
        notes: [
          '- **Route nécessitant une authentification**\n' +
            '- Récupération de toutes les certifications complétées de l’utilisateur courant',
        ],
        tags: ['api', 'certifications'],
      },
    },
  ]);
};

const name = 'certificate-routes';
export { name, register };
