from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        # Throttle by IP address, not by user (since they're not authenticated yet)
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class SignupRateThrottle(SimpleRateThrottle):
    scope = 'signup'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
    

class PasswordResetRateThrottle(SimpleRateThrottle):
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}