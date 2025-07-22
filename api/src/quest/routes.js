import * as combinedCourseRoute from './application/combined-course-route.js';
import * as questRoute from './application/quest-route.js';
import * as verifiedCodeRoute from './application/verified-code-route.js';

const questRoutes = [combinedCourseRoute, questRoute, verifiedCodeRoute];

export { questRoutes };
