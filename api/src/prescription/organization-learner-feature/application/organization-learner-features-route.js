import Joi from 'joi';

import { securityPreHandlers } from '../../../shared/application/security-pre-handlers.js';
import { organizationLearnerFeaturesController } from './organization-learner-features-controller.js';

const register = async function (server) {
  server.route([
    {
      method: 'POST',
      path: '/api/organizations/{organizationId}/organization-learners/{organizationLearnerId}/features/{featureKey}',
      config: {
        pre: [
          {
            method: securityPreHandlers.checkUserBelongsToOrganization,
            assign: 'checkUserBelongsToOrganization',
          },
          {
            method: securityPreHandlers.checkUserBelongsToLearnersOrganization,
            assign: 'checkUserBelongsToLearnersOrganization',
          },
          {
            method: securityPreHandlers.checkOrganizationHasFeature,
            assign: 'checkOrganizationHasFeature',
          },
        ],
        validate: {
          params: Joi.object({
            featureKey: Joi.string().required(),
            organizationId: Joi.number().integer().required(),
            organizationLearnerId: Joi.number().integer().required(),
          }),
        },
        handler: organizationLearnerFeaturesController.create,
        notes: [
          '- **Cette route est restreinte aux utilisateurs authentifiés**\n' +
            "- L'utisateur doit être au moins membre de l'organisation'",
        ],
        tags: ['api', 'organization'],
      },
    },
    {
      method: 'DELETE',
      path: '/api/organizations/{organizationId}/organization-learners/{organizationLearnerId}/features/{featureKey}',
      config: {
        pre: [
          {
            method: securityPreHandlers.checkUserBelongsToOrganization,
            assign: 'checkUserBelongsToOrganization',
          },
          {
            method: securityPreHandlers.checkUserBelongsToLearnersOrganization,
            assign: 'checkUserBelongsToLearnersOrganization',
          },
          {
            method: securityPreHandlers.checkOrganizationHasFeature,
            assign: 'checkOrganizationHasFeature',
          },
        ],
        validate: {
          params: Joi.object({
            featureKey: Joi.string().required(),
            organizationId: Joi.number().integer().required(),
            organizationLearnerId: Joi.number().integer().required(),
          }),
        },
        handler: organizationLearnerFeaturesController.unlink,
        notes: [
          '- **Cette route est restreinte aux utilisateurs authentifiés**\n' +
            "- L'utisateur doit être au moins membre de l'organisation'",
        ],
        tags: ['api', 'organization'],
      },
    },
  ]);
};

const name = 'organization-learner-feature-route';
export { name, register };
