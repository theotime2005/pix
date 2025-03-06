import { UnauthorizedError } from '../../../shared/application/http-errors.js';

const createAccessTokenFromRefreshToken = async function ({
  refreshToken,
  requestedApplication,
  refreshTokenRepository,
  tokenService,
}) {
  const foundRefreshToken = await refreshTokenRepository.findByToken({ token: refreshToken });

  if (!foundRefreshToken) {
    throw new UnauthorizedError('Refresh token is invalid', 'INVALID_REFRESH_TOKEN');
  }

  const audience = requestedApplication.origin;
  if (!foundRefreshToken.hasSameAudience(audience)) {
    throw new UnauthorizedError('Refresh token is invalid', 'INVALID_REFRESH_TOKEN');
  }

  return tokenService.createAccessTokenFromUser({
    userId: foundRefreshToken.userId,
    source: foundRefreshToken.source,
    audience,
  });
};

export { createAccessTokenFromRefreshToken };
