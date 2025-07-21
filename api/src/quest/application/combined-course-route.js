import Joi from 'joi';

import { combinedCourseController } from './combined-course-controller.js';

const register = async function (server) {
  server.route([
    {
      method: 'GET',
      path: '/api/combined-courses',
      config: {
        handler: combinedCourseController.getByCode,
        validate: {
          query: Joi.object({
            filter: Joi.object({
              code: Joi.string()
                .regex(/^[a-zA-Z0-9]*$/)
                .required(),
            }).required(),
          }),
        },
        notes: ['- Récupération du parcours combiné dont le code est spécifié dans les filtres de la requête'],
        tags: ['api', 'quest'],
      },
    },
    {
      method: 'PUT',
      path: '/api/combined-courses/{code}/start',
      config: {
        validate: {
          params: Joi.object({
            code: Joi.string().regex(/^[a-zA-Z0-9]*$/),
          }),
        },
        handler: combinedCourseController.start,
        notes: ["- Démarre un parcours combiné pour l'utilisateur connecté."],
        tags: ['api', 'combined-courses'],
      },
    },
  ]);
};
const name = 'combined-courses-api';
export { name, register };
