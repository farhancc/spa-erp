import { SetMetadata } from '@nestjs/common';

export const FEATURES_KEY = 'features';

/**
 * Restrict a route to tenants whose active plan enables the specified feature.
 *
 * @example
 * @RequiresFeature('whatsappEnabled')
 * @Post('send')
 * sendMessage() { ... }
 */
export const RequiresFeature = (feature: string) => SetMetadata(FEATURES_KEY, feature);
