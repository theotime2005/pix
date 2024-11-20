import { Challenge, Skill } from '../../domain/models/index.js';
import { challengeDatasource } from '../datasources/learning-content/index.js';

const findValidatedByCompetenceId = async function (competenceId, locale) {
  _assertLocaleIsDefined(locale);
  const challengeDataObjects = await challengeDatasource.findValidatedByCompetenceId(competenceId, locale);
  return _toDomainCollection(challengeDataObjects);
};

export { findValidatedByCompetenceId };

function _assertLocaleIsDefined(locale) {
  if (!locale) {
    throw new Error('Locale shall be defined');
  }
}

function _toDomainCollection(challengeDataObjects) {
  return challengeDataObjects.map((challengeDataObject) => _toDomain(challengeDataObject));
}

function _toDomain(challengeDataObject) {
  return new Challenge({
    id: challengeDataObject.id,
    type: challengeDataObject.type,
    status: challengeDataObject.status,
    instruction: challengeDataObject.instruction,
    alternativeInstruction: challengeDataObject.alternativeInstruction,
    proposals: challengeDataObject.proposals,
    timer: challengeDataObject.timer,
    illustrationUrl: challengeDataObject.illustrationUrl,
    attachments: challengeDataObject.attachments,
    embedUrl: challengeDataObject.embedUrl,
    embedTitle: challengeDataObject.embedTitle,
    embedHeight: challengeDataObject.embedHeight,
    webComponentTagName: challengeDataObject.webComponentTagName,
    webComponentProps: challengeDataObject.webComponentProps,
    skill: new Skill({ id: challengeDataObject.skillId }),
    competenceId: challengeDataObject.competenceId,
    illustrationAlt: challengeDataObject.illustrationAlt,
    format: challengeDataObject.format,
    locales: challengeDataObject.locales,
    autoReply: challengeDataObject.autoReply,
    focused: challengeDataObject.focusable,
    discriminant: challengeDataObject.alpha,
    difficulty: challengeDataObject.delta,
    responsive: challengeDataObject.responsive,
    shuffled: challengeDataObject.shuffled,
    alternativeVersion: challengeDataObject.alternativeVersion,
    blindnessCompatibility: challengeDataObject.accessibility1,
    colorBlindnessCompatibility: challengeDataObject.accessibility2,
  });
}
