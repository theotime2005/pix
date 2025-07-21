import * as questParticipationRoute from './application/combined-course-route.js';
import * as questRoute from './application/quest-route.js';
import * as verifiedCodeRoute from './application/verified-code-route.js';

const questRoutes = [questParticipationRoute, questRoute, verifiedCodeRoute];

export { questRoutes };
