const isExpo = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AWS_PROJECT_REGION

export const amplifyConfig = {
  aws_project_region: isExpo
    ? process.env.EXPO_PUBLIC_AWS_PROJECT_REGION
    : process.env.NEXT_PUBLIC_AWS_PROJECT_REGION,
  aws_cognito_region: isExpo
    ? process.env.EXPO_PUBLIC_AWS_COGNITO_REGION
    : process.env.NEXT_PUBLIC_AWS_COGNITO_REGION,
  aws_user_pools_id: isExpo
    ? process.env.EXPO_PUBLIC_AWS_USER_POOLS_ID
    : process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id: isExpo
    ? process.env.EXPO_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID
    : process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
  oauth: {},
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['NAME', 'EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
  },
  aws_cognito_verification_mechanisms: ['EMAIL'],
}
