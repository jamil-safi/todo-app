from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'core.authentication.CookieJWTAuthentication'
    name = 'cookieAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'access_token',
            'description': 'JWT access token sent as an httpOnly cookie. Obtain by logging in via /auth/login/.',
        }